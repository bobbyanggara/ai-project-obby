const bcrypt = require('bcryptjs');
const { pool, initDb } = require('../db');
const { setCors, handlePreflight } = require('../lib/authHelpers');

module.exports = async (req, res) => {
  setCors(req, res);
  if (handlePreflight(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    await initDb();
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, kode OTP, dan password baru wajib diisi' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password baru minimal 8 karakter' });
    }

    const normalizedEmail = email.toLowerCase();

    const otpResult = await pool.query(
      `SELECT * FROM password_reset_otps
       WHERE email = $1 AND used = FALSE AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [normalizedEmail]
    );
    const otpRow = otpResult.rows[0];

    if (!otpRow) {
      return res.status(400).json({ error: 'Kode OTP tidak valid atau sudah kadaluarsa' });
    }

    const otpMatch = await bcrypt.compare(otp, otpRow.otp_hash);
    if (!otpMatch) {
      return res.status(400).json({ error: 'Kode OTP salah' });
    }

    const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    const user = userResult.rows[0];
    if (!user) {
      return res.status(404).json({ error: 'Akun tidak ditemukan' });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newPasswordHash, user.id]);

    // Tandai OTP ini sudah dipakai, supaya gak bisa dipakai ulang.
    await pool.query('UPDATE password_reset_otps SET used = TRUE WHERE id = $1', [otpRow.id]);

    res.json({ message: 'Password berhasil diganti. Silakan login dengan password baru.' });
  } catch (err) {
    console.error('Reset-password error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
};
