const express = require("express");
const Groq = require("groq-sdk");
require("dotenv").config();

const app = express();
app.use(express.json());

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

app.post("/api/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;

    const response = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        { role: "user", content: userMessage }
      ]
    });

    res.json({
      reply: response.choices[0].message.content
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(3001, () => {
  console.log("Server running on port 3001");
});	
