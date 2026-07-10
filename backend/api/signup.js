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

    const normalizedEmail = email.toLowerCase();
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email sudah terdaftar' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (email, password_hash, name, email_verified) VALUES ($1, $2, $3, FALSE)',
      [normalizedEmail, passwordHash, name || null]
    );

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await pool.query(
      'INSERT INTO email_verification_otps (email, otp_hash, expires_at) VALUES ($1, $2, $3)',
      [normalizedEmail, otpHash, expiresAt]
    );

    try {
      await sendOtpEmail(normalizedEmail, otp, 'verify');
    } catch (mailErr) {
      console.error('Gagal kirim email verifikasi:', mailErr.message);
      return res.status(500).json({ error: 'Akun dibuat, tapi gagal mengirim email verifikasi. Coba resend nanti.' });
    }

    res.status(201).json({ email: normalizedEmail, message: 'Kode verifikasi sudah dikirim ke email' });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
};
