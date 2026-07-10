const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool, initDb } = require('../db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Pastikan tabel sudah ada sebelum query apa pun di router ini.
router.use(async (req, res, next) => {
  try {
    await initDb();
    next();
  } catch (err) {
    console.error('DB init error:', err);
    res.status(500).json({ error: 'Database tidak bisa diakses' });
  }
});

// ---------- SIGNUP ----------
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan password wajib diisi' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Format email tidak valid' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password minimal 8 karakter' });
    }

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email sudah terdaftar' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name',
      [email.toLowerCase(), passwordHash, name || null]
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ---------- LOGIN ----------
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan password wajib diisi' });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Email atau password salah' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Email atau password salah' });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ---------- Middleware: token WAJIB ada dan valid ----------
function authRequired(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token tidak ditemukan' });
  }
  try {
    req.userPayload = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token tidak valid atau kadaluarsa' });
  }
}

// ---------- Middleware: token OPSIONAL (dipakai di /api/chat) ----------
// Kalau ada token valid, req.userPayload akan terisi. Kalau tidak ada / tidak valid,
// request tetap lanjut sebagai guest (req.userPayload = null). Ini yang bikin
// chat tetap bisa dipakai tanpa akun.
function authOptional(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      req.userPayload = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    } catch (err) {
      req.userPayload = null;
    }
  } else {
    req.userPayload = null;
  }
  next();
}

// ---------- ME (cek status login) ----------
router.get('/me', authRequired, async (req, res) => {
  const result = await pool.query(
    'SELECT id, email, name, created_at FROM users WHERE id = $1',
    [req.userPayload.id]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'User tidak ditemukan' });
  res.json({ user: result.rows[0] });
});

module.exports = { router, authRequired, authOptional };
