# AI Agent Chat — Source Code Mentah

Proyek sederhana untuk membuat website AI Agent (chatbot) mirip ChatGPT.
Terdiri dari 2 bagian:

- **backend/** — Server Node.js (Express) yang menjadi jembatan ke API AI (Anthropic Claude atau OpenAI GPT).
- **frontend/** — Halaman chat berbasis HTML/CSS/JS murni (tanpa framework, tanpa build step), mirip tampilan ChatGPT dengan sidebar riwayat obrolan.

## Struktur Folder

```
ai-chat-app/
├── backend/
│   ├── server.js
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── index.html
    ├── style.css
    └── app.js
```

## Cara Menjalankan

### 1. Siapkan Backend

```bash
cd backend
npm install
cp .env.example .env
```

Buka file `.env` dan isi API key Anda:

- Jika pakai **Anthropic (Claude)**: isi `ANTHROPIC_API_KEY` dan pastikan `AI_PROVIDER=anthropic`.
  Dapatkan API key di https://console.anthropic.com
- Jika pakai **OpenAI (GPT)**: isi `OPENAI_API_KEY` dan ubah `AI_PROVIDER=openai`.
  Dapatkan API key di https://platform.openai.com

Jalankan server:

```bash
npm start
```

Server backend akan berjalan di `http://localhost:3001`.

### 2. Jalankan Frontend

Frontend ini adalah file statis biasa, jadi tinggal dibuka langsung atau pakai server statis ringan:

```bash
cd frontend
npx serve .
```

Atau cukup buka file `index.html` langsung di browser (pastikan backend sudah berjalan).

## Fitur yang Sudah Ada

- Antarmuka chat mirip ChatGPT (sidebar, bubble pesan, input area)
- Riwayat percakapan tersimpan di browser (localStorage)
- Mendukung 2 provider AI: Anthropic Claude & OpenAI GPT (tinggal pilih lewat `.env`)
- Indikator "AI sedang mengetik..."
- Kirim pesan dengan Enter, baris baru dengan Shift+Enter

## Yang Bisa Dikembangkan Lebih Lanjut

- Autentikasi pengguna (login/register)
- Streaming respons AI (token demi token) alih-alih menunggu jawaban penuh
- Penyimpanan riwayat di database (PostgreSQL/MongoDB) alih-alih localStorage
- Upload file/gambar ke chat
- Fitur "tools" / pemanggilan fungsi (function calling) agar AI bisa melakukan aksi nyata
- Deploy ke layanan seperti Vercel/Render (backend) dan Netlify/Vercel (frontend)

## Catatan Penting

- Source code ini adalah **kerangka dasar (starter)**, bukan produk siap-pakai. Anda perlu menambahkan keamanan (rate limiting, validasi input, autentikasi) sebelum dipakai untuk publik.
- Jangan pernah meng-commit file `.env` berisi API key asli ke repository publik.
