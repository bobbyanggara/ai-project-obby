const { Pool } = require('pg');

// Neon/Supabase: pastikan pakai connection string mode "Pooled"/"Transaction"
// karena Vercel serverless bikin banyak koneksi singkat.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

let dbReady = false;

async function initDb() {
  if (dbReady) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT,
      email_verified BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  // Kalau tabel users sudah ada dari sebelumnya (belum punya kolom ini), tambahkan.
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;`);
  // Nama panggilan (opsional, dipakai buat sapaan). "name" tetap dipakai sebagai nama lengkap.
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS nickname TEXT;`);

  // Simpan seluruh array "conversations" milik user sebagai satu JSONB blob.
  // Ini sengaja dibuat semirip mungkin dengan struktur yang sudah ada di
  // localStorage (app.js), supaya sinkronisasi jadi sederhana: tinggal
  // kirim/replace array-nya, tanpa perlu skema relational per pesan.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_conversations (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      conversations JSONB NOT NULL DEFAULT '[]',
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // OTP untuk fitur lupa password. otp_hash disimpan ter-hash (bukan plain text),
  // sama seperti prinsip password. Satu baris per permintaan reset.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS password_reset_otps (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      otp_hash TEXT NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      used BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_password_reset_otps_email ON password_reset_otps (email);
  `);

  // OTP untuk verifikasi email saat signup (struktur sama persis dengan reset password).
  await pool.query(`
    CREATE TABLE IF NOT EXISTS email_verification_otps (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      otp_hash TEXT NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      used BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_email_verification_otps_email ON email_verification_otps (email);
  `);

  dbReady = true;
}

module.exports = { pool, initDb };
