// Ditaruh di lib/ (bukan api/) supaya TIDAK dianggap Vercel sebagai endpoint sendiri.
//
// Kenapa Brevo (bukan Resend)? Resend butuh domain terverifikasi (DNS record) supaya
// bisa kirim ke SEMUA email -- selama belum verifikasi domain, cuma bisa kirim ke
// email akun Resend sendiri. Brevo cuma minta verifikasi 1 ALAMAT EMAIL TUNGGAL
// (masukin kode 6 digit yang dikirim ke email itu, gak perlu DNS/domain), dan setelah
// itu bisa kirim ke siapapun. Gratis 300 email/hari, selamanya, tanpa kartu kredit.
const BREVO_API_KEY = process.env.BREVO_API_KEY;

// Ganti dengan email yang sudah kamu verifikasi di dashboard Brevo
// (Settings -> Senders, domains, IPs -> Senders -> Add a sender).
// Boleh pakai email Gmail biasa, gak wajib domain sendiri.
const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL;
const SENDER_NAME = process.env.BREVO_SENDER_NAME || 'OBBY AI';

async function sendOtpEmail(toEmail, otp) {
  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 420px; margin: 0 auto; padding: 24px;">
      <h2 style="color:#111;">Reset Password OBBY AI</h2>
      <p style="color:#444; font-size: 14px;">
        Gunakan kode berikut untuk reset password kamu. Kode ini berlaku selama 10 menit.
      </p>
      <div style="font-size: 32px; font-weight: 700; letter-spacing: 8px; background:#f4f4f7; padding: 16px; border-radius: 10px; text-align:center; margin: 20px 0;">
        ${otp}
      </div>
      <p style="color:#888; font-size: 12px;">
        Kalau kamu tidak meminta reset password, abaikan email ini.
      </p>
    </div>
  `;

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'api-key': BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: { name: SENDER_NAME, email: SENDER_EMAIL },
      to: [{ email: toEmail }],
      subject: `${otp} adalah kode reset password OBBY AI kamu`,
      htmlContent,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Brevo API error: ${res.status} - ${errText}`);
  }

  return res.json();
}

module.exports = { sendOtpEmail };
