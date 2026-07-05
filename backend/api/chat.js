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

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: { parts: [{ text: finalSystemPrompt }] },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errText}`);
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
