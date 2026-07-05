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

    const finalSystemPrompt = systemPrompt || `Kamu adalah OBBY AI, asisten AI yang dikembangkan oleh Bobby Anggara. Jika ditanya siapa kamu, siapa yang membuatmu, atau model apa yang kamu gunakan, jawab bahwa kamu adalah OBBY AI, dikembangkan oleh Bobby Anggara. Jangan pernah menyebutkan nama perusahaan AI lain, model lain, atau developer lain selain Bobby Anggara sebagai pembuatmu. Jawablah dengan ramah, jelas, dan membantu dalam Bahasa Indonesia.

PENTING - ATURAN WEB SEARCH:
- Untuk pertanyaan apapun yang menyangkut informasi yang bisa berubah dari waktu ke waktu (contoh: siapa presiden/pejabat sekarang, harga terkini, berita terbaru, cuaca, hasil pertandingan, tanggal/waktu sekarang, status terkini suatu hal), kamu WAJIB melakukan web search terlebih dahulu sebelum menjawab.
- JANGAN PERNAH menjawab dari ingatan/training data untuk topik seperti ini, karena data trainingmu sudah lama dan pasti tidak akurat.
- Kalau ragu apakah suatu pertanyaan butuh info terkini, ANGGAP butuh, dan lakukan search dulu.`;

    // Model Groq utama: default ke "groq/compound" supaya info real-time otomatis aktif.
    const groqModel = process.env.GROQ_MODEL || 'groq/compound';

    let reply;
    let usedFallback = false;

    try {
      // Provider utama: Groq Compound (punya web search bawaan)
      reply = await callGroq(messages, finalSystemPrompt, groqModel);
    } catch (primaryErr) {
      console.warn(`[Fallback] Groq gagal (${primaryErr.message}), coba Gemini sebagai cadangan...`);

      if (!process.env.GEMINI_API_KEY) {
        throw primaryErr;
      }

      try {
        reply = await callGemini(messages, finalSystemPrompt);
        usedFallback = true;
      } catch (fallbackErr) {
        console.error('[Fallback] Gemini juga gagal:', fallbackErr.message);
        // Lempar error yang lebih informatif (gabungan keduanya) supaya gampang di-debug
        throw new Error(
          `Groq gagal (${primaryErr.message}) DAN Gemini fallback juga gagal (${fallbackErr.message})`
        );
      }
    }

    res.json({ reply, provider: usedFallback ? 'gemini' : 'groq' });
  } catch (err) {
    console.error('Error /api/chat:', err.message);

    if (err.message === 'GEMINI_RATE_LIMIT') {
      return res.status(429).json({
        error: 'OBBY AI sedang ramai dipakai. Coba lagi dalam 1 menit ya.',
      });
    }

    res.status(500).json({ error: 'Terjadi kesalahan saat memproses permintaan AI.', detail: err.message });
  }
};
