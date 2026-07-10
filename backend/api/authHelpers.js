const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

// Set header CORS manual di tiap function, karena di Vercel tiap file di /api
// jadi function terpisah -- gak lewat middleware app.use(cors()) di server.js lagi.
function setCors(req, res) {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

// Tangani preflight OPTIONS. Return true kalau sudah di-handle (caller harus stop).
function handlePreflight(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}

// Wajib ada token valid. Return payload user kalau valid, atau null + langsung
// kirim response 401 kalau tidak valid (caller tinggal `if (!payload) return;`).
function requireAuth(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token tidak ditemukan' });
    return null;
  }
  try {
    return jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
  } catch (err) {
    res.status(401).json({ error: 'Token tidak valid atau kadaluarsa' });
    return null;
  }
}

// Token opsional (dipakai kalau nanti /api/chat mau tau user login atau tidak,
// tapi tetap boleh lanjut sebagai guest kalau tokennya gak ada/invalid).
function optionalAuth(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
  } catch (err) {
    return null;
  }
}

module.exports = { isValidEmail, signToken, setCors, handlePreflight, requireAuth, optionalAuth, JWT_SECRET };
