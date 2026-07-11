
const BACKEND_BASE_URL = 'https://ai-project-obby.vercel.app';
const BACKEND_URL = `${BACKEND_BASE_URL}/api/chat`;
const BASE_URL = window.location.origin;
const I18N = {
  id: {
    newChat: 'Obrolan baru',

    history: 'Riwayat',
    clearAll: 'Hapus semua riwayat',
    emptyTitle: 'Halo, ada yang bisa dibantu?',
    emptySubtitle: 'Tanyakan apa saja — dari ide, kode, sampai obrolan santai.',


    sugg1: 'Jelaskan rekursi dengan analogi',
    sugg2: 'Draft email izin sakit',
    sugg3: 'Ide nama aplikasi',
    sugg4: 'Ringkas fotosintesis',
    placeholder: 'Tanya Obby',
    hint: 'Obby adalah AI dan bisa melakukan kesalahan.',
    copy: 'Salin',
    copied: 'Disalin ke clipboard',
    editTitle: 'Edit judul',
    titleSaved: 'Judul disimpan',
    clearedAll: 'Semua riwayat dihapus',
    confirmClear: 'Hapus semua riwayat obrolan? Tindakan ini tidak bisa dibatalkan.',
    starChat: 'Beri bintang',
    unstarChat: 'Batal bintang',
    renameChat: 'Ganti judul',
    deleteChat: 'Hapus obrolan',
    renamePrompt: 'Masukkan judul baru:',
    confirmDeleteChat: 'Hapus obrolan ini? Tindakan ini tidak bisa dibatalkan.',
    deletedChat: 'Obrolan dihapus',
    starredChat: 'Obrolan diberi bintang',
    unstarredChat: 'Bintang dibatalkan',
    tooltipMenu: 'Buka menu',
    tooltipSidebarOpen: 'Buka sidebar',
    tooltipSidebarClose: 'Tutup sidebar',
    tooltipNewChat: 'Mulai obrolan baru',
    tooltipTheme: 'Ganti tema terang/gelap',
    tooltipLang: 'Ganti bahasa',
    tooltipClearAll: 'Hapus semua riwayat obrolan',
    tooltipChatOptions: 'Opsi obrolan',
    tooltipRegen: 'Buat ulang jawaban',
    tooltipSend: 'Kirim pesan',
    tooltipScrollDown: 'Ke pesan terbaru',
    systemPrompt:
'Kamu adalah OBBY AI, asisten AI yang ramah, jelas, dan membantu pengguna dalam Bahasa. Kamu dikembangkan oleh Bobby Anggara dan Partnernya Nadine Faradina Aulia, siswa SMK jurusan Rekayasa Perangkat Lunak, dengan partnernya Nadine Faradina Aulia sebagai proyek pribadi. PENTING: kamu PUNYA akses pencarian web real-time — gunakan untuk pertanyaan tentang hal yang bisa berubah (jabatan pejabat, berita terkini, harga, cuaca, hasil pertandingan, dll), jangan menjawab dari ingatan lama untuk topik semacam itu. Untuk pengetahuan umum yang tidak berubah, jawab langsung tanpa perlu mencari. Kamu dilarang menyebut dirimu sebagai ChatGPT, OpenAI, GPT, atau nama AI/perusahaan lain — kamu adalah OBBY AI, buatan Bobby Anggara.',
    errorPrefix: 'Maaf, terjadi kesalahan',
  },
  en: {
    newChat: 'New chat',

    history: 'History',
    clearAll: 'Clear all history',
    emptyTitle: 'Hi, what can I help with?',
    emptySubtitle: 'Ask anything — ideas, code, or just a chat.',
    sugg1: 'Explain recursion with an analogy',
    sugg2: 'Draft a sick leave email',
    sugg3: 'App name ideas',
    sugg4: 'Summarize photosynthesis',
    placeholder: 'Ask Obby',
    hint: 'Obby is AI and can make mistakes.',
    copy: 'Copy',
    copied: 'Copied to clipboard',
    editTitle: 'Edit title',
    titleSaved: 'Title saved',
    clearedAll: 'All history cleared',
    confirmClear: 'Clear all conversation history? This cannot be undone.',
    starChat: 'Star chat',
    unstarChat: 'Unstar chat',
    renameChat: 'Rename title',
    deleteChat: 'Delete chat',
    renamePrompt: 'Enter a new title:',
    confirmDeleteChat: 'Delete this chat? This cannot be undone.',
    deletedChat: 'Chat deleted',
    starredChat: 'Chat starred',
    unstarredChat: 'Chat unstarred',
    tooltipMenu: 'Open menu',
    tooltipSidebarOpen: 'Open sidebar',
    tooltipSidebarClose: 'Close sidebar',
    tooltipNewChat: 'Start a new chat',
    tooltipTheme: 'Toggle light/dark theme',
    tooltipLang: 'Change language',
    tooltipClearAll: 'Clear all chat history',
    tooltipChatOptions: 'Chat options',
    tooltipRegen: 'Regenerate response',
    tooltipSend: 'Send message',
    tooltipScrollDown: 'Jump to latest message',
    systemPrompt:
      'You are OBBY AI, a friendly and clear AI assistant that helps users in Bahasa. You were developed by Bobby Anggara—a vocational high school student majoring in Software Engineering—and his partner, Nadine Faradina Aulia, as a personal project. IMPORTANT: You HAVE access to real-time web search—use it for questions about things that change (official positions, breaking news, prices, weather, match results, etc.); do not answer from outdated memory for such topics. For general knowledge that does not change, answer directly without searching. You are prohibited from referring to yourself as ChatGPT, OpenAI, GPT, or any other AI or company name—you are OBBY AI, created by Bobby Anggara.'
  },
};

const LANG_CYCLE = ['id', 'en'];


let currentLang = localStorage.getItem('lang') || 'id';
if (!LANG_CYCLE.includes(currentLang)) currentLang = 'id';

// Paksa default tetap ID saat pertama kali load (tanpa mengubah preferensi kalau sudah disimpan).
if (!localStorage.getItem('lang')) {
  currentLang = 'id';
}


function t(key) { return I18N[currentLang][key] || I18N.id[key] || key; }

// ---------- Custom modal (replaces native alert/confirm/prompt) ----------
function closeCustomModal(overlay) {
  overlay.classList.remove('show');
  setTimeout(() => overlay.remove(), 180);
}

function customConfirm(message, { danger = false } = {}) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const card = document.createElement('div');
    card.className = 'modal-card';

    const msg = document.createElement('p');
    msg.className = 'modal-message';
    msg.textContent = message;

    const actions = document.createElement('div');
    actions.className = 'modal-actions';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'modal-btn';
    cancelBtn.textContent = currentLang === 'id' ? 'Batal' : 'Cancel';

    const okBtn = document.createElement('button');
    okBtn.type = 'button';
    okBtn.className = danger ? 'modal-btn danger' : 'modal-btn primary';
    okBtn.textContent = 'OK';

    function finish(result) {
      closeCustomModal(overlay);
      document.removeEventListener('keydown', onKeydown);
      resolve(result);
    }
    function onKeydown(e) {
      if (e.key === 'Escape') finish(false);
      if (e.key === 'Enter') finish(true);
    }

    cancelBtn.addEventListener('click', () => finish(false));
    okBtn.addEventListener('click', () => finish(true));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) finish(false); });
    document.addEventListener('keydown', onKeydown);

    actions.appendChild(cancelBtn);
    actions.appendChild(okBtn);
    card.appendChild(msg);
    card.appendChild(actions);
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
      overlay.classList.add('show');
      okBtn.focus();
    });
  });
}

function customPrompt(message, defaultValue = '') {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const card = document.createElement('div');
    card.className = 'modal-card';

    const msg = document.createElement('p');
    msg.className = 'modal-message';
    msg.textContent = message;

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'modal-input';
    input.value = defaultValue;

    const actions = document.createElement('div');
    actions.className = 'modal-actions';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'modal-btn';
    cancelBtn.textContent = currentLang === 'id' ? 'Batal' : 'Cancel';

    const okBtn = document.createElement('button');
    okBtn.type = 'button';
    okBtn.className = 'modal-btn primary';
    okBtn.textContent = 'OK';

    function finish(result) {
      closeCustomModal(overlay);
      document.removeEventListener('keydown', onKeydown);
      resolve(result);
    }
    function onKeydown(e) {
      if (e.key === 'Escape') finish(null);
      if (e.key === 'Enter') finish(input.value);
    }

    cancelBtn.addEventListener('click', () => finish(null));
    okBtn.addEventListener('click', () => finish(input.value));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) finish(null); });
    document.addEventListener('keydown', onKeydown);

    actions.appendChild(cancelBtn);
    actions.appendChild(okBtn);
    card.appendChild(msg);
    card.appendChild(input);
    card.appendChild(actions);
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
      overlay.classList.add('show');
      input.focus();
      input.select();
    });
  });
}

function getGreetingByLocalTime(d = new Date()) {
  const hour = d.getHours();
  if (hour >= 5 && hour <= 10) return 'Selamat pagi';
  if (hour >= 11 && hour <= 14) return 'Selamat siang';
  if (hour >= 15 && hour <= 17) return 'Selamat sore';
  return 'Selamat malam';
}

const GREETING_EN_MAP = {
  'Selamat pagi': 'Good morning',
  'Selamat siang': 'Good afternoon',
  'Selamat sore': 'Good evening',
  'Selamat malam': 'Good evening',
};

let currentUserName = null; // null = guest, diisi setelah login berhasil divalidasi
let currentUserObj = null; // objek user lengkap (id, email, name, nickname), buat isi form edit profil

function updateGreetingText() {
  const greetingId = getGreetingByLocalTime();
  const greetingEn = GREETING_EN_MAP[greetingId] || 'Good evening';
  const namePart = currentUserName ? `, ${currentUserName}` : '';
  I18N.id.emptyTitle = `${greetingId}${namePart}, ada yang bisa dibantu?`;
  I18N.en.emptyTitle = `${greetingEn}${namePart}, what can I help with?`;
}

function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  document.querySelectorAll('[data-i18n-tooltip]').forEach((el) => {
    el.setAttribute('data-tooltip', t(el.dataset.i18nTooltip));
  });
  langToggle.textContent = currentLang.toUpperCase();
  document.documentElement.lang = currentLang;
  document.querySelectorAll('.suggestion-chip').forEach((chip) => {
    chip.dataset.text = currentLang === 'id' ? chip.dataset.id : chip.dataset.en;
  });
  const conv = getCurrentConversation();
  chatTitle.textContent = conv && conv.title !== 'Obrolan baru' && conv.title !== 'New chat' ? conv.title : t('newChat');
  updateTitleDropdownLabels();
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}
let currentTheme = localStorage.getItem('theme') || 'dark';
applyTheme(currentTheme);

// ---------- Viewport fix ----------
function setVH() { document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`); }
setVH();
window.addEventListener('resize', setVH);

// ---------- Elements ----------
const messagesEl = document.getElementById('messages');
const emptyState = document.getElementById('emptyState');
const chatForm = document.getElementById('chatForm');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const newChatBtn = document.getElementById('newChatBtn');
const historyList = document.getElementById('historyList');
const chatTitle = document.getElementById('chatTitle');
const chatTitleWrap = document.getElementById('chatTitleWrap');
const titleMenuBtn = document.getElementById('titleMenuBtn');
const titleDropdown = document.getElementById('titleDropdown');
const starChatBtn = document.getElementById('starChatBtn');
const starChatLabel = document.getElementById('starChatLabel');
const renameChatBtn = document.getElementById('renameChatBtn');
const renameChatLabel = document.getElementById('renameChatLabel');
const deleteChatBtn = document.getElementById('deleteChatBtn');
const deleteChatLabel = document.getElementById('deleteChatLabel');
const menuBtn = document.getElementById('menuBtn');
const sidebarOpenBtn = document.getElementById('sidebarOpenBtn');
const closeSidebarBtn = document.getElementById('closeSidebarBtn');
const sidebar = document.getElementById('sidebar');

const backdrop = document.getElementById('backdrop');
const clearPartialBtn = document.getElementById('clearPartialBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const regenBtn = document.getElementById('regenBtn');
const toastEl = document.getElementById('toast');
const suggestionsEl = document.getElementById('suggestions');
const themeToggle = document.getElementById('themeToggle');
const langToggle = document.getElementById('langToggle');
const loginNavBtn = document.getElementById('loginNavBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userInfoBox = document.getElementById('userInfoBox');
const userInfoAvatar = document.getElementById('userInfoAvatar');
const userInfoName = document.getElementById('userInfoName');
const userInfoEmail = document.getElementById('userInfoEmail');

// ---------- State ----------
let conversations = JSON.parse(localStorage.getItem('conversations') || '[]');
let currentConvId = null;
let isGenerating = false;

let syncTimer = null;
function saveConversations() {
  localStorage.setItem('conversations', JSON.stringify(conversations));

  // Kalau user sedang login, sinkronkan juga ke server (di-debounce 1.2 detik
  // biar tidak spam request tiap kali saveConversations() dipanggil).
  if (window.ObbyAuth && ObbyAuth.getToken()) {
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => {
      ObbyAuth.pushServerConversations(conversations);
    }, 1200);
  }
}
function getCurrentConversation() { return conversations.find((c) => c.id === currentConvId); }

// ---------- Auth UI & sinkronisasi awal ----------
function updateAuthUI(user) {
  currentUserObj = user;
  currentUserName = user
    ? ((user.nickname && user.nickname.trim()) || (user.name && user.name.trim()) || user.email.split('@')[0])
    : null;
  updateGreetingText();
  applyI18n();

  if (user) {
    if (loginNavBtn) loginNavBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = '';
    if (userInfoBox) {
      userInfoBox.style.display = 'flex';
      if (userInfoAvatar) userInfoAvatar.textContent = currentUserName.charAt(0);
      if (userInfoName) userInfoName.textContent = currentUserName;
      if (userInfoEmail) userInfoEmail.textContent = user.email;
    }
  } else {
    if (loginNavBtn) loginNavBtn.style.display = '';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (userInfoBox) userInfoBox.style.display = 'none';
  }
}

if (loginNavBtn) {
  loginNavBtn.addEventListener('click', () => { window.location.href = 'login.html'; });
}
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    const backdrop = document.getElementById('logoutConfirmBackdrop');
    if (backdrop) backdrop.classList.add('open');
  });
}

const logoutBackdrop = document.getElementById('logoutConfirmBackdrop');
const logoutCancelBtn = document.getElementById('logoutCancelBtn');
const logoutConfirmBtn = document.getElementById('logoutConfirmBtn');

function closeLogoutModal() {
  if (logoutBackdrop) logoutBackdrop.classList.remove('open');
}

if (logoutCancelBtn) {
  logoutCancelBtn.addEventListener('click', closeLogoutModal);
}
if (logoutBackdrop) {
  // Klik di area gelap luar kartu juga menutup modal
  logoutBackdrop.addEventListener('click', (e) => {
    if (e.target === logoutBackdrop) closeLogoutModal();
  });
}
if (logoutConfirmBtn) {
  logoutConfirmBtn.addEventListener('click', () => {
    ObbyAuth.logout();
    updateAuthUI(null);
    closeLogoutModal();
    showToast(currentLang === 'id' ? 'Berhasil logout' : 'Logged out');
  });
}
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && logoutBackdrop && logoutBackdrop.classList.contains('open')) {
    closeLogoutModal();
  }
});

// ---------- Modal edit profil ----------
const editProfileBtn = document.getElementById('editProfileBtn');
const editProfileBackdrop = document.getElementById('editProfileBackdrop');
const editNameInput = document.getElementById('editNameInput');
const editNicknameInput = document.getElementById('editNicknameInput');
const editProfileMsg = document.getElementById('editProfileMsg');
const editProfileCancelBtn = document.getElementById('editProfileCancelBtn');
const editProfileSaveBtn = document.getElementById('editProfileSaveBtn');

function openEditProfileModal() {
  if (!currentUserObj) return;
  editNameInput.value = currentUserObj.name || '';
  editNicknameInput.value = currentUserObj.nickname || '';
  editProfileMsg.textContent = '';
  if (editProfileBackdrop) editProfileBackdrop.classList.add('open');
}
function closeEditProfileModal() {
  if (editProfileBackdrop) editProfileBackdrop.classList.remove('open');
}

if (editProfileBtn) editProfileBtn.addEventListener('click', openEditProfileModal);
if (editProfileCancelBtn) editProfileCancelBtn.addEventListener('click', closeEditProfileModal);
if (editProfileBackdrop) {
  editProfileBackdrop.addEventListener('click', (e) => {
    if (e.target === editProfileBackdrop) closeEditProfileModal();
  });
}
if (editProfileSaveBtn) {
  editProfileSaveBtn.addEventListener('click', async () => {
    const name = editNameInput.value.trim();
    const nickname = editNicknameInput.value.trim();

    if (!name) {
      editProfileMsg.style.color = '#FF6B6B';
      editProfileMsg.textContent = 'Nama lengkap tidak boleh kosong';
      return;
    }

    editProfileSaveBtn.disabled = true;
    editProfileMsg.style.color = '#aaa';
    editProfileMsg.textContent = 'Menyimpan...';

    try {
      const data = await ObbyAuth.updateProfile({ name, nickname });
      ObbyAuth.setSession(ObbyAuth.getToken(), data.user);
      updateAuthUI(data.user);
      editProfileMsg.style.color = '#6BFFB0';
      editProfileMsg.textContent = 'Berhasil disimpan!';
      setTimeout(closeEditProfileModal, 700);
    } catch (err) {
      editProfileMsg.style.color = '#FF6B6B';
      editProfileMsg.textContent = err.message;
    } finally {
      editProfileSaveBtn.disabled = false;
    }
  });
}
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && editProfileBackdrop && editProfileBackdrop.classList.contains('open')) {
    closeEditProfileModal();
  }
});

// Saat load: kalau ada token, cek valid ke server lalu tarik/merge riwayat chat.
async function initAuthSync() {
  if (!window.ObbyAuth) return; // auth.js belum ke-load (mis. lupa disertakan)
  const user = await ObbyAuth.verifySession();
  updateAuthUI(user);
  if (!user) return; // guest: tetap pakai localStorage seperti biasa

  const serverConvs = await ObbyAuth.fetchServerConversations();
  if (serverConvs === null) return; // gagal fetch, biarkan pakai localStorage dulu

  if (serverConvs.length === 0 && conversations.length > 0) {
    // Pertama kali login: belum ada apa-apa di server, upload riwayat guest yang ada.
    await ObbyAuth.pushServerConversations(conversations);
  } else {
    // Merge sederhana: gabungkan lalu hilangkan duplikat berdasarkan id,
    // data dari server jadi prioritas kalau id sama.
    const merged = [...serverConvs];
    const serverIds = new Set(serverConvs.map((c) => c.id));
    conversations.forEach((c) => { if (!serverIds.has(c.id)) merged.push(c); });
    conversations = merged;
    saveConversations();
    currentConvId = conversations.length ? conversations[0].id : null;
    renderHistory();
    renderMessages();
  }
}

// ---------- Toast ----------
let toastTimer;
function showToast(msg) {
  clearTimeout(toastTimer);
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1800);
}

// ---------- Theme / Lang toggles ----------
themeToggle.addEventListener('click', () => {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(currentTheme);
});
langToggle.addEventListener('click', () => {
  const idx = LANG_CYCLE.indexOf(currentLang);
  currentLang = LANG_CYCLE[(idx + 1) % LANG_CYCLE.length];
  localStorage.setItem('lang', currentLang);

  // Update greeting text based on current local time & nama user (kalau login).
  updateGreetingText();

  // Update outer buttons immediately on language toggle.

  if (clearPartialBtn) {
    clearPartialBtn.textContent = currentLang === 'id' ? 'Hapus sebagian' : 'Delete part of the history';
  }

  applyI18n();
  renderMessages();
  renderSuggestions();

});
// ---------- Sidebar (mobile + desktop) ----------
function openSidebar() {
  sidebar.classList.add('open');
  backdrop.classList.add('show');
}
function closeSidebar() {
  sidebar.classList.remove('open');
  backdrop.classList.remove('show');
}

// ChatGPT-like behavior: sidebar is collapsible on all screen sizes.
if (menuBtn) menuBtn.addEventListener('click', openSidebar);
if (sidebarOpenBtn) sidebarOpenBtn.addEventListener('click', openSidebar);
if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', closeSidebar);
if (backdrop) backdrop.addEventListener('click', closeSidebar);

// Desktop initial state should be open (user can close it themselves).
// Mobile remains closed until menu is clicked.
if (window.innerWidth >= 821) {
  openSidebar();
}



// ---------- Lightweight markdown ----------
function escapeHtml(str) { return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function renderMarkdown(text) {
  let escaped = escapeHtml(text);
  escaped = escaped.replace(/```([\s\S]*?)```/g, (_, code) => `<pre><code>${code.trim()}</code></pre>`);
  escaped = escaped.replace(/`([^`]+)`/g, '<code>$1</code>');
  escaped = escaped.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  return escaped;
}

// ---------- History rendering ----------
function renderHistory() {
  closeHistoryMenuDropdown();
  historyList.innerHTML = '';
  // Tampilkan yang di-star paling atas, tanpa mengubah urutan asli di data (conversations tetap utuh urutan aslinya).
  const sortedConversations = [...conversations].sort((a, b) => {
    const aStar = a.starred ? 1 : 0;
    const bStar = b.starred ? 1 : 0;
    if (aStar !== bStar) return bStar - aStar; // starred duluan sebelum yang tidak
    if (aStar === 1) return (b.starredAt || 0) - (a.starredAt || 0); // yang terbaru di-star di atas
    return 0; // non-starred: pertahankan urutan asli (sort JS stabil)
  });
  sortedConversations.forEach((conv) => {
    const item = document.createElement('div');
    item.className = 'history-item' + (conv.id === currentConvId ? ' active' : '');
    const label = document.createElement('span');
    label.className = 'label' + (conv.starred ? ' starred' : '');
    label.textContent = (conv.starred ? '★ ' : '') + conv.title;
    item.appendChild(label);

    // ---- Three-dot menu button (Star / Rename / Delete). The dropdown itself is a single
    // shared floating element appended to <body> so it never gets clipped by the sidebar's
    // overflow:hidden/auto containers. Its hover tooltip uses the same floating approach
    // (see showFloatingTooltip) instead of the CSS [data-tooltip] system, since a CSS ::after
    // tooltip here would get clipped by .history-item / .history-list overflow. ----
    const itemMenuBtn = document.createElement('button');
    itemMenuBtn.type = 'button';
    itemMenuBtn.className = 'history-item-menu-btn';
    itemMenuBtn.setAttribute('aria-haspopup', 'true');
    itemMenuBtn.setAttribute('aria-expanded', 'false');
    itemMenuBtn.setAttribute('aria-label', t('tooltipChatOptions'));
    itemMenuBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>';

    itemMenuBtn.addEventListener('mouseenter', () => showFloatingTooltip(itemMenuBtn, t('tooltipChatOptions')));
    itemMenuBtn.addEventListener('mouseleave', hideFloatingTooltip);
    itemMenuBtn.addEventListener('focus', () => showFloatingTooltip(itemMenuBtn, t('tooltipChatOptions')));
    itemMenuBtn.addEventListener('blur', hideFloatingTooltip);

    itemMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      hideFloatingTooltip();
      const wasOpenForThis = historyMenuOpenBtn === itemMenuBtn && historyMenuDropdown && historyMenuDropdown.classList.contains('open');
      closeHistoryMenuDropdown();
      if (!wasOpenForThis) openHistoryMenuDropdown(conv, itemMenuBtn);
    });

    item.appendChild(itemMenuBtn);

    item.addEventListener('click', () => {
      currentConvId = conv.id;
      renderHistory();
      renderMessages();
      closeSidebar();
    });
    historyList.appendChild(item);
  });
}

// ---------- Shared floating tooltip (for elements inside overflow:hidden/auto containers,
// where a CSS [data-tooltip]::after would get clipped, e.g. the history item ⋮ button) ----------
let floatingTooltipEl = null;

function buildFloatingTooltip() {
  if (floatingTooltipEl) return floatingTooltipEl;
  const el = document.createElement('div');
  el.className = 'floating-tooltip';
  document.body.appendChild(el);
  floatingTooltipEl = el;
  return el;
}

function showFloatingTooltip(anchorEl, text) {
  const el = buildFloatingTooltip();
  el.textContent = text;
  el.classList.add('show');
  const rect = anchorEl.getBoundingClientRect();
  const ttWidth = el.offsetWidth || 100;
  const ttHeight = el.offsetHeight || 28;
  let left = rect.left + rect.width / 2 - ttWidth / 2;
  if (left < 8) left = 8;
  if (left + ttWidth > window.innerWidth - 8) left = window.innerWidth - ttWidth - 8;
  let top = rect.top - ttHeight - 8;
  if (top < 8) top = rect.bottom + 8; // not enough room above: flip below
  el.style.left = `${left}px`;
  el.style.top = `${top}px`;
}

function hideFloatingTooltip() {
  if (floatingTooltipEl) floatingTooltipEl.classList.remove('show');
}

// ---------- Shared floating dropdown for history item menu (Star / Rename / Delete) ----------
let historyMenuDropdown = null;
let historyMenuOpenBtn = null;

function buildHistoryMenuDropdown() {
  if (historyMenuDropdown) return historyMenuDropdown;
  const dd = document.createElement('div');
  dd.className = 'title-dropdown history-item-dropdown';
  dd.setAttribute('role', 'menu');
  dd.innerHTML = `
    <button type="button" class="title-dropdown-item" data-action="star" role="menuitem">
      <span class="tdi-icon"></span><span></span>
    </button>
    <button type="button" class="title-dropdown-item" data-action="rename" role="menuitem">
      <span class="tdi-icon">✎</span><span></span>
    </button>
    <button type="button" class="title-dropdown-item danger" data-action="delete" role="menuitem">
      <span class="tdi-icon">🗑</span><span></span>
    </button>
  `;
  dd.addEventListener('click', (e) => e.stopPropagation());
  document.body.appendChild(dd);
  historyMenuDropdown = dd;
  return dd;
}

function closeHistoryMenuDropdown() {
  if (historyMenuDropdown) historyMenuDropdown.classList.remove('open');
  if (historyMenuOpenBtn) {
    historyMenuOpenBtn.classList.remove('open');
    historyMenuOpenBtn.setAttribute('aria-expanded', 'false');
  }
  historyMenuOpenBtn = null;
  hideFloatingTooltip();
}

function openHistoryMenuDropdown(conv, btn) {
  closeTitleDropdown();
  const dd = buildHistoryMenuDropdown();

  const starBtn = dd.querySelector('[data-action="star"]');
  const renameBtn = dd.querySelector('[data-action="rename"]');
  const deleteBtn = dd.querySelector('[data-action="delete"]');

  starBtn.querySelector('.tdi-icon').textContent = conv.starred ? '★' : '☆';
  starBtn.querySelector('span:last-child').textContent = conv.starred ? t('unstarChat') : t('starChat');
  renameBtn.querySelector('span:last-child').textContent = t('renameChat');
  deleteBtn.querySelector('span:last-child').textContent = t('deleteChat');

  starBtn.onclick = (e) => {
    e.stopPropagation();
    conv.starred = !conv.starred;
    conv.starredAt = conv.starred ? Date.now() : null;
    saveConversations();
    if (conv.id === currentConvId) updateTitleDropdownLabels();
    showToast(conv.starred ? t('starredChat') : t('unstarredChat'));
    closeHistoryMenuDropdown();
    renderHistory();
  };
  renameBtn.onclick = async (e) => {
    e.stopPropagation();
    closeHistoryMenuDropdown();
    const newTitle = await customPrompt(t('renamePrompt'), conv.title);
    if (newTitle === null) return;
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    conv.title = trimmed.slice(0, 60);
    saveConversations();
    if (conv.id === currentConvId) chatTitle.textContent = conv.title;
    showToast(t('titleSaved'));
    renderHistory();
  };
  deleteBtn.onclick = async (e) => {
    e.stopPropagation();
    closeHistoryMenuDropdown();
    const ok = await customConfirm(t('confirmDeleteChat'), { danger: true });
    if (!ok) return;
    deleteConversation(conv.id);
    showToast(t('deletedChat'));
  };

  // Position as fixed, anchored under the clicked button, clamped inside the viewport.
  dd.classList.add('open');
  const rect = btn.getBoundingClientRect();
  const ddWidth = dd.offsetWidth || 178;
  const ddHeight = dd.offsetHeight || 120;
  let left = rect.right - ddWidth;
  if (left < 8) left = 8;
  if (left + ddWidth > window.innerWidth - 8) left = window.innerWidth - ddWidth - 8;
  let top = rect.bottom + 6;
  if (top + ddHeight > window.innerHeight - 8) top = rect.top - ddHeight - 6;
  dd.style.left = `${left}px`;
  dd.style.top = `${top}px`;

  btn.classList.add('open');
  btn.setAttribute('aria-expanded', 'true');
  historyMenuOpenBtn = btn;
}

function deleteConversation(id) {
  conversations = conversations.filter((c) => c.id !== id);
  saveConversations();
  if (currentConvId === id) {
    currentConvId = conversations.length ? conversations[0].id : null;
    if (!currentConvId) createNewConversation(false);
  }
  renderHistory();
  renderMessages();
}

clearAllBtn.addEventListener('click', async () => {
  const ok = await customConfirm(t('confirmClear'), { danger: true });
  if (!ok) return;
  conversations = [];
  saveConversations();
  createNewConversation();
  showToast(t('clearedAll'));
});

// ---------- Partial delete (history) ----------
// Flow baru: user klik "Hapus sebagian" -> centang percakapan yang mau dihapus -> konfirmasi
function showPartialDeleteModal() {
  // Ensure language-dependent labels are generated from currentLang
  // at the time the modal is created.

  const selectableConvs = conversations.slice();
  if (!selectableConvs.length) return;

  // simple modal inline (tanpa dependency CSS khusus)

  // Update outer buttons too (the "Hapus sebagian" button label in sidebar).
  // Ensure it changes when language toggles.
  if (clearPartialBtn) {
    clearPartialBtn.textContent = currentLang === 'id' ? 'Hapus sebagian' : 'Delete part of the history';
  }

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const card = document.createElement('div');
  card.className = 'modal-card';
  card.style.width = 'min(480px, 100%)';
  card.style.maxHeight = '80vh';
  card.style.overflow = 'auto';

  const title = document.createElement('h3');
  title.className = 'modal-title';
  title.textContent = currentLang === 'id' ? 'Hapus sebagian riwayat' : 'Delete part of history';
  title.dataset.i18nPartialTitle = '1';

  const hint = document.createElement('p');
  hint.className = 'modal-message';
  hint.textContent = currentLang === 'id' ? 'Centang obrolan yang ingin dihapus, lalu konfirmasi.' : 'Select the conversations to delete, then confirm.';

  const list = document.createElement('div');
  list.style.display = 'grid';
  list.style.gap = '8px';
  list.style.marginBottom = '16px';

  const checks = new Map(); // conv.id -> checkbox

  selectableConvs.forEach((conv) => {
    const row = document.createElement('label');
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.gap = '10px';
    row.style.padding = '9px 12px';
    row.style.border = '1px solid var(--glass-border)';
    row.style.borderRadius = 'var(--radius-sm)';
    row.style.background = 'var(--glass-bg)';
    row.style.cursor = 'pointer';

    const cb = document.createElement('input');
    cb.type = 'checkbox';

    const txt = document.createElement('div');
    txt.style.flex = '1';
    txt.style.minWidth = '0';

    const name = document.createElement('div');
    name.textContent = conv.title;
    name.style.whiteSpace = 'nowrap';
    name.style.overflow = 'hidden';
    name.style.textOverflow = 'ellipsis';
    name.style.color = 'var(--text-primary)';
    name.style.fontSize = '14px';

    row.appendChild(cb);
    txt.appendChild(name);
    row.appendChild(txt);

    list.appendChild(row);
    checks.set(conv.id, cb);
  });

  const actions = document.createElement('div');
  actions.className = 'modal-actions';

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'modal-btn';
  cancelBtn.textContent = currentLang === 'id' ? 'Batal' : 'Cancel';

  const delBtn = document.createElement('button');
  delBtn.type = 'button';
  delBtn.className = 'modal-btn danger';
  delBtn.textContent = currentLang === 'id' ? 'Konfirmasi hapus' : 'Confirm delete';

  cancelBtn.addEventListener('click', () => closeCustomModal(overlay));
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeCustomModal(overlay);
  });

  delBtn.addEventListener('click', () => {
    const idsToDelete = [];
    for (const [id, cb] of checks.entries()) {
      if (cb.checked) idsToDelete.push(id);
    }
    if (!idsToDelete.length) {
    showToast(currentLang === 'id' ? 'Pilih minimal 1 obrolan' : 'Select at least 1 conversation');
    return;
}

    conversations = conversations.filter((c) => !idsToDelete.includes(c.id));

    if (currentConvId && idsToDelete.includes(currentConvId)) {
      currentConvId = conversations.length ? conversations[0].id : null;
      if (!currentConvId) createNewConversation(false);
    }

    saveConversations();
    renderHistory();
    renderMessages();
    renderSuggestions();

    closeCustomModal(overlay);
    showToast(currentLang === 'id' ? 'Riwayat sebagian dihapus' : 'Partial history deleted');

  });

  actions.appendChild(cancelBtn);
  actions.appendChild(delBtn);

  card.appendChild(title);
  card.appendChild(hint);
  card.appendChild(list);
  card.appendChild(actions);


  overlay.appendChild(card);
  document.body.appendChild(overlay);

  requestAnimationFrame(() => {
    overlay.classList.add('show');
  });
}

if (clearPartialBtn) {
  clearPartialBtn.addEventListener('click', () => {
    showPartialDeleteModal();
  });
}

function clearPartialConversations(keepCount = 3) {
  // legacy fallback: menyisakan 3 obrolan terbaru
  const keep = conversations.slice(0, Math.max(0, keepCount));
  conversations = keep;
  currentConvId = conversations.length ? conversations[0].id : null;
  saveConversations();
  renderHistory();
  renderMessages();
}


// ---------- Conversation lifecycle ----------
function createNewConversation(render = true) {
  const conv = { id: Date.now().toString(), title: t('newChat'), messages: [] };
  conversations.unshift(conv);
  currentConvId = conv.id;
  saveConversations();
  if (render) { renderHistory(); renderMessages(); closeSidebar(); }
}
newChatBtn.addEventListener('click', () => createNewConversation());

// (Optional) Hapus sebagian riwayat dari keyboard: Ctrl+Backspace
window.addEventListener('keydown', async (e) => {
  if (e.ctrlKey && e.key === 'Backspace') {
    e.preventDefault();
    const ok = await customConfirm(currentLang === 'id' ? 'Hapus sebagian riwayat? Menyisakan 3 obrolan terbaru.' : 'Delete part of the history? Keep the latest 3 conversations.', { danger: true });
    if (!ok) return;
    clearPartialConversations(3);
    showToast(currentLang === 'id' ? 'Riwayat sebagian dihapus' : 'Partial history deleted');
  }
});

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString(currentLang === 'id' ? 'id-ID' : 'en-US', { hour: '2-digit', minute: '2-digit' });
}

// ---------- Message rendering ----------
function renderMessages() {
  messagesEl.innerHTML = '';
  const conv = getCurrentConversation();
  chatTitle.textContent = conv ? conv.title : t('newChat');

  if (!conv || conv.messages.length === 0) {
    messagesEl.appendChild(emptyState);
    regenBtn.style.visibility = 'hidden';
    return;
  }
  regenBtn.style.visibility = conv.messages.some((m) => m.role === 'assistant') ? 'visible' : 'hidden';
  conv.messages.forEach((msg) => messagesEl.appendChild(buildMessageRow(msg)));
  scrollToBottom();
}

const scrollState = {
  // True ketika user sedang berada dekat bagian paling bawah chat
  nearBottom: true,
  // margin (px) dari bawah agar masih dianggap near-bottom
  thresholdPx: 80,
};

function updateNearBottom() {
  // scrollHeight - scrollTop - clientHeight = jarak dari bawah
  const distanceFromBottom = messagesEl.scrollHeight - messagesEl.scrollTop - messagesEl.clientHeight;
  scrollState.nearBottom = distanceFromBottom <= scrollState.thresholdPx;
}

function scrollToBottom({ smooth = true } = {}) {
  // Auto-scroll sedikit (smooth) supaya terasa seperti tombol panah ke bawah.
  // Jika user memang tidak near bottom, jangan paksa scroll.
  if (!scrollState.nearBottom) return;
  const target = messagesEl.scrollHeight;
  messagesEl.scrollTo({ top: target, behavior: smooth ? 'smooth' : 'auto' });
}

// tombol panah ke bawah untuk manual "ke bawah" + set nearBottom
const scrollDownBtn = document.getElementById('scrollDownBtn');
scrollDownBtn.addEventListener('click', () => {
  scrollState.nearBottom = true;
  updateNearBottom();
  messagesEl.scrollTo({ top: messagesEl.scrollHeight, behavior: 'smooth' });
});

messagesEl.addEventListener('scroll', () => {
  updateNearBottom();

  // Tampilkan tombol ketika user menjauh dari bottom
  if (scrollState.nearBottom) scrollDownBtn.classList.remove('show');
  else scrollDownBtn.classList.add('show');
});

// set initial state
updateNearBottom();

function buildMessageRow(msg) {
  const row = document.createElement('div');
  row.className = `msg-row ${msg.role}`;
  if (msg.role === 'assistant') {
    const mark = document.createElement('div');
    mark.className = 'msg-mark';
    row.appendChild(mark);
  }
  const col = document.createElement('div');
  col.className = 'msg-bubble-col';
  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  bubble.innerHTML = renderMarkdown(msg.content);
  col.appendChild(bubble);

  const actions = document.createElement('div');
  actions.className = 'msg-actions';
  const copyBtn = document.createElement('button');
  copyBtn.className = 'msg-action-btn';
  copyBtn.textContent = t('copy');
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(msg.content).then(() => showToast(t('copied')));
  });
  actions.appendChild(copyBtn);
  if (msg.time) {
    const meta = document.createElement('span');
    meta.className = 'msg-action-btn';
    meta.style.cursor = 'default';
    meta.textContent = formatTime(msg.time);
    actions.appendChild(meta);
  }
  col.appendChild(actions);
  row.appendChild(col);
  return row;
}

function appendTypingRow() {
  const row = document.createElement('div');
  row.className = 'msg-row assistant';
  row.id = 'typingRow';
  const mark = document.createElement('div');
  mark.className = 'msg-mark thinking';
  row.appendChild(mark);
  const col = document.createElement('div');
  col.className = 'msg-bubble-col';
  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  bubble.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
  col.appendChild(bubble);
  row.appendChild(col);
  messagesEl.appendChild(row);
  scrollToBottom();
}
function removeTypingRow() { const row = document.getElementById('typingRow'); if (row) row.remove(); }

// ---------- Send message ----------
async function sendMessage(text) {
  let conv = getCurrentConversation();
  if (!conv) { createNewConversation(false); conv = getCurrentConversation(); }
  conv.messages.push({ role: 'user', content: text, time: Date.now() });
  if (conv.title === t('newChat') || conv.title === 'Obrolan baru' || conv.title === 'New chat') {
    conv.title = text.slice(0, 32) + (text.length > 32 ? '…' : '');
  }
  saveConversations();
  renderHistory();
  renderMessages();
  await requestAIReply(conv);
}

async function requestAIReply(conv) {
  isGenerating = true;
  sendBtn.disabled = true;
  appendTypingRow();
  try {
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: conv.messages.map(({ role, content }) => ({ role, content })),
       systemPrompt: t('systemPrompt'),
      }),
    });

    let data = {};
    try {
      data = await response.json();
    } catch {
      // ignore, we'll surface response status below
    }

    removeTypingRow();
    if (!response.ok) {
      throw new Error(data?.error || `HTTP ${response.status}`);
    }

    conv.messages.push({ role: 'assistant', content: data.reply, time: Date.now() });
    saveConversations();
    renderMessages();
  } catch (err) {
    removeTypingRow();
    conv.messages.push({ role: 'assistant', content: `⚠️ ${t('errorPrefix')}: ${err.message}`, time: Date.now() });
    saveConversations();
    renderMessages();
  } finally {
    isGenerating = false;
    sendBtn.disabled = false;
  }
}

// ---------- Regenerate ----------
regenBtn.addEventListener('click', async () => {
  if (isGenerating) return;
  const conv = getCurrentConversation();
  if (!conv || conv.messages.length === 0) return;
  while (conv.messages.length && conv.messages[conv.messages.length - 1].role === 'assistant') {
    conv.messages.pop();
  }
  saveConversations();
  renderMessages();
  await requestAIReply(conv);
});

// ---------- Title dropdown (Star / Rename / Delete) ----------
function updateTitleDropdownLabels() {
  const conv = getCurrentConversation();
  const starred = !!(conv && conv.starred);
  if (starChatLabel) starChatLabel.textContent = starred ? t('unstarChat') : t('starChat');
  const starIcon = starChatBtn ? starChatBtn.querySelector('.tdi-icon') : null;
  if (starIcon) starIcon.textContent = starred ? '★' : '☆';
  if (renameChatLabel) renameChatLabel.textContent = t('renameChat');
  if (deleteChatLabel) deleteChatLabel.textContent = t('deleteChat');
}

function openTitleDropdown() {
  updateTitleDropdownLabels();
  titleDropdown.classList.add('open');
  titleMenuBtn.classList.add('open');
  titleMenuBtn.setAttribute('aria-expanded', 'true');
}
function closeTitleDropdown() {
  titleDropdown.classList.remove('open');
  titleMenuBtn.classList.remove('open');
  titleMenuBtn.setAttribute('aria-expanded', 'false');
}
function toggleTitleDropdown() {
  if (titleDropdown.classList.contains('open')) closeTitleDropdown();
  else openTitleDropdown();
}

if (titleMenuBtn) {
  titleMenuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleTitleDropdown();
  });
}
if (chatTitle) {
  chatTitle.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleTitleDropdown();
  });
}
document.addEventListener('click', (e) => {
  if (chatTitleWrap && !chatTitleWrap.contains(e.target)) closeTitleDropdown();
  if (historyMenuDropdown && !historyMenuDropdown.contains(e.target) && !e.target.closest('.history-item-menu-btn')) {
    closeHistoryMenuDropdown();
  }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closeTitleDropdown(); closeHistoryMenuDropdown(); }
});
window.addEventListener('resize', () => closeHistoryMenuDropdown());
if (historyList) historyList.addEventListener('scroll', () => closeHistoryMenuDropdown());

if (starChatBtn) {
  starChatBtn.addEventListener('click', () => {
    const conv = getCurrentConversation();
    if (!conv) return;
    conv.starred = !conv.starred;
    conv.starredAt = conv.starred ? Date.now() : null;
    saveConversations();
    renderHistory();
    updateTitleDropdownLabels();
    showToast(conv.starred ? t('starredChat') : t('unstarredChat'));
    closeTitleDropdown();
  });
}

if (renameChatBtn) {
  renameChatBtn.addEventListener('click', async () => {
    const conv = getCurrentConversation();
    closeTitleDropdown();
    if (!conv) return;
    const newTitle = await customPrompt(t('renamePrompt'), conv.title);
    if (newTitle === null) return;
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    conv.title = trimmed.slice(0, 60);
    saveConversations();
    chatTitle.textContent = conv.title;
    renderHistory();
    showToast(t('titleSaved'));
  });
}

if (deleteChatBtn) {
  deleteChatBtn.addEventListener('click', async () => {
    const conv = getCurrentConversation();
    closeTitleDropdown();
    if (!conv) return;
    const ok = await customConfirm(t('confirmDeleteChat'), { danger: true });
    if (!ok) return;
    deleteConversation(conv.id);
    showToast(t('deletedChat'));
  });
}

// ---------- Form events ----------
chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (isGenerating) return;
  const text = userInput.value.trim();
  if (!text) return;
  userInput.value = '';
  userInput.style.height = 'auto';
  sendMessage(text);
});

function updateSendButtonState() {
  const hasTyping = userInput.value.trim().length >= 1;
  // If not typing anything (or just spaces), make button slightly dim.
  sendBtn.style.opacity = hasTyping ? '' : '0.35';
  sendBtn.style.filter = hasTyping ? '' : 'brightness(0.9)';
  sendBtn.disabled = isGenerating ? true : false;
}

userInput.addEventListener('input', () => {
  userInput.style.height = 'auto';
  userInput.style.height = userInput.scrollHeight + 'px';
  updateSendButtonState();
});

userInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); chatForm.requestSubmit(); }
});

// Set initial state for send button on load
updateSendButtonState();


// ---------- Suggestion generator ----------
const SUGGESTIONS_POOL = [
  { id: 'Jelaskan rekursi dengan analogi sederhana', en: 'Explain recursion with a simple analogy' },
  { id: 'Draft email izin sakit', en: 'Draft a sick leave email' },
  { id: 'Kasih ide 5 nama untuk aplikasi chat AI', en: 'Give me 5 name ideas for an AI chat app' },
  { id: 'Ringkas fotosintesis singkat', en: 'Summarize how photosynthesis works' },
  { id: 'Buat template CV untuk fresh graduate', en: 'Create a CV template for a fresh graduate' },
  { id: 'Jelaskan konsep hashing seperti ELI5', en: 'Explain hashing like ELI5' },
  { id: 'Buat rencana belajar JavaScript 2 minggu', en: 'Make a 2-week JavaScript learning plan' },
  { id: 'Draft pesan perkenalan untuk LinkedIn', en: 'Draft an introduction message for LinkedIn' },
  { id: 'Buat ide konten TikTok edukasi pemrograman', en: 'Create TikTok content ideas for programming education' },
  { id: 'Bantu membuat deskripsi produk aplikasi', en: 'Help write an app product description' },
  { id: 'Jelaskan perbedaan HTTP vs HTTPS', en: 'Explain the difference between HTTP and HTTPS' },
  { id: 'Ringkas artikel: cara kerja cache pada web', en: 'Summarize an article: how web caching works' },
  { id: 'Draft proposal magang singkat', en: 'Draft a short internship proposal' },
  { id: 'Tolong buat checklist persiapan ujian', en: 'Make an exam preparation checklist' },
  { id: 'Buat ide nama brand untuk minuman kekinian', en: 'Give brand name ideas for a trendy drink' },
];

function pickRandomSuggestions(count = 12) {
  const pool = [...SUGGESTIONS_POOL];
  // Fisher–Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
}

function renderSuggestions() {
  if (!suggestionsEl) return;
  const chosen = pickRandomSuggestions(4);



  suggestionsEl.innerHTML = chosen.map((s) => {
    const text = currentLang === 'id' ? s.id : s.en;
    return `
      <button class="suggestion-chip glass-inset"
        data-id="${s.id.replace(/"/g, '"')}"
        data-en="${s.en.replace(/"/g, '"')}"
        data-i18n-placeholder=""
      >${text}</button>
    `;
  }).join('');
}

// ---------- Suggestion chips click ----------
suggestionsEl.addEventListener('click', (e) => {
  const chip = e.target.closest('.suggestion-chip');
  if (!chip) return;
  userInput.value = chip.dataset.text || (currentLang === 'id' ? chip.dataset.id : chip.dataset.en);
  userInput.dispatchEvent(new Event('input'));
  userInput.focus();
});

// ---------- Init ----------
// Saat load/refresh: kembalikan percakapan dari localStorage.
if (conversations.length === 0) {
  createNewConversation(false);
} else {
  currentConvId = conversations[0].id;
}

// Update greeting dinamis untuk empty state sesuai jam lokal (default saat pertama buka).
updateGreetingText();

// Pastikan greeting dipakai sejak pertama kali buka aplikasi (tanpa perlu interaksi).
applyI18n();
renderHistory();
renderMessages();
renderSuggestions();
initAuthSync();











