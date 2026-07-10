const express = require('express');
const { pool, initDb } = require('../db');
const { authRequired } = require('./auth');

const router = express.Router();

router.use(async (req, res, next) => {
  try {
    await initDb();
    next();
  } catch (err) {
    console.error('DB init error:', err);
    res.status(500).json({ error: 'Database tidak bisa diakses' });
  }
});

// Semua route di sini WAJIB login, karena kalau guest, riwayat cukup di localStorage saja.
router.use(authRequired);

// ---------- Ambil riwayat chat milik user ----------
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT conversations FROM user_conversations WHERE user_id = $1',
      [req.userPayload.id]
    );
    const conversations = result.rows[0] ? result.rows[0].conversations : [];
    res.json({ conversations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil riwayat chat' });
  }
});

// ---------- Simpan (replace) seluruh riwayat chat milik user ----------
// Body: { conversations: [...] } -- persis format array yang dipakai app.js di localStorage.
router.put('/', async (req, res) => {
  try {
    const { conversations } = req.body;
    if (!Array.isArray(conversations)) {
      return res.status(400).json({ error: 'conversations harus berupa array' });
    }

    await pool.query(
      `INSERT INTO user_conversations (user_id, conversations, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET conversations = $2, updated_at = NOW()`,
      [req.userPayload.id, JSON.stringify(conversations)]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal menyimpan riwayat chat' });
  }
});

module.exports = router;
