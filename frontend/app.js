// app.js — NOVA (liquid glass edition)

// Backend base URL
// Gunakan hardcode backend Vercel.
const BACKEND_BASE_URL = 'https://ai-project-obby.vercel.app';

// Endpoint chat
const BACKEND_URL = `${BACKEND_BASE_URL}/api/chat`;

// Jika backend auth tidak dipakai, BASE_URL tidak diset supaya perilaku kembali seperti semula.
const BASE_URL = window.location.origin;

// Catatan: Greeting & chat utama tidak tergantung sistem login.





// ---------- i18n ----------
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
    placeholder: 'Kirim pesan...',
    hint: 'Obby adalah AI dan bisa melakukan kesalahan. Harap periksa kembali tanggapannya.',
    copy: 'Salin',
    copied: 'Disalin ke clipboard',
    editTitle: 'Edit judul',
    titleSaved: 'Judul disimpan',
    clearedAll: 'Semua riwayat dihapus',
    confirmClear: 'Hapus semua riwayat obrolan? Tindakan ini tidak bisa dibatalkan.',
    systemPrompt:
'Kamu adalah OBBY AI, asisten AI yang ramah, jelas, dan membantu pengguna dalam Bahasa Indonesia. Kamu dikembangkan oleh Bobby Anggara, siswa SMK jurusan Rekayasa Perangkat Lunak, sebagai proyek pribadi. PENTING: kamu tidak punya akses internet dan pengetahuanmu punya batas waktu tertentu, jadi untuk hal yang mungkin berubah (jabatan pejabat, berita terkini, harga, dll), ingatkan bahwa informasimu bisa usang dan sarankan pengguna mengecek sumber terkini. Kamu dilarang menyebut dirimu sebagai ChatGPT, OpenAI, GPT, atau nama AI/perusahaan lain — kamu adalah OBBY AI, buatan Bobby Anggara.',
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
    placeholder: 'Send a message...',
    hint: 'Obby is AI and can make mistakes. Please double-check responses.',
    copy: 'Copy',
    copied: 'Copied to clipboard',
    editTitle: 'Edit title',
    titleSaved: 'Title saved',
    clearedAll: 'All history cleared',
    confirmClear: 'Clear all conversation history? This cannot be undone.',
    systemPrompt:
      "You are OBBY AI, a friendly, clear, and helpful AI assistant. You were developed by Bobby Anggara, a vocational high school (SMK) student majoring in Software Engineering (Rekayasa Perangkat Lunak), as a personal project. IMPORTANT: you don't have internet access and your knowledge has a cutoff date, so for anything that may have changed (current officials, recent news, prices, etc.), remind the user your info may be outdated and suggest checking a current source. You must never refer to yourself as ChatGPT, OpenAI, GPT, or any other AI/company name — you are OBBY AI, created by Bobby Anggara.",
    errorPrefix: 'Sorry, something went wrong',
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

function getGreetingByLocalTime(d = new Date()) {
  const hour = d.getHours();
  if (hour >= 5 && hour <= 10) return 'Selamat pagi';
  if (hour >= 11 && hour <= 14) return 'Selamat siang';
  if (hour >= 15 && hour <= 17) return 'Selamat sore';
  return 'Selamat malam';
}

function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  langToggle.textContent = currentLang.toUpperCase();
  document.documentElement.lang = currentLang;
  document.querySelectorAll('.suggestion-chip').forEach((chip) => {
    chip.dataset.text = currentLang === 'id' ? chip.dataset.id : chip.dataset.en;
  });
  const conv = getCurrentConversation();
  chatTitle.textContent = conv && conv.title !== 'Obrolan baru' && conv.title !== 'New chat' ? conv.title : t('newChat');
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

// ---------- State ----------
let conversations = JSON.parse(localStorage.getItem('conversations') || '[]');
let currentConvId = null;
let isGenerating = false;

function saveConversations() { localStorage.setItem('conversations', JSON.stringify(conversations)); }
function getCurrentConversation() { return conversations.find((c) => c.id === currentConvId); }

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

  // Update greeting text based on current local time.
  I18N.id.emptyTitle = `${getGreetingByLocalTime()}, ada yang bisa dibantu?`;
  I18N.en.emptyTitle = `${getGreetingByLocalTime() === 'Selamat pagi'
    ? 'Good morning'
    : getGreetingByLocalTime() === 'Selamat siang'
      ? 'Good afternoon'
      : getGreetingByLocalTime() === 'Selamat sore'
        ? 'Good evening'
        : 'Good evening'}, what can I help with?`;

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
  historyList.innerHTML = '';
  conversations.forEach((conv) => {
    const item = document.createElement('div');
    item.className = 'history-item' + (conv.id === currentConvId ? ' active' : '');
    const label = document.createElement('span');
    label.className = 'label';
    label.textContent = conv.title;
    item.appendChild(label);
    const del = document.createElement('span');
    del.className = 'del';
    del.textContent = '✕';
    del.addEventListener('click', (e) => { e.stopPropagation(); deleteConversation(conv.id); });
    item.appendChild(del);
    item.addEventListener('click', () => {
      currentConvId = conv.id;
      renderHistory();
      renderMessages();
      closeSidebar();
    });
    historyList.appendChild(item);
  });
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

clearAllBtn.addEventListener('click', () => {
  if (!confirm(t('confirmClear'))) return;
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
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.background = 'rgba(0,0,0,0.55)';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.zIndex = '9999';

  const card = document.createElement('div');
  card.style.width = 'min(520px, 92vw)';
  card.style.maxHeight = '80vh';
  card.style.overflow = 'auto';
  card.style.background = 'rgba(10, 14, 30, 0.95)';
  card.style.border = '1px solid rgba(255,255,255,0.12)';
  card.style.borderRadius = '14px';
  card.style.padding = '16px';
  card.style.color = 'white';

  const title = document.createElement('h3');
  title.textContent = currentLang === 'id' ? 'Hapus sebagian riwayat' : 'Delete part of history';

  // If user toggles language while modal is open,
  // keep modal labels in sync with currentLang.
  title.dataset.i18nPartialTitle = '1';


  // Ensure modal texts are always in the current language.
  // (currentLang is read at the time the modal is created.)
  title.style.margin = '0 0 8px 0';

  const hint = document.createElement('p');
  hint.textContent = currentLang === 'id' ? 'Centang obrolan yang ingin dihapus, lalu konfirmasi.' : 'Select the conversations to delete, then confirm.';
  hint.style.margin = '0 0 12px 0';
  hint.style.opacity = '0.85';
  hint.style.fontSize = '14px';

  const list = document.createElement('div');
  list.style.display = 'grid';
  list.style.gap = '8px';
  list.style.marginBottom = '12px';

  const checks = new Map(); // conv.id -> checkbox

  selectableConvs.forEach((conv) => {
    const row = document.createElement('label');
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.gap = '10px';
    row.style.padding = '8px 10px';
    row.style.border = '1px solid rgba(255,255,255,0.10)';
    row.style.borderRadius = '10px';
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

    row.appendChild(cb);
    txt.appendChild(name);
    row.appendChild(txt);

    list.appendChild(row);
    checks.set(conv.id, cb);
  });

  const actions = document.createElement('div');
  actions.style.display = 'flex';
  actions.style.gap = '10px';
  actions.style.justifyContent = 'flex-end';

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = currentLang === 'id' ? 'Batal' : 'Cancel';

  cancelBtn.type = 'button';
  cancelBtn.style.padding = '10px 12px';
  cancelBtn.style.borderRadius = '10px';
  cancelBtn.style.border = '1px solid rgba(255,255,255,0.18)';
  cancelBtn.style.background = 'transparent';
  cancelBtn.style.color = 'white';
  cancelBtn.style.cursor = 'pointer';

  const delBtn = document.createElement('button');
  delBtn.textContent = currentLang === 'id' ? 'Konfirmasi hapus' : 'Confirm delete';

  delBtn.type = 'button';
  delBtn.style.padding = '10px 12px';
  delBtn.style.borderRadius = '10px';
  delBtn.style.border = '1px solid rgba(255,80,80,0.35)';
  delBtn.style.background = 'rgba(255,80,80,0.18)';
  delBtn.style.color = '#fff';
  delBtn.style.cursor = 'pointer';

  cancelBtn.addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
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



    if (
      !confirm(
        currentLang === 'id'
          ? `Hapus ${idsToDelete.length} obrolan terpilih? Tindakan ini tidak bisa dibatalkan.`
          : `Delete ${idsToDelete.length} selected conversations? This cannot be undone.`
      )
    ) return;


    conversations = conversations.filter((c) => !idsToDelete.includes(c.id));

    if (currentConvId && idsToDelete.includes(currentConvId)) {
      currentConvId = conversations.length ? conversations[0].id : null;
      if (!currentConvId) createNewConversation(false);
    }

    saveConversations();
    renderHistory();
    renderMessages();
    renderSuggestions();

    overlay.remove();
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
window.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'Backspace') {
    e.preventDefault();
    if (!confirm(currentLang === 'id' ? 'Hapus sebagian riwayat? Menyisakan 3 obrolan terbaru.' : 'Delete part of the history? Keep the latest 3 conversations.')) return;
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

// tombol panah ke bawah untuk manual “ke bawah” + set nearBottom
const scrollDownBtn = document.createElement('button');
scrollDownBtn.type = 'button';
scrollDownBtn.id = 'scrollDownBtn';
scrollDownBtn.className = 'scroll-down-btn';
scrollDownBtn.setAttribute('aria-label', 'Scroll ke bawah');
scrollDownBtn.textContent = '↓';
scrollDownBtn.addEventListener('click', () => {
  scrollState.nearBottom = true;
  updateNearBottom();
  messagesEl.scrollTo({ top: messagesEl.scrollHeight, behavior: 'smooth' });
});
// Tombol ditempel sebagai child agar tidak memunculkan layout ganda di mobile
messagesEl.appendChild(scrollDownBtn);

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
I18N.id.emptyTitle = `${getGreetingByLocalTime()}, ada yang bisa dibantu?`;
I18N.en.emptyTitle = `${getGreetingByLocalTime() === 'Selamat pagi'
  ? 'Good morning'
  : getGreetingByLocalTime() === 'Selamat siang'
    ? 'Good afternoon'
    : getGreetingByLocalTime() === 'Selamat sore'
      ? 'Good evening'
      : 'Good evening'}, what can I help with?`;

// Pastikan greeting dipakai sejak pertama kali buka aplikasi (tanpa perlu interaksi).
applyI18n();
renderHistory();
renderMessages();
renderSuggestions();











