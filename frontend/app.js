// app.js
// Logika frontend untuk AI Agent Chat

const BACKEND_URL = 'http://localhost:3001/api/chat';

const messagesEl = document.getElementById('messages');
const chatForm = document.getElementById('chatForm');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const newChatBtn = document.getElementById('newChatBtn');
const historyList = document.getElementById('historyList');

// Menyimpan semua percakapan di localStorage browser
let conversations = JSON.parse(localStorage.getItem('conversations') || '[]');
let currentConvId = null;

function saveConversations() {
  localStorage.setItem('conversations', JSON.stringify(conversations));
}

function createNewConversation() {
  const conv = {
    id: Date.now().toString(),
    title: 'Obrolan Baru',
    messages: [],
  };
  conversations.unshift(conv);
  currentConvId = conv.id;
  saveConversations();
  renderHistory();
  renderMessages();
}

function getCurrentConversation() {
  return conversations.find((c) => c.id === currentConvId);
}

function renderHistory() {
  historyList.innerHTML = '';
  conversations.forEach((conv) => {
    const item = document.createElement('div');
    item.className = 'history-item' + (conv.id === currentConvId ? ' active' : '');
    item.textContent = conv.title;
    item.addEventListener('click', () => {
      currentConvId = conv.id;
      renderHistory();
      renderMessages();
    });
    historyList.appendChild(item);
  });
}

function renderMessages() {
  messagesEl.innerHTML = '';
  const conv = getCurrentConversation();
  if (!conv) return;

  conv.messages.forEach((msg) => {
    appendMessageBubble(msg.role, msg.content);
  });
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function appendMessageBubble(role, content) {
  const bubble = document.createElement('div');
  bubble.className = `message ${role}`;
  bubble.textContent = content;
  messagesEl.appendChild(bubble);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return bubble;
}

async function sendMessage(text) {
  let conv = getCurrentConversation();
  if (!conv) {
    createNewConversation();
    conv = getCurrentConversation();
  }

  // Tambahkan pesan user
  conv.messages.push({ role: 'user', content: text });
  if (conv.title === 'Obrolan Baru') {
    conv.title = text.slice(0, 30) + (text.length > 30 ? '...' : '');
  }
  saveConversations();
  renderHistory();
  appendMessageBubble('user', text);

  // Tampilkan indikator "sedang mengetik"
  const typingBubble = appendMessageBubble('assistant typing', 'AI sedang mengetik...');

  sendBtn.disabled = true;

  try {
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: conv.messages,
        systemPrompt: 'Kamu adalah asisten AI yang ramah, jelas, dan membantu pengguna dalam Bahasa Indonesia.',
      }),
    });

    const data = await response.json();
    typingBubble.remove();

    if (!response.ok) {
      throw new Error(data.error || 'Terjadi kesalahan pada server.');
    }

    conv.messages.push({ role: 'assistant', content: data.reply });
    saveConversations();
    appendMessageBubble('assistant', data.reply);
  } catch (err) {
    typingBubble.remove();
    appendMessageBubble('assistant', `Maaf, terjadi kesalahan: ${err.message}`);
  } finally {
    sendBtn.disabled = false;
  }
}

// ---------- Event listeners ----------
chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = userInput.value.trim();
  if (!text) return;
  userInput.value = '';
  userInput.style.height = 'auto';
  sendMessage(text);
});

// Auto-resize textarea
userInput.addEventListener('input', () => {
  userInput.style.height = 'auto';
  userInput.style.height = userInput.scrollHeight + 'px';
});

// Kirim dengan Enter, baris baru dengan Shift+Enter
userInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    chatForm.requestSubmit();
  }
});

newChatBtn.addEventListener('click', createNewConversation);

// ---------- Inisialisasi ----------
if (conversations.length === 0) {
  createNewConversation();
} else {
  currentConvId = conversations[0].id;
  renderHistory();
  renderMessages();
}
