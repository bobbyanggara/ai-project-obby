# Fitur Lupa Password (OTP via Resend)

## File baru
- `backend/lib/mailer.js` — kirim email OTP lewat Resend API
- `backend/api/forgot-password.js` — endpoint minta kode OTP
- `backend/api/reset-password.js` — endpoint verifikasi OTP + ganti password
- `frontend/forgot-password.html` — halaman 2 langkah (masukkan email → masukkan OTP + password baru)

## File yang diubah
- `backend/db.js` — tambah tabel `password_reset_otps`
- `backend/server.js` — mount 2 endpoint baru
- `frontend/auth.js` — tambah `requestPasswordResetOtp()` dan `resetPassword()`
- `frontend/login.html` — tambah link "Lupa password?"

## Setup Resend (langkah baru)

### 1. Daftar akun
Buka [resend.com](https://resend.com) → daftar gratis (gak perlu kartu kredit)

### 2. Buat API Key
1. Di dashboard, buka menu **API Keys**
2. Klik **Create API Key** → kasih nama bebas (misal "obby-ai-prod")
3. Copy API key-nya (formatnya `re_xxxxxxxxxxxxx`) — **cuma muncul sekali**, langsung simpan

### 3. Tambahkan ke Environment Variables Vercel
- Key: `RESEND_API_KEY`
- Value: API key dari langkah 2

### 4. (Opsional tapi disarankan nanti) Verifikasi domain sendiri
Untuk sekarang, kode saya pakai alamat default `onboarding@resend.dev` yang **bisa langsung dipakai tanpa setup domain**. Ini cukup untuk testing dan tahap awal.

Nanti kalau project sudah serius dan kamu punya domain sendiri (misal `obbyai.com`):
1. Di dashboard Resend → **Domains** → **Add Domain**
2. Ikuti instruksi tambah DNS record (biasanya di penyedia domain kamu, misal Niagahoster/Namecheap)
3. Setelah verified, tambahkan env variable baru: `RESEND_FROM_EMAIL` = `OBBY AI <noreply@obbyai.com>`

### 5. Redeploy
Push semua file, redeploy seperti biasa.

## Cara kerja alurnya

1. User klik "Lupa password?" di `login.html` → masuk ke `forgot-password.html`
2. Masukkan email → `POST /api/forgot-password`
   - Backend generate OTP 6 digit acak, hash-nya disimpan di DB (bukan plain text), berlaku **10 menit**
   - Kirim email lewat Resend
   - **Response selalu sukses** walau email gak terdaftar (mencegah orang lain menebak-nebak email mana yang punya akun)
3. User masukkan kode OTP + password baru → `POST /api/reset-password`
   - Backend cek: OTP cocok, belum expired, belum pernah dipakai
   - Kalau valid → password di-update, OTP ditandai "used" (gak bisa dipakai ulang)
4. Redirect ke halaman login

## Proteksi yang sudah ada
- Rate limit: user gak bisa minta OTP baru dalam 60 detik setelah request sebelumnya (cegah spam ke Resend & ke email orang)
- OTP expired otomatis setelah 10 menit
- OTP di-hash di database (kalau database bocor, OTP lama gak bisa dipakai buat nebak)
- OTP ditandai "used" setelah berhasil dipakai — gak bisa dipakai 2 kali
- Response `/api/forgot-password` gak bocorin apakah email terdaftar atau tidak

## Testing setelah deploy
```js
// 1. Minta OTP
fetch('https://ai-project-obby.vercel.app/api/forgot-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'emailkamu@gmail.com' })
}).then(r => r.json()).then(console.log)

// 2. Cek email kamu, ambil kode 6 digit, lalu:
fetch('https://ai-project-obby.vercel.app/api/reset-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'emailkamu@gmail.com', otp: '123456', newPassword: 'passwordBaru123' })
}).then(r => r.json()).then(console.log)
```

## Catatan soal "gratis"
Resend free tier: **100 email/hari, 3.000 email/bulan** — cukup banyak untuk tahap awal-menengah. Kalau nanti traffic-nya jauh lebih besar, baru perlu pertimbangkan upgrade paid plan mereka.
