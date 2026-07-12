// Ditaruh di lib/ (bukan api/) supaya TIDAK dianggap Vercel sebagai endpoint sendiri.
//
// Cloudflare Workers AI: 10.000 neuron gratis/hari, selamanya, tanpa kartu kredit.
// Model "flux-1-schnell" cepat & kualitas bagus buat text-to-image.
const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CF_IMAGE_MODEL = process.env.CLOUDFLARE_IMAGE_MODEL || '@cf/black-forest-labs/flux-1-schnell';

// Preset ukuran berdasarkan orientasi, biar gak melulu kotak.
const ORIENTATION_PRESETS = {
  square: { width: 1024, height: 1024 },
  landscape: { width: 1280, height: 768 },
  portrait: { width: 768, height: 1280 },
};

// Generate 1 gambar dari teks prompt. Return base64 string (tanpa prefix "data:...").
async function generateImage(prompt, orientation = 'landscape') {
  if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
    throw new Error('CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN belum diset di environment variables');
  }

  const { width, height } = ORIENTATION_PRESETS[orientation] || ORIENTATION_PRESETS.landscape;
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/${CF_IMAGE_MODEL}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${CF_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt, width, height }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Cloudflare image gen error: ${res.status} - ${errText}`);
  }

  const data = await res.json();
  if (!data.success || !data.result || !data.result.image) {
    throw new Error('Cloudflare image gen: respons tidak sesuai format yang diharapkan');
  }

  return data.result.image; // base64 string
}

module.exports = { generateImage };