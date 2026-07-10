const bcrypt = require('bcryptjs');
const { pool, initDb } = require('../db');
const { isValidEmail, setCors, handlePreflight } = require('../lib/authHelpers');
const { sendOtpEmail } = require('../lib/mailer');

function generateOtp() {
  // 6 digit, dari "000000" sampai "999999"
  return String(Math.floor(100000 + Math.random() * 900000));
}

module.exports = async (req, res) => {
  setCors(req, res);
  if (handlePreflight(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    await initDb();
    const { email } = req.body;

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'Format email tidak valid' });
    }
    const normalizedEmail = email.toLowerCase();

    // Selalu balas sukses walau email gak terdaftar, biar orang lain gak bisa
    // "menebak" email mana yang punya akun (mencegah user enumeration).
    const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    const userExists = userResult.rows.length > 0;

    if (userExists) {
      // Rate limit sederhana: tolak kalau ada permintaan OTP dalam 60 detik terakhir.
      const recent = await pool.query(
        `SELECT created_at FROM password_reset_otps
         WHERE email = $1 AND created_at > NOW() - INTERVAL '60 seconds'
         ORDER BY created_at DESC LIMIT 1`,
        [normalizedEmail]
      );
      if (recent.rows.length > 0) {
        return res.status(429).json({ error: 'Tunggu sebentar sebelum minta kode lagi' });
      }

      const otp = generateOtp();
      const otpHash = await bcrypt.hash(otp, 10);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 menit

      await pool.query(
        'INSERT INTO password_reset_otps (email, otp_hash, expires_at) VALUES ($1, $2, $3)',
        [normalizedEmail, otpHash, expiresAt]
      );

      try {
        await sendOtpEmail(normalizedEmail, otp);
      } catch (mailErr) {
        console.error('Gagal kirim email OTP:', mailErr.message);
        return res.status(500).json({ error: 'Gagal mengirim email. Coba lagi nanti.' });
      }
    }

    res.json({ message: 'Kalau email terdaftar, kode OTP sudah dikirim.' });
  } catch (err) {
    console.error('Forgot-password error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
};
