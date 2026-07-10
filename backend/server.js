require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// ==== Serve frontend (PWA) ====
// Ini yang bikin index.html, manifest.json, service-worker.js, icon,
// dan style.css bisa diakses lewat browser
app.use(express.static(path.join(__dirname, 'frontend')));

// Routes
const chatHandler = require('./api/chat');
const { router: authRouter } = require('./api/auth');
const conversationsRouter = require('./api/conversations');

// Auth endpoints: /api/signup, /api/login, /api/me
app.use('/api', authRouter);

// Sinkronisasi riwayat chat (wajib login): GET & PUT /api/conversations
app.use('/api/conversations', conversationsRouter);

// Chat endpoint
app.post('/api/chat', chatHandler);

// Health check (opsional, buat cek server hidup atau tidak)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Fallback: kalau route tidak ketemu di /api, kirim index.html
// (supaya refresh di halaman apapun tetap bisa load app)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
