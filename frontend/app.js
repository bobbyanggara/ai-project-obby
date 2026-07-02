// app.js — NOVA (liquid glass edition)

// GANTI URL INI dengan URL backend Vercel kamu
const BACKEND_URL = 'https://ai-project-obby.vercel.app/api/chat';

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
    hint: 'Enter untuk kirim · Shift+Enter baris baru',
    copy: 'Salin',
    copied: 'Disalin ke clipboard',
    clearedAll: 'Semua riwayat dihapus',
    confirmClear: 'Hapus semua riwayat obrolan? Tindakan ini tidak bisa dibatalkan.',
    systemPrompt:
      'Kamu adalah asisten AI yang ramah, jelas, dan membantu pengguna dalam Bahasa Indonesia. PENTING: kamu tidak punya akses internet dan pengetahuanmu punya batas waktu tertentu, jadi untuk hal yang mungkin berubah (jabatan pejabat, berita terkini, harga, dll), ingatkan bahwa informasimu bisa usang dan sarankan pengguna mengecek sumber terkini.',
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
    hint: 'Enter to send · Shift+Enter for new line',
    copy: 'Copy',
    copied: 'Copied to clipboard',
    clearedAll: 'All history cleared',
    confirmClear: 'Clear all conversation history? This cannot be undone.',
    systemPrompt:
      "You are a friendly, clear, and helpful AI assistant. IMPORTANT: you don't have internet access and your knowledge has a cutoff date, so for anything that may have changed (current officials, recent news, prices, etc.), remind the user your info may be outdated and suggest checking a current source.",
    errorPrefix: 'Sorry, something went wrong',
  },
};

let currentLang = localStorage.getItem('lang') || 'id';
function t(key) { return I18N[currentLang][key] || key; }

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

// ---------- Theme ----------
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
const closeSidebarBtn = document.getElementById('closeSidebarBtn');
const sidebar = document.getElementById('sidebar');
const backdrop = document.getElementById('backdrop');
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
  currentLang = currentLang === 'id' ? 'en' : 'id';
  localStorage.setItem('lang', currentLang);
  applyI18n();
});

// ---------- Sidebar (mobile) ----------
function openSidebar() { sidebar.classList.add('open'); backdrop.classList.add('show'); }
function closeSidebar() { sidebar.classList.remove('open'); backdrop.classList.remove('show'); }
menuBtn.addEventListener('click', openSidebar);
closeSidebarBtn.addEventListener('click', closeSidebar);
backdrop.addEventListener('click', closeSidebar);

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

// ---------- Conversation lifecycle ----------
function createNewConversation(render = true) {
  const conv = { id: Date.now().toString(), title: t('newChat'), messages: [] };
  conversations.unshift(conv);
  currentConvId = conv.id;
  saveConversations();
  if (render) { renderHistory(); renderMessages(); closeSidebar(); }
}
newChatBtn.addEventListener('click', () => createNewConversation());

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

function scrollToBottom() { messagesEl.scrollTop = messagesEl.scrollHeight; }

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
    const data = await response.json();
    removeTypingRow();
    if (!response.ok) throw new Error(data.error || 'Server error');
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
userInput.addEventListener('input', () => {
  userInput.style.height = 'auto';
  userInput.style.height = userInput.scrollHeight + 'px';
});
userInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); chatForm.requestSubmit(); }
});

// ---------- Suggestion chips ----------
suggestionsEl.addEventListener('click', (e) => {
  const chip = e.target.closest('.suggestion-chip');
  if (!chip) return;
  userInput.value = chip.dataset.text || chip.dataset.id;
  userInput.dispatchEvent(new Event('input'));
  userInput.focus();
});

// ---------- Init ----------
if (conversations.length === 0) {
  createNewConversation(false);
} else {
  currentConvId = conversations[0].id;
}
applyI18n();
renderHistory();
renderMessages();
