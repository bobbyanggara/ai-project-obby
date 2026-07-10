const bcrypt = require('bcryptjs');
const { pool, initDb } = require('../db');
const { isValidEmail, setCors, handlePreflight } = require('../lib/authHelpers');
const { sendOtpEmail } = require('../lib/mailer');

function generateOtp() {
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

    const userResult = await pool.query(
      'SELECT email_verified FROM users WHERE email = $1',
      [normalizedEmail]
    );
    const user = userResult.rows[0];
    if (!user) return res.status(404).json({ error: 'Akun tidak ditemukan' });
    if (user.email_verified) return res.status(400).json({ error: 'Email sudah terverifikasi' });

    const recent = await pool.query(
      `SELECT created_at FROM email_verification_otps
       WHERE email = $1 AND created_at > NOW() - INTERVAL '60 seconds'
       ORDER BY created_at DESC LIMIT 1`,
      [normalizedEmail]
    );
    if (recent.rows.length > 0) {
      return res.status(429).json({ error: 'Tunggu sebentar sebelum minta kode lagi' });
    }

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await pool.query(
      'INSERT INTO email_verification_otps (email, otp_hash, expires_at) VALUES ($1, $2, $3)',
      [normalizedEmail, otpHash, expiresAt]
    );

    await sendOtpEmail(normalizedEmail, otp, 'verify');
    res.json({ message: 'Kode verifikasi baru sudah dikirim' });
  } catch (err) {
    console.error('Resend-verification error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
};
