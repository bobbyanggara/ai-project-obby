require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const PROVIDER = process.env.AI_PROVIDER || 'groq';

async function callGroq(messages, systemPrompt) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
    }),
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API error: ${response.status} - ${errText}`);
  }
  const data = await response.json();
  return data.choices[0].message.content;
}

app.post('/api/chat', async (req, res) => {
  try {
    const { messages, systemPrompt } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages harus berupa array dan tidak boleh kosong' });
    }
    const finalSystemPrompt = systemPrompt || 'Kamu adalah asisten AI yang ramah, jelas, dan membantu pengguna.';
    const reply = await callGroq(messages, finalSystemPrompt);
    res.json({ reply });
  } catch (err) {
    console.error('Error /api/chat:', err.message);
    res.status(500).json({ error: 'Terjadi kesalahan saat memproses permintaan AI.', detail: err.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', provider: PROVIDER });
});

app.listen(3001, "0.0.0.0", () => {
  console.log("Server jalan di port 3001");
});
