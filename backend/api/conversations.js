const { pool, initDb } = require('../db');
const { requireAuth, setCors, handlePreflight } = require('../lib/authHelpers');

module.exports = async (req, res) => {
  setCors(req, res);
  if (handlePreflight(req, res)) return;

  const payload = requireAuth(req, res);
  if (!payload) return; // requireAuth sudah kirim response 401

  try {
    await initDb();

    if (req.method === 'GET') {
      const result = await pool.query(
        'SELECT conversations FROM user_conversations WHERE user_id = $1',
        [payload.id]
      );
      const conversations = result.rows[0] ? result.rows[0].conversations : [];
      return res.json({ conversations });
    }

    if (req.method === 'PUT') {
      const { conversations } = req.body;
      if (!Array.isArray(conversations)) {
        return res.status(400).json({ error: 'conversations harus berupa array' });
      }
      await pool.query(
        `INSERT INTO user_conversations (user_id, conversations, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (user_id)
         DO UPDATE SET conversations = $2, updated_at = NOW()`,
        [payload.id, JSON.stringify(conversations)]
      );
      return res.json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Conversations error:', err);
    res.status(500).json({ error: 'Gagal memproses riwayat chat' });
  }
};
