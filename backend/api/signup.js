const bcrypt = require('bcryptjs');
const { pool, initDb } = require('../db');
const { isValidEmail, signToken, setCors, handlePreflight } = require('../lib/authHelpers');

module.exports = async (req, res) => {
  setCors(req, res);
  if (handlePreflight(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    await initDb();
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
    const token = signToken({ id: user.id, email: user.email });
    res.status(201).json({ token, user });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
};
