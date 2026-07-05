module.exports = async (req, res) => {
  // CORS
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { messages, systemPrompt } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages harus berupa array dan tidak boleh kosong' });
    }

    const finalSystemPrompt = systemPrompt || `Kamu adalah OBBY AI, asisten AI yang dikembangkan oleh Bobby. Kamu BUKAN ChatGPT, BUKAN produk OpenAI, dan tidak boleh menyebut dirimu sebagai ChatGPT atau OpenAI dalam kondisi apapun. Jika ditanya siapa kamu, siapa yang membuatmu, atau model apa yang kamu gunakan, jawab bahwa kamu adalah OBBY AI, dikembangkan oleh Bobby. Jangan pernah menyebutkan nama perusahaan AI lain, model lain, atau developer lain selain Bobby sebagai pembuatmu. Jawablah dengan ramah, jelas, dan membantu dalam Bahasa Indonesia.`;

    // Gemini pakai role "user" dan "model" (bukan "assistant"), dan tidak ada role "system" di dalam contents.
    const contents = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const geminiBody = JSON.stringify({
      contents,
      systemInstruction: { parts: [{ text: finalSystemPrompt }] },
      tools: [{ google_search: {} }], // aktifkan pencarian real-time via Google Search
    });

    // Retry otomatis khusus untuk error yang bersifat sementara dari server Gemini
    // (503 = overload, 429 = rate limit). Percobaan ke-2 dan ke-3 diberi jeda (backoff)
    // supaya tidak langsung menembak lagi saat server masih sibuk.
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
      const isRetryable = response.status === 503 || response.status === 429;

      if (!isRetryable || attempt === MAX_ATTEMPTS) {
        throw new Error(`Gemini API error: ${response.status} - ${lastErrText}`);
      }

      // Backoff: tunggu 500ms, lalu 1000ms sebelum coba lagi
      await new Promise((r) => setTimeout(r, 500 * attempt));
      console.warn(`Percobaan ${attempt} gagal (status ${response.status}), mencoba lagi...`);
    }

    const data = await response.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      throw new Error('Gemini tidak mengembalikan jawaban (kemungkinan diblokir oleh filter keamanan).');
    }

    res.json({ reply });
  } catch (err) {
    console.error('Error /api/chat:', err.message);
    res.status(500).json({ error: 'Terjadi kesalahan saat memproses permintaan AI.', detail: err.message });
  }
};
