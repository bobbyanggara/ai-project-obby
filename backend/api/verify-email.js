const bcrypt = require('bcryptjs');
const { pool, initDb } = require('../db');
const { signToken, setCors, handlePreflight } = require('../lib/authHelpers');

module.exports = async (req, res) => {
  setCors(req, res);
  if (handlePreflight(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    await initDb();
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email dan kode OTP wajib diisi' });
    }
    const normalizedEmail = email.toLowerCase();

    const otpResult = await pool.query(
      `SELECT * FROM email_verification_otps
       WHERE email = $1 AND used = FALSE AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [normalizedEmail]
    );
    const otpRow = otpResult.rows[0];
    if (!otpRow) {
      return res.status(400).json({ error: 'Kode OTP tidak valid atau sudah kadaluarsa' });
    }

    const match = await bcrypt.compare(otp, otpRow.otp_hash);
    if (!match) {
      return res.status(400).json({ error: 'Kode OTP salah' });
    }

    const userResult = await pool.query(
      'UPDATE users SET email_verified = TRUE WHERE email = $1 RETURNING id, email, name',
      [normalizedEmail]
    );
    const user = userResult.rows[0];
    if (!user) return res.status(404).json({ error: 'Akun tidak ditemukan' });

    await pool.query('UPDATE email_verification_otps SET used = TRUE WHERE id = $1', [otpRow.id]);

    const token = signToken({ id: user.id, email: user.email });
    res.json({ token, user });
  } catch (err) {
    console.error('Verify-email error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
};
