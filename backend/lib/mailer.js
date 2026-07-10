// Ditaruh di lib/ (bukan api/) supaya TIDAK dianggap Vercel sebagai endpoint sendiri.
const RESEND_API_KEY = process.env.RESEND_API_KEY;

// Alamat default Resend, bisa dipakai tanpa perlu verifikasi domain sendiri.
// Kalau nanti kamu punya domain sendiri yang sudah diverifikasi di Resend,
// ganti FROM_EMAIL ke misalnya "OBBY AI <noreply@obbyai.com>".
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'OBBY AI <onboarding@resend.dev>';

async function sendOtpEmail(toEmail, otp) {
  const html = `
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

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [toEmail],
      subject: `${otp} adalah kode reset password OBBY AI kamu`,
      html,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Resend API error: ${res.status} - ${errText}`);
  }

  return res.json();
}

module.exports = { sendOtpEmail };
