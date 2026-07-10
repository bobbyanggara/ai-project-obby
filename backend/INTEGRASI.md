# Integrasi Login/Signup ke OBBY AI — Panduan

## File baru (tinggal tambahkan ke project kamu)
- `backend/db.js` — koneksi database + bikin tabel
- `backend/api/auth.js` — endpoint signup, login, me
- `backend/api/conversations.js` — endpoint sinkronisasi riwayat chat
- `frontend/login.html`, `frontend/signup.html` — halaman form
- `frontend/auth.js` — helper dipakai bareng login.html, signup.html, app.js

## File yang DIUBAH (sudah saya edit, tinggal replace file lama kamu)
- `backend/server.js` — nambah 2 baris `app.use(...)` untuk router baru
- `frontend/index.html` — nambah tombol "Login / Daftar" + include `auth.js`
- `frontend/app.js` — nambah logic cek sesi, sinkronisasi riwayat, tombol logout

`backend/api/chat.js` **TIDAK saya ubah** — chat tetap bisa dipakai tanpa login (guest mode), sesuai yang kamu pilih.

## Langkah setup

### 1. Install dependency baru
```bash
cd backend
npm install bcryptjs jsonwebtoken pg
```

### 2. Siapkan database (Neon atau Supabase)
Ambil connection string mode **Pooled** (Neon) atau **Transaction** (Supabase) — penting untuk serverless.

### 3. Environment Variables di Vercel
Tambahkan di **Settings → Environment Variables**:
- `DATABASE_URL` → connection string dari Neon/Supabase
- `JWT_SECRET` → generate dengan `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### 4. Ganti `API_BASE` di `frontend/auth.js`
Sudah saya set ke `https://ai-project-obby.vercel.app` (sama dengan `BACKEND_BASE_URL` di `app.js` kamu). Kalau URL Vercel kamu beda, sesuaikan di baris pertama `auth.js`.

### 5. Deploy
Push semua file (backend + frontend) ke repo yang sudah terhubung ke Vercel project kamu.

## Cara kerja alurnya

**Guest (tanpa login):**
- Chat tetap jalan seperti sekarang, riwayat cuma di localStorage
- Tombol "Login / Daftar" muncul di sidebar

**Setelah login:**
- `initAuthSync()` di `app.js` otomatis: cek token ke `/api/me`, lalu tarik riwayat dari server
- Kalau ini login pertama kali (server masih kosong) → riwayat guest yang ada di localStorage otomatis di-upload ke server
- Kalau server sudah ada riwayat → digabung dengan yang di localStorage (tanpa duplikat)
- Setiap ada perubahan (kirim pesan, hapus, rename, dll) → `saveConversations()` otomatis sinkron ke server juga (didelay 1.2 detik biar tidak spam request)
- Tombol berubah jadi "Logout"

**Endpoint yang ditambahkan:**
| Method | Path | Auth | Fungsi |
|---|---|---|---|
| POST | `/api/signup` | - | Daftar akun baru |
| POST | `/api/login` | - | Login, dapat token |
| GET | `/api/me` | wajib | Cek status login |
| GET | `/api/conversations` | wajib | Ambil riwayat chat dari server |
| PUT | `/api/conversations` | wajib | Simpan/replace riwayat chat di server |

## Yang perlu kamu tes setelah deploy
1. Buka `/signup.html` → daftar akun baru → harus redirect ke `index.html` dan tombol berubah jadi "Logout"
2. Refresh halaman → status login harus tetap ada (token dari localStorage)
3. Kirim beberapa chat → buka DevTools Network tab → pastikan ada request `PUT /api/conversations` setelah ~1.2 detik
4. Logout → login lagi dengan akun yang sama → riwayat chat harus muncul kembali
5. Coba dari browser/device lain, login dengan akun yang sama → riwayat harus sinkron

## Catatan keamanan
- Password di-hash bcrypt, tidak pernah disimpan plain text
- Token JWT expired otomatis 30 hari
- `authOptional` di `api/auth.js` disediakan kalau nanti kamu mau tambah personalisasi ringan ke `/api/chat` (misal sapa dengan nama user), tapi belum dipasang karena chat memang sengaja tetap bisa diakses guest
