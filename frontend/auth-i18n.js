// Dipakai bareng oleh login.html, signup.html, forgot-password.html.
// Baca preferensi bahasa dari localStorage 'lang' yang sama dipakai app.js utama,
// supaya konsisten sama toggle ID/EN di halaman chat.
const AUTH_I18N = {
  id: {
    loginHeading: 'Masuk ke akun',
    submitLogin: 'Masuk',
    noAccountText: 'Belum punya akun?',
    signupLink: 'Daftar di sini',
    forgotLink: 'Lupa password?',
    guestLink: 'Lanjut tanpa akun →',
    tosNoteHtml: 'Dengan masuk, kamu menyetujui <a href="terms.html">Syarat Layanan</a> dan <a href="privacy.html">Kebijakan Privasi</a> kami.',

    signupHeading: 'Buat akun baru',
    namePlaceholder: 'Nama (opsional)',
    passwordSignupPlaceholder: 'Password (min 8 karakter)',
    tosCheckboxHtml: 'Saya menyetujui <a href="terms.html" target="_blank">Syarat Layanan</a> dan <a href="privacy.html" target="_blank">Kebijakan Privasi</a> OBBY AI',
    submitSignup: 'Daftar',
    haveAccountText: 'Sudah punya akun?',
    loginLink: 'Login di sini',

    forgotHeading: 'Lupa Password',
    forgotDesc: 'Masukkan email akun kamu, kami kirim kode OTP 6 digit ke email tersebut.',
    sendOtpBtn: 'Kirim Kode OTP',
    backToLogin: '← Kembali ke Login',
    resetHeading: 'Masukkan Kode',
    resetDescTemplate: 'Kode OTP sudah dikirim ke {email}. Cek juga folder Spam kalau belum muncul.',
    newPasswordPlaceholder: 'Password baru (min 8 karakter)',
    resetBtn: 'Reset Password',
    resendBtn: 'Kirim ulang kode',

    verifyHeading: 'Verifikasi Email',
    verifyDescTemplate: 'Kode OTP sudah dikirim ke {email}. Cek juga folder Spam kalau belum muncul.',
    verifyBtn: 'Verifikasi',
    msgVerifying: 'Memverifikasi...',
    msgEmailNotFound: 'Email tidak ditemukan, silakan daftar/login ulang.',

    emailPlaceholder: 'Email',
    passwordPlaceholder: 'Password',

    msgProcessing: 'Memproses...',
    msgSuccessRedirectChat: 'Berhasil! Mengalihkan ke chat...',
    msgNeedsVerification: 'Email belum diverifikasi, mengalihkan...',
    msgTosRequired: 'Kamu harus menyetujui Syarat Layanan dulu',
    msgSuccessCheckEmail: 'Berhasil! Cek email untuk kode verifikasi...',
    msgSendingCode: 'Mengirim kode...',
    msgSuccessRedirectLogin: 'Berhasil! Mengalihkan ke login...',
    msgResending: 'Mengirim ulang...',
    msgResentSuccess: 'Kode baru sudah dikirim.',
  },
  en: {
    loginHeading: 'Sign in to your account',
    submitLogin: 'Sign In',
    noAccountText: "Don't have an account?",
    signupLink: 'Sign up here',
    forgotLink: 'Forgot password?',
    guestLink: 'Continue without an account →',
    tosNoteHtml: 'By signing in, you agree to our <a href="terms.html">Terms of Service</a> and <a href="privacy.html">Privacy Policy</a>.',

    signupHeading: 'Create a new account',
    namePlaceholder: 'Name (optional)',
    passwordSignupPlaceholder: 'Password (min 8 characters)',
    tosCheckboxHtml: "I agree to OBBY AI's <a href=\"terms.html\" target=\"_blank\">Terms of Service</a> and <a href=\"privacy.html\" target=\"_blank\">Privacy Policy</a>",
    submitSignup: 'Sign Up',
    haveAccountText: 'Already have an account?',
    loginLink: 'Log in here',

    forgotHeading: 'Forgot Password',
    forgotDesc: "Enter your account email, we'll send a 6-digit OTP code to that email.",
    sendOtpBtn: 'Send OTP Code',
    backToLogin: '← Back to Login',
    resetHeading: 'Enter Code',
    resetDescTemplate: "The OTP code has been sent to {email}. Also check your Spam folder if it hasn't appeared.",
    newPasswordPlaceholder: 'New password (min 8 characters)',
    resetBtn: 'Reset Password',
    resendBtn: 'Resend code',

    verifyHeading: 'Verify Email',
    verifyDescTemplate: "The OTP code has been sent to {email}. Also check your Spam folder if it hasn't appeared.",
    verifyBtn: 'Verify',
    msgVerifying: 'Verifying...',
    msgEmailNotFound: 'Email not found, please sign up/log in again.',

    emailPlaceholder: 'Email',
    passwordPlaceholder: 'Password',

    msgProcessing: 'Processing...',
    msgSuccessRedirectChat: 'Success! Redirecting to chat...',
    msgNeedsVerification: 'Email not verified, redirecting...',
    msgTosRequired: 'You must agree to the Terms of Service first',
    msgSuccessCheckEmail: 'Success! Check your email for the verification code...',
    msgSendingCode: 'Sending code...',
    msgSuccessRedirectLogin: 'Success! Redirecting to login...',
    msgResending: 'Resending...',
    msgResentSuccess: 'New code has been sent.',
  },
};

function getAuthLang() {
  const lang = localStorage.getItem('lang');
  return lang === 'en' ? 'en' : 'id';
}

// t('key') -> ambil teks sesuai bahasa aktif. Dukung {placeholder} sederhana lewat argumen kedua.
function t(key, vars) {
  const lang = getAuthLang();
  let str = (AUTH_I18N[lang] && AUTH_I18N[lang][key]) || AUTH_I18N.id[key] || key;
  if (vars) {
    Object.keys(vars).forEach((k) => { str = str.replace(`{${k}}`, vars[k]); });
  }
  return str;
}

// Terapkan ke semua elemen yang punya atribut data-i18n / data-i18n-html / data-i18n-placeholder.
function applyAuthI18n() {
  document.documentElement.lang = getAuthLang();
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-html]').forEach((el) => {
    el.innerHTML = t(el.dataset.i18nHtml);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    el.setAttribute('placeholder', t(el.dataset.i18nPlaceholder));
  });
}

document.addEventListener('DOMContentLoaded', applyAuthI18n);
