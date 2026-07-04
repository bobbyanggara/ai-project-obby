# TODO - Auth Login/Signup (Cookie JWT + SQLite)

## Selesai
- [x] Konfirmasi: pakai cookie HTTP-only (tanpa localStorage), DB SQLite, chat wajib login.
- [x] Backend routing auth + chat.
- [x] `backend/api/auth.js` dibersihkan jadi versi tunggal (signup/login/logout/me).
- [x] `backend/api/chat.js` pakai `requireAuth`.
- [x] `frontend/app.js` kirim cookie JWT saat fetch chat (`credentials: 'include'`).

## Tahap Implementasi (Frontend)
1. [ ] Tambah modal popup login/signup + logout di `frontend/index.html`.
2. [ ] Tambah state UI (logged in / logged out) di `frontend/app.js`.
3. [ ] Handle respon `401` dari `/api/chat` → tampilkan modal login.
4. [ ] Implement submit:
   - [ ] Signup → `POST /api/auth/signup`
   - [ ] Login → `POST /api/auth/login`
5. [ ] Logout → `POST /api/auth/logout` lalu sembunyikan chat.

## Catatan Setup Backend
- [ ] Pastikan dependency backend terpasang.
- [ ] Pastikan `.env` ada `GROQ_API_KEY` dan `JWT_SECRET`.

