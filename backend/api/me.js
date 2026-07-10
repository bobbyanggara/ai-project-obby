const { pool, initDb } = require('../db');
const { requireAuth, setCors, handlePreflight } = require('../lib/authHelpers');

module.exports = async (req, res) => {
  setCors(req, res);
  if (handlePreflight(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const payload = requireAuth(req, res);
  if (!payload) return; // requireAuth sudah kirim response 401

  try {
    await initDb();
    const result = await pool.query(
      'SELECT id, email, name, created_at FROM users WHERE id = $1',
      [payload.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'User tidak ditemukan' });
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
};
