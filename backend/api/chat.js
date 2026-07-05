// ---------- Groq Compound (provider utama, ada web search bawaan) ----------
// "groq/compound" adalah sistem dari Groq yang otomatis melakukan web search
// kalau pertanyaan butuh info terkini (real-time), tanpa perlu setup tambahan.
// Masih dalam free tier Groq yang sama, cuma beda nama model.
async function callGroq(messages, finalSystemPrompt, model) {
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
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  const reply = data?.choices?.[0]?.message?.content;

  if (!reply) {
    throw new Error('Groq tidak mengembalikan jawaban.');
  }

  return reply;
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

  const searchEnabled = process.env.ENABLE_SEARCH === 'true';

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

    const finalSystemPrompt = systemPrompt || `Kamu adalah OBBY AI, asisten AI yang dikembangkan oleh Bobby Anggara.

PENTING - ATURAN WEB SEARCH:
- Untuk PERTANYAAN apapun yang menyangkut informasi yang bisa berubah dari waktu ke waktu (contoh: siapa presiden/pejabat sekarang, harga terkini, berita terbaru, cuaca, hasil pertandingan, tanggal/waktu sekarang, status terkini suatu hal), kamu WAJIB melakukan web search terlebih dahulu sebelum menjawab.
- JANGAN PERNAH menjawab dari ingatan/training data untuk topik seperti ini, karena data trainingmu sudah lama dan pasti tidak akurat.
- Kalau ragu apakah suatu pertanyaan butuh info terkini, ANGGAP butuh, dan lakukan search dulu.
- Setelah search, jawab berdasarkan hasil search tersebut, jangan campur dengan asumsi lama.`;
    // Model Groq utama: default ke "groq/compound" supaya info real-time otomatis aktif.
    const groqModel = process.env.GROQ_MODEL || 'groq-beta';

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
        throw primaryErr;
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
