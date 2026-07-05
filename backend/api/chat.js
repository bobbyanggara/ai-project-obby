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
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
        messages: [{ role: 'system', content: finalSystemPrompt }, ...messages],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq API error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    res.json({ reply: data.choices[0].message.content });
  } catch (err) {
    console.error('Error /api/chat:', err.message);
    res.status(500).json({ error: 'Terjadi kesalahan saat memproses permintaan AI.', detail: err.message });
  }
};