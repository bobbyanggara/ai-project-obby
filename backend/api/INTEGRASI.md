# Integrasi Login/Signup ke OBBY AI — Panduan

## ⚠️ UPDATE PENTING (perbaikan struktur file)
Versi awal saya buat `api/auth.js` dan `api/conversations.js` sebagai **Express Router**.
Ternyata `vercel.json` project kamu memakai konvensi **filesystem routing**: tiap file
langsung di `/api` otomatis jadi 1 endpoint sendiri dan HARUS export function polos
`(req, res) => {...}`, persis seperti `api/chat.js` kamu. Export berbentuk Router/object
gak dikenali Vercel, makanya kemarin 404.

**Sekarang sudah diperbaiki**: tiap endpoint auth jadi file terpisah, semuanya export
function polos:
- `api/signup.js`
- `api/login.js`
- `api/me.js`
- `api/conversations.js` (GET & PUT digabung, dibedakan lewat `req.method`)
- `lib/authHelpers.js` — helper bersama (JWT, CORS, dll). Sengaja ditaruh di folder
  `lib/` (bukan `api/`) supaya **TIDAK** ikut dianggap Vercel sebagai endpoint sendiri.

Kalau kamu sudah sempat push versi lama (`api/auth.js` yang Router), **hapus file itu**
dan ganti dengan struktur baru ini.

## File baru (tambahkan ke project kamu)
- `backend/db.js` — koneksi database + bikin tabel
- `backend/lib/authHelpers.js` — helper JWT & CORS bersama
- `backend/api/signup.js`, `api/login.js`, `api/me.js`, `api/conversations.js` — endpoint auth
- `frontend/login.html`, `frontend/signup.html` — halaman form
- `frontend/auth.js` — helper dipakai bareng login.html, signup.html, app.js

## File yang DIUBAH (replace file lama kamu)
- `backend/server.js` — mounting endpoint baru (buat local dev testing)
- `frontend/index.html` — nambah tombol "Login / Daftar" + include `auth.js`
- `frontend/app.js` — nambah logic cek sesi, sinkronisasi riwayat, tombol logout

`backend/api/chat.js` **TIDAK diubah** — chat tetap bisa dipakai tanpa login (guest mode).

## Langkah setup

### 1. Install dependency baru
```bash
cd backend
npm install bcryptjs jsonwebtoken pg
```

### 2. Database Supabase
Pastikan `DATABASE_URL` di Vercel pakai connection string mode **Transaction/Pooler**
(port `6543`), format URI, sudah diganti passwordnya.

### 3. Environment Variables di Vercel
- `DATABASE_URL` → connection string Supabase
- `JWT_SECRET` → string acak panjang (generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)

### 4. Push semua file & Redeploy
Push semua file di atas (termasuk **hapus** `api/auth.js` versi lama kalau sempat ke-push),
lalu redeploy di Vercel.

### 5. Test tiap endpoint langsung dulu (sebelum lewat halaman)
```js
// Signup
fetch('https://ai-project-obby.vercel.app/api/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'test@email.com', password: 'password123', name: 'Test' })
}).then(r => r.json()).then(console.log)
```
Kalau ini sudah balikin `{ token, user }`, lanjut ke `/api/login`, lalu `/api/me` pakai
token itu (`Authorization: Bearer <token>`), baru terakhir `/api/conversations`.

## Cara kerja alurnya

**Guest (tanpa login):** chat tetap jalan seperti sekarang, riwayat cuma di localStorage.

**Setelah login:** `initAuthSync()` di `app.js` cek token ke `/api/me`, tarik riwayat dari
`/api/conversations`, upload riwayat guest kalau ini login pertama kali, lalu tiap ada
perubahan chat otomatis sync ke server (didelay 1.2 detik).

**Endpoint:**
| Method | Path | Auth | Fungsi |
|---|---|---|---|
| POST | `/api/signup` | - | Daftar akun baru |
| POST | `/api/login` | - | Login, dapat token |
| GET | `/api/me` | wajib | Cek status login |
| GET | `/api/conversations` | wajib | Ambil riwayat chat dari server |
| PUT | `/api/conversations` | wajib | Simpan/replace riwayat chat di server |

## Catatan keamanan
- Password di-hash bcrypt
- Token JWT expired 30 hari
- `optionalAuth` di `lib/authHelpers.js` disediakan kalau nanti mau personalisasi ringan
  ke `/api/chat`, tapi belum dipasang karena chat sengaja tetap bisa diakses guest
