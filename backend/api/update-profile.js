const { pool, initDb } = require('../db');
const { requireAuth, setCors, handlePreflight } = require('../lib/authHelpers');

module.exports = async (req, res) => {
  setCors(req, res);
  if (handlePreflight(req, res)) return;
  if (req.method !== 'POST' && req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const payload = requireAuth(req, res);
  if (!payload) return;

  try {
    await initDb();
    const { name, nickname } = req.body;

    if (name !== undefined && !name.trim()) {
      return res.status(400).json({ error: 'Nama lengkap tidak boleh kosong' });
    }

    const result = await pool.query(
      `UPDATE users
       SET name = COALESCE(NULLIF($1, ''), name),
           nickname = $2
       WHERE id = $3
       RETURNING id, email, name, nickname, created_at`,
      [name ? name.trim() : null, nickname ? nickname.trim() : null, payload.id]
    );

    if (!result.rows[0]) return res.status(404).json({ error: 'User tidak ditemukan' });
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('Update-profile error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
};
