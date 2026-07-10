// Helper auth yang dipakai bareng oleh login.html, signup.html, dan app.js.
// Taruh script ini SEBELUM app.js di index.html.
(function () {
  const API_BASE = 'https://ai-project-obby.vercel.app'; // sama dengan BACKEND_BASE_URL di app.js
  const TOKEN_KEY = 'obby_token';
  const USER_KEY = 'obby_user';

  async function postJson(path, body) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  }

  async function requestSignupOtp({ name, email, password }) {
    return postJson('/api/signup/request-otp', { name, email, password });
  }

  async function verifySignupOtp({ email, otp }) {
    return postJson('/api/signup/verify-otp', { email, otp });
  }

  async function login({ email, password }) {
    return postJson('/api/login', { email, password });
  }

  async function requestPasswordResetOtp(email) {
    return postJson('/api/forgot-password', { email });
  }

  async function resetPassword({ email, otp, newPassword }) {
    return postJson('/api/reset-password', { email, otp, newPassword });
  }

  function setSession(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function getUser() {
    try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); }
    catch { return null; }
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  // Verifikasi token ke server (dipakai app.js saat load, biar tahu token masih valid).
  async function verifySession() {
    const token = getToken();
    if (!token) return null;
    try {
      const res = await fetch(`${API_BASE}/api/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { logout(); return null; }
      const data = await res.json();
      return data.user;
    } catch {
      return null; // gagal terhubung -> anggap belum tentu invalid, biarkan app.js retry nanti
    }
  }

  // ---------- Sinkronisasi riwayat chat ----------
  async function fetchServerConversations() {
    const token = getToken();
    if (!token) return null;
    const res = await fetch(`${API_BASE}/api/conversations`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.conversations;
  }

  async function pushServerConversations(conversations) {
    const token = getToken();
    if (!token) return false;
    try {
      const res = await fetch(`${API_BASE}/api/conversations`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ conversations }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  window.ObbyAuth = {
    API_BASE,
    requestSignupOtp,
    verifySignupOtp,
    login,
    logout,
    setSession,
    getToken,
    getUser,
    verifySession,
    fetchServerConversations,
    pushServerConversations,
    requestPasswordResetOtp,
    resetPassword,
  };
})();
