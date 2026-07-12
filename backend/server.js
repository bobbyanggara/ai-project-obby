require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); // dinaikkan dari default 100kb, buat nampung gambar base64
app.use(cookieParser());

// ==== Serve frontend (PWA) ====
// Ini yang bikin index.html, manifest.json, service-worker.js, icon,
// dan style.css bisa diakses lewat browser
app.use(express.static(path.join(__dirname, 'frontend')));

// Routes
const chatHandler = require('./api/chat');
const signupHandler = require('./api/signup');
const loginHandler = require('./api/login');
const meHandler = require('./api/me');
const conversationsHandler = require('./api/conversations');
const forgotPasswordHandler = require('./api/forgot-password');
const resetPasswordHandler = require('./api/reset-password');
const verifyEmailHandler = require('./api/verify-email');
const resendVerificationHandler = require('./api/resend-verification');
const updateProfileHandler = require('./api/update-profile');

// Auth endpoints
app.all('/api/signup', signupHandler);
app.all('/api/login', loginHandler);
app.all('/api/me', meHandler);
app.all('/api/conversations', conversationsHandler);
app.all('/api/forgot-password', forgotPasswordHandler);
app.all('/api/reset-password', resetPasswordHandler);
app.all('/api/verify-email', verifyEmailHandler);
app.all('/api/resend-verification', resendVerificationHandler);
app.all('/api/update-profile', updateProfileHandler);

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
