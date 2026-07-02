// app.js — OBBY_AI

// GANTI URL INI dengan URL backend Vercel kamu
const BACKEND_URL = 'https://ai-project-obby.vercel.app/api/chat';

// ---------- Viewport fix (mobile browser bar) ----------
function setVH() {
  document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
}
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

// ---------- State ----------
let conversations = JSON.parse(localStorage.getItem('conversations') || '[]');
let currentConvId = null;
let isGenerating = false;

// ---------- User profile (AI kenal kamu) ----------
// Isi profil: akan disimpan di localStorage dan ikut dipakai di systemPrompt
let userProfile = JSON.parse(localStorage.getItem('userProfile') || 'null');

function getUserProfilePrompt() {
  if (!userProfile || typeof userProfile !== 'object') return '';
  // disimpan sebagai string deskripsi, bebas format
  const desc = (userProfile.description || userProfile.text || '').toString().trim();
  if (!desc) return '';
  return `Berikut profil pengguna (gunakan untuk menyesuaikan gaya bahasa dan konteks saat menjawab):\n${desc}`;
}


function saveConversations() {
  localStorage.setItem('conversations', JSON.stringify(conversations));
}

function getCurrentConversation() {
  return conversations.find((c) => c.id === currentConvId);
}

// ---------- Toast ----------
let toastTimer;
function showToast(msg) {
  clearTimeout(toastTimer);
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1800);
}

// ---------- Sidebar (mobile) ----------
function openSidebar() {
  sidebar.classList.add('open');
  backdrop.classList.add('show');
}
function closeSidebar() {
  sidebar.classList.remove('open');
  backdrop.classList.remove('show');
}
menuBtn.addEventListener('click', openSidebar);
closeSidebarBtn.addEventListener('click', closeSidebar);
backdrop.addEventListener('click', closeSidebar);

// ---------- Lightweight markdown ----------
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderMarkdown(text) {
  let escaped = escapeHtml(text);

  // Extract fenced code blocks ```...
  const codeBlocks = [];
  escaped = escaped.replace(/```([\s\S]*?)```/g, (_, code) => {
    const i = codeBlocks.length;
    codeBlocks.push(code.trim());
    return `@@CODEBLOCK_${i}@@`;
  });


  // Headings: #, ##, ###
  escaped = escaped.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
  escaped = escaped.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
  escaped = escaped.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');

  // Bold: **x**
  escaped = escaped.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Inline code: `x`
  escaped = escaped.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Ordered list: 1. ...
  escaped = escaped.replace(/^(\d+)\.\s+(.+)$/gm, '<ol><li>$2</li></ol>');

  // Bullet list: - ... / * ...
  escaped = escaped.replace(/^[-*]\s+(.+)$/gm, '<ul><li>$1</li></ul>');

  // Line breaks biasa -> <br/>
  escaped = escaped.replace(/\n/g, '<br/>');

  // Put back code blocks
  escaped = escaped.replace(/@@CODEBLOCK_(\d+)@@/g, (_, idx) => {
    const code = codeBlocks[Number(idx)] ?? '';
    return `<pre><code>${code}</code></pre>`;
  });

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
    del.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteConversation(conv.id);
    });
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
  if (!confirm('Hapus semua riwayat obrolan? Tindakan ini tidak bisa dibatalkan.')) return;
  conversations = [];
  saveConversations();
  createNewConversation();
  showToast('Semua riwayat dihapus');
});

// ---------- Conversation lifecycle ----------
function createNewConversation(render = true) {
  const conv = { id: Date.now().toString(), title: 'Obrolan baru', messages: [] };
  conversations.unshift(conv);
  currentConvId = conv.id;
  saveConversations();
  if (render) {
    renderHistory();
    renderMessages();
    closeSidebar();
  }
}
newChatBtn.addEventListener('click', () => createNewConversation());

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

// ---------- Message rendering ----------
function renderMessages() {
  messagesEl.innerHTML = '';
  const conv = getCurrentConversation();
  chatTitle.textContent = conv ? conv.title : 'OBBY_AI';

  if (!conv || conv.messages.length === 0) {
    messagesEl.appendChild(emptyState);
    regenBtn.style.visibility = 'hidden';
    return;
  }
  regenBtn.style.visibility = conv.messages.some(m => m.role === 'assistant') ? 'visible' : 'hidden';

  conv.messages.forEach((msg, idx) => {
    messagesEl.appendChild(buildMessageRow(msg, idx));
  });
  scrollToBottom();
}

function scrollToBottom() {
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function buildMessageRow(msg, idx) {
  const row = document.createElement('div');
  row.className = `msg-row ${msg.role}`;

  if (msg.role === 'assistant') {
    const orb = document.createElement('div');
    orb.className = 'msg-orb';
    row.appendChild(orb);
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
  copyBtn.textContent = 'Salin';
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(msg.content).then(() => showToast('Disalin ke clipboard'));
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

  const orb = document.createElement('div');
  orb.className = 'msg-orb thinking';
  row.appendChild(orb);

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

function removeTypingRow() {
  const row = document.getElementById('typingRow');
  if (row) row.remove();
}

// ---------- Send message ----------
async function sendMessage(text) {
  let conv = getCurrentConversation();
  if (!conv) { createNewConversation(false); conv = getCurrentConversation(); }

  conv.messages.push({ role: 'user', content: text, time: Date.now() });
  if (conv.title === 'Obrolan baru') {
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
        systemPrompt:
          'Kamu adalah asisten AI yang ramah, jelas, dan membantu pengguna dalam Bahasa Indonesia. PENTING: kamu tidak punya akses internet dan pengetahuanmu punya batas waktu tertentu, jadi untuk hal yang mungkin berubah (jabatan pejabat, berita terkini, harga, dll), ingatkan bahwa informasimu bisa usang dan sarankan pengguna mengecek sumber terkini.' +
          (getUserProfilePrompt() ? `\n\n${getUserProfilePrompt()}` : '') +
          ' \n\nTUGAS: balas dengan Markdown rapi: gunakan heading (##), list dengan "-", baris baru, dan jika ada kode gunakan fenced code block triple backticks ```.',

      }),
    });

    const data = await response.json();
    removeTypingRow();

    if (!response.ok) throw new Error(data.error || 'Terjadi kesalahan pada server.');

    conv.messages.push({ role: 'assistant', content: data.reply, time: Date.now() });
    saveConversations();
    renderMessages();
  } catch (err) {
    removeTypingRow();
    conv.messages.push({ role: 'assistant', content: `⚠️ Maaf, terjadi kesalahan: ${err.message}`, time: Date.now() });
    saveConversations();
    renderMessages();
  } finally {
    isGenerating = false;
    sendBtn.disabled = false;
  }
}

// ---------- Regenerate last response ----------
regenBtn.addEventListener('click', async () => {
  if (isGenerating) return;
  const conv = getCurrentConversation();
  if (!conv || conv.messages.length === 0) return;

  // remove trailing assistant message(s) until we hit a user message
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
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    chatForm.requestSubmit();
  }
});

// ---------- Suggestion chips (random tiap refresh) ----------
const SUGGESTIONS_POOL = [
  { label: 'Jelaskan rekursi', text: 'Jelaskan konsep rekursi dengan analogi sederhana' },
  { label: 'Draft email sakit', text: 'Buatkan draft email izin kerja karena sakit' },
  { label: 'Ide nama aplikasi', text: 'Kasih ide 10 nama untuk aplikasi chat AI' },
  { label: 'Ringkas fotosintesis', text: 'Ringkas cara kerja fotosintesis singkat' },
  { label: 'Rancang CV', text: 'Bantu saya membuat CV untuk jurusan Rekayasa Perangkat Lunak' },
  { label: 'Ide ObbyZone', text: 'Kasih ide pengembangan bisnis digital untuk ObbyZone' },
  { label: 'Belajar JS 7 hari', text: 'Buatkan rencana belajar dasar JavaScript 7 hari' },
  { label: 'Latihan logika', text: 'Buat 15 soal logika dasar beserta jawabannya' },
  { label: 'Tugas sekolah', text: 'Bantu kerjakan tugas sekolah tentang algoritma dasar dengan contoh' },
  { label: 'Design poster', text: 'Buatkan ide konsep desain poster untuk acara sekolah' },
  { label: 'Pitch bisnis', text: 'Buatkan pitch bisnis ObbyZone versi 30 detik' },
  { label: 'Belajar Git', text: 'Jelaskan Git dengan contoh langkah demi langkah' },
  { label: 'Template proposal', text: 'Buatkan template proposal usaha digital singkat' },
  { label: 'Ringkas presentasi', text: 'Buat ringkasan materi presentasi singkat 1 halaman' },
];


function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function renderRandomSuggestions() {
  if (!suggestionsEl) return;
  if (suggestionsEl.dataset && suggestionsEl.dataset.suggestions !== '1') return;

  const shuffled = shuffle([...SUGGESTIONS_POOL]);
  const picked = shuffled.slice(0, 4);

  suggestionsEl.innerHTML = '';
  picked.forEach((s) => {
    const btn = document.createElement('button');
    btn.className = 'suggestion-chip';
    btn.dataset.text = s.text;
    btn.textContent = s.label;
    suggestionsEl.appendChild(btn);
  });
}

suggestionsEl.addEventListener('click', (e) => {
  const chip = e.target.closest('.suggestion-chip');
  if (!chip) return;
  userInput.value = chip.dataset.text;
  userInput.dispatchEvent(new Event('input'));
  userInput.focus();
});

// ---------- Speech-to-Text (Web Speech API) ----------
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const micBtn = document.getElementById('micBtn');

let recognition = null;
let isListening = false;

function setMicUI(listening) {
  if (!micBtn) return;
  micBtn.textContent = listening ? '🛑' : '🎤';
  micBtn.classList.toggle('listening', listening);
}

function stopListening() {
  if (!recognition) return;
  try {
    recognition.stop();
  } catch {
    // ignore
  }
}

function startListening() {
  if (!SpeechRecognition) {
    showToast('SpeechRecognition tidak didukung browser ini');
    return;
  }
  if (isListening) return;

  recognition = new SpeechRecognition();
  recognition.lang = 'id-ID';
  recognition.interimResults = true;
  recognition.continuous = true;

  recognition.onstart = () => {
    isListening = true;
    setMicUI(true);
    showToast('Dengerin mikrofon...');
  };

  recognition.onresult = (event) => {
    let transcript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }

    const text = transcript.trim();
    if (!text) return;

    userInput.value = text;
    userInput.dispatchEvent(new Event('input'));
    userInput.focus();
  };

  recognition.onerror = (event) => {
    isListening = false;
    setMicUI(false);
    showToast('Gagal mic/recognition: ' + (event.error || 'unknown'));
  };

  recognition.onend = () => {
    isListening = false;
    setMicUI(false);
  };

  try {
    recognition.start();
  } catch {
    showToast('Tidak bisa mulai mic sekarang');
  }
}

if (micBtn) {
  micBtn.addEventListener('click', () => {
    if (isGenerating) return;
    if (isListening) stopListening();
    else startListening();
  });
}

// ---------- Init ----------
if (conversations.length === 0) {
  createNewConversation(false);
} else {
  currentConvId = conversations[0].id;
}
renderHistory();
renderMessages();
renderRandomSuggestions();

const themeToggle = document.getElementById("themeToggle");

const savedTheme = localStorage.getItem("theme");

if(savedTheme === "light"){
    document.documentElement.setAttribute("data-theme","light");
    themeToggle.checked = true;
}

themeToggle.addEventListener("change",()=>{

    if(themeToggle.checked){
        document.documentElement.setAttribute("data-theme","light");
        localStorage.setItem("theme","light");
    }else{
        document.documentElement.removeAttribute("data-theme");
        localStorage.setItem("theme","dark");
    }

});