// ---------- Groq Compound (provider utama, ada web search bawaan) ----------
// "groq/compound" adalah sistem dari Groq yang otomatis melakukan web search
// kalau pertanyaan butuh info terkini (real-time), tanpa perlu setup tambahan.
// Masih dalam free tier Groq yang sama, cuma beda nama model.
async function callGroq(messages, finalSystemPrompt, model) {
  const MAX_ATTEMPTS = 3;
  const TIMEOUT_MS = 25000; // 25 detik, compound bisa lebih lambat karena web search

  let lastErr;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'system', content: finalSystemPrompt }, ...messages],
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text();

        // Rate limit atau server sibuk: coba lagi kalau masih ada percobaan tersisa
        const isRetryable = response.status === 429 || response.status === 503;
        if (isRetryable && attempt < MAX_ATTEMPTS) {
          console.warn(`[Groq] Percobaan ${attempt} gagal (status ${response.status}), mencoba lagi...`);
          await new Promise((r) => setTimeout(r, 700 * attempt));
          continue;
        }

        throw new Error(`Groq API error: ${response.status} - ${errText}`);
      }

      const data = await response.json();
      const reply = data?.choices?.[0]?.message?.content;

      // Log tool yang dijalankan (web search dll) untuk debugging
      const executedTools = data?.choices?.[0]?.message?.executed_tools;
      if (executedTools) {
        console.log('[Groq] Executed tools:', JSON.stringify(executedTools, null, 2));
      } else {
        console.log('[Groq] Tidak ada tool yang dijalankan (jawab langsung tanpa search).');
      }

      if (!reply) {
        throw new Error('Groq tidak mengembalikan jawaban.');
      }

      return reply;
    } catch (err) {
      clearTimeout(timeoutId);
      lastErr = err;

      if (err.name === 'AbortError') {
        console.warn(`[Groq] Percobaan ${attempt} timeout setelah ${TIMEOUT_MS}ms.`);
        if (attempt < MAX_ATTEMPTS) {
          await new Promise((r) => setTimeout(r, 700 * attempt));
          continue;
        }
        throw new Error('Groq timeout setelah beberapa percobaan.');
      }

      // Error non-retryable (misalnya error API key, dsb) atau sudah percobaan terakhir
      if (attempt === MAX_ATTEMPTS) throw err;
    }
  }

  throw lastErr || new Error('Groq gagal tanpa detail error.');
}

// ---------- Gemini (provider cadangan) ----------
async function callGemini(messages, finalSystemPrompt) {
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  // Aktifkan grounding search Gemini secara default supaya fallback tetap dapat info
  // terkini, bukan cuma pengetahuan lama modelnya. Bisa dimatikan lewat .env kalau perlu.
  const searchEnabled = process.env.ENABLE_SEARCH !== 'false';

  const geminiBody = JSON.stringify({
    contents,
    systemInstruction: { parts: [{ text: finalSystemPrompt }] },
    ...(searchEnabled ? { tools: [{ google_search: {} }] } : {}),
  });

  const MAX_ATTEMPTS = 3;
  let response, lastErrText;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: geminiBody,
    });

    if (response.ok) break;

    lastErrText = await response.text();

    if (response.status === 429) {
      throw new Error('GEMINI_RATE_LIMIT');
    }

    const isRetryable = response.status === 503;
    if (!isRetryable || attempt === MAX_ATTEMPTS) {
      throw new Error(`Gemini API error: ${response.status} - ${lastErrText}`);
    }

    await new Promise((r) => setTimeout(r, 500 * attempt));
    console.warn(`[Gemini] Percobaan ${attempt} gagal (status ${response.status}), mencoba lagi...`);
  }

  const data = await response.json();
  const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!reply) {
    throw new Error('Gemini tidak mengembalikan jawaban (kemungkinan diblokir oleh filter keamanan).');
  }

  return reply;
}

// ---------- OpenRouter (provider cadangan ke-2, 100% gratis) ----------
// openrouter/free adalah router otomatis dari OpenRouter yang memilih
// model gratis (:free) mana pun yang sedang tersedia. Tidak perlu kartu kredit.
async function callOpenRouter(messages, finalSystemPrompt) {
  const model = process.env.OPENROUTER_MODEL || 'openrouter/free';
  const MAX_ATTEMPTS = 3;
  const TIMEOUT_MS = 25000;

  let lastErr;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          // Header ini disarankan OpenRouter (tidak wajib, tapi membantu identifikasi trafik).
          'HTTP-Referer': process.env.PUBLIC_APP_URL || 'https://ai-project-obby.vercel.app',
          'X-Title': 'OBBY AI',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'system', content: finalSystemPrompt }, ...messages],
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text();

        if (response.status === 429) {
          throw new Error('OPENROUTER_RATE_LIMIT');
        }

        const isRetryable = response.status === 503;
        if (isRetryable && attempt < MAX_ATTEMPTS) {
          console.warn(`[OpenRouter] Percobaan ${attempt} gagal (status ${response.status}), mencoba lagi...`);
          await new Promise((r) => setTimeout(r, 700 * attempt));
          continue;
        }

        throw new Error(`OpenRouter API error: ${response.status} - ${errText}`);
      }

      const data = await response.json();
      const reply = data?.choices?.[0]?.message?.content;

      if (!reply) {
        throw new Error('OpenRouter tidak mengembalikan jawaban.');
      }

      return reply;
    } catch (err) {
      clearTimeout(timeoutId);
      lastErr = err;

      if (err.message === 'OPENROUTER_RATE_LIMIT') throw err;

      if (err.name === 'AbortError') {
        console.warn(`[OpenRouter] Percobaan ${attempt} timeout setelah ${TIMEOUT_MS}ms.`);
        if (attempt < MAX_ATTEMPTS) {
          await new Promise((r) => setTimeout(r, 700 * attempt));
          continue;
        }
        throw new Error('OpenRouter timeout setelah beberapa percobaan.');
      }

      if (attempt === MAX_ATTEMPTS) throw err;
    }
  }

  throw lastErr || new Error('OpenRouter gagal tanpa detail error.');
}

// ---------- Handler utama ----------
module.exports = async (req, res) => {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { messages, systemPrompt } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages harus berupa array dan tidak boleh kosong' });
    }

    const finalSystemPrompt = systemPrompt || `Kamu adalah OBBY AI, asisten AI yang dikembangkan oleh Bobby Anggara dan Nadine Faradina Aulia.

## IDENTITAS
- Kamu adalah OBBY AI, bukan ChatGPT, Gemini, atau model AI/perusahaan lain.
- Jika ditanya siapa kamu, siapa pembuatmu, atau teknologi apa yang mendasarimu, jawab singkat: kamu adalah OBBY AI buatan Bobby Anggara dan Nadine Faradina Aulia.
- Jangan pernah menyebut nama provider, model, atau perusahaan AI lain (termasuk saat menjelaskan cara kerjamu), kecuali user secara eksplisit bertanya soal topik industri AI secara umum (bukan tentang dirimu sendiri).
- Jangan mengarang detail teknis tentang "bagaimana kamu dibuat" — cukup sampaikan kamu dikembangkan oleh Bobby Anggara dan Nadine Faradina Aulia sebagai proyek pribadi.

## ATURAN INFORMASI TERKINI (WAJIB)
Untuk pertanyaan yang jawabannya bisa berubah seiring waktu — termasuk namun tidak terbatas pada:
- Siapa yang menjabat suatu posisi (presiden, menteri, CEO, dll)
- Berita atau kejadian terbaru
- Harga, kurs, atau data pasar
- Cuaca, hasil pertandingan, jadwal acara
- Tanggal, waktu, atau "sekarang" dalam konteks apa pun

kamu WAJIB melakukan pencarian informasi terlebih dahulu sebelum menjawab. Jangan pernah menjawab topik semacam ini murni dari ingatan/pelatihanmu, karena data tersebut sudah usang.

Jika kamu ragu apakah suatu pertanyaan termasuk kategori ini, anggap IYA dan cari dulu.

Untuk pengetahuan umum yang stabil dan tidak berubah (misalnya definisi, sejarah, konsep sains, rumus matematika), kamu boleh menjawab langsung tanpa mencari.

## GAYA KOMUNIKASI
- Jawab dalam Bahasa Indonesia yang ramah, jelas, dan natural — hindari terdengar kaku atau seperti robot.
- Berikan jawaban yang ringkas namun lengkap; hindari bertele-tele.
- Jika pertanyaan ambigu, buat asumsi yang masuk akal dan sampaikan asumsi tersebut secara singkat, lalu tetap berikan jawaban.
- Gunakan format (poin, paragraf pendek) sesuai kebutuhan agar mudah dibaca.

## FORMAT MATEMATIKA, FISIKA, DAN KIMIA (WAJIB DIIKUTI)
Tampilan chat mendukung rendering LaTeX (KaTeX) dan notasi kimia (mhchem). Ikuti aturan ini SELALU supaya rumus tampil rapi, bukan teks mentah:
- Rumus/simbol matematika atau fisika yang muncul di tengah kalimat: bungkus dengan tanda dolar tunggal, contoh: kecepatan dihitung dengan $v = s/t$.
- Rumus/persamaan penting yang berdiri sendiri (biar ditampilkan besar dan jelas): bungkus dengan dua tanda dolar, contoh:
  $$E = mc^2$$
- Reaksi/rumus kimia: gunakan notasi mhchem, dibungkus tanda dolar, contoh: $\ce{2H2 + O2 -> 2H2O}$
- JANGAN pernah menulis notasi matematika sebagai teks polos seperti "x^2" atau "sqrt(x)" atau "H2O" untuk rumus kimia yang perlu subscript — selalu pakai LaTeX yang benar: $x^2$, $\sqrt{x}$, $\ce{H2O}$.
- Untuk soal hitungan step-by-step (matematika/fisika/kimia), gunakan list bernomor (1. 2. 3.) per langkah, dan taruh rumus di tiap langkah dengan notasi LaTeX seperti di atas.
- Pastikan setiap tanda dolar pembuka punya pasangan penutup yang sesuai (jangan sampai ganjil), supaya tidak gagal dirender.
- Untuk pecahan gunakan \\frac{a}{b}, untuk akar gunakan \\sqrt{}, untuk pangkat gunakan ^{}, untuk subscript gunakan _{}.

## BATASAN
- Jika kamu benar-benar tidak menemukan informasi yang dicari atau ada kendala teknis, akui dengan jujur — jangan mengarang jawaban.
- Jangan memberikan klaim yang terdengar pasti untuk hal yang sifatnya prediksi atau belum terjadi.`;
    // Model Groq utama: default ke "groq/compound" supaya info real-time otomatis aktif.
    const groqModel = process.env.GROQ_MODEL || 'groq/compound-mini';

    let reply;
    let usedProvider = 'groq';

    try {
      // Provider utama: Groq Compound (punya web search bawaan)
      reply = await callGroq(messages, finalSystemPrompt, groqModel);
    } catch (primaryErr) {
      console.warn(`[Fallback] Groq gagal (${primaryErr.message}), coba Gemini sebagai cadangan...`);

      let geminiErr = null;
      if (process.env.GEMINI_API_KEY) {
        try {
          reply = await callGemini(messages, finalSystemPrompt);
          usedProvider = 'gemini';
        } catch (err) {
          geminiErr = err;
          console.warn(`[Fallback] Gemini juga gagal (${err.message}), coba OpenRouter sebagai cadangan terakhir...`);
        }
      } else {
        console.warn('[Fallback] GEMINI_API_KEY tidak diset, lanjut coba OpenRouter...');
      }

      if (reply === undefined) {
        if (!process.env.OPENROUTER_API_KEY) {
          throw geminiErr || primaryErr;
        }

        try {
          reply = await callOpenRouter(messages, finalSystemPrompt);
          usedProvider = 'openrouter';
        } catch (openRouterErr) {
          console.error('[Fallback] OpenRouter juga gagal:', openRouterErr.message);

          if (openRouterErr.message === 'OPENROUTER_RATE_LIMIT') {
            throw openRouterErr;
          }

          // Lempar error gabungan dari ketiga provider supaya gampang di-debug
          throw new Error(
            `Groq gagal (${primaryErr.message})` +
            (geminiErr ? ` DAN Gemini gagal (${geminiErr.message})` : '') +
            ` DAN OpenRouter juga gagal (${openRouterErr.message})`
          );
        }
      }
    }

    res.json({ reply, provider: usedProvider });
  } catch (err) {
    console.error('Error /api/chat:', err.message);

    if (err.message === 'GEMINI_RATE_LIMIT' || err.message === 'OPENROUTER_RATE_LIMIT') {
      return res.status(429).json({
        error: 'OBBY AI sedang ramai dipakai. Coba lagi dalam 1 menit ya.',
      });
    }

    res.status(500).json({ error: 'Terjadi kesalahan saat memproses permintaan AI.', detail: err.message });
  }
};
