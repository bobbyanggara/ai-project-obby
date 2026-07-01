// ================= BACKEND =================
const BACKEND_URL = "https://ai-project-obby.vercel.app/api/chat";

// ================= VIEWPORT FIX (ONLY ONCE) =================
function setVH() {
  document.documentElement.style.setProperty(
    "--vh",
    `${window.innerHeight * 0.01}px`
  );
}
setVH();
window.addEventListener("resize", setVH);

// ================= ELEMENTS =================
const messagesEl = document.getElementById("messages");
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");

const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
const backdrop = document.getElementById("backdrop");

const newChatBtn = document.getElementById("newChatBtn");
const historyList = document.getElementById("historyList");

// ================= STATE =================
let conversations = JSON.parse(localStorage.getItem("conversations") || "[]");
let currentId = null;

// ================= SAVE =================
function save() {
  localStorage.setItem("conversations", JSON.stringify(conversations));
}

// ================= GET CHAT =================
function getChat() {
  return conversations.find(c => c.id === currentId);
}

// ================= SCROLL FIX =================
function scrollToBottom() {
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

// ================= CREATE CHAT =================
function createChat() {
  const chat = {
    id: Date.now().toString(),
    title: "Obrolan Baru",
    messages: []
  };

  conversations.unshift(chat);
  currentId = chat.id;

  save();
  renderHistory();
  renderMessages();
}

// ================= HISTORY =================
function renderHistory() {
  historyList.innerHTML = "";

  conversations.forEach(c => {
    const item = document.createElement("div");
    item.className = "history-item";

    const title = document.createElement("div");
    title.className = "history-title";
    title.textContent = c.title;

    title.onclick = () => {
      currentId = c.id;
      renderHistory();
      renderMessages();
      closeSidebar();
    };

    const del = document.createElement("button");
    del.className = "delete-chat";
    del.textContent = "🗑";

    del.onclick = (e) => {
      e.stopPropagation();

      conversations = conversations.filter(x => x.id !== c.id);

      if (!conversations.length) return createChat();

      currentId = conversations[0].id;

      save();
      renderHistory();
      renderMessages();
    };

    item.append(title, del);
    historyList.appendChild(item);
  });
}

// ================= RENDER MESSAGES =================
function renderMessages() {
  messagesEl.innerHTML = "";

  const chat = getChat();
  if (!chat?.messages.length) return showEmpty();

  chat.messages.forEach(m => {
    appendMessage(m.role, m.content);
  });

  scrollToBottom();
}

// ================= EMPTY STATE =================
function showEmpty() {
  const e = document.createElement("div");
  e.style.opacity = "0.5";
  e.style.textAlign = "center";
  e.style.marginTop = "40px";
  e.textContent = "Mulai chat dengan Obby AI 🚀";
  messagesEl.appendChild(e);
}

// ================= MESSAGE =================
function appendMessage(role, text) {
  const wrapper = document.createElement("div");
  wrapper.className = `message ${role}`;

  const content = document.createElement("div");
  content.className = "msg-text";
  content.innerHTML = formatText(text);

  wrapper.appendChild(content);

  if (role === "assistant") {
    addActions(wrapper, text);
  }

  messagesEl.appendChild(wrapper);

  scrollToBottom();

  return wrapper;
}

// ================= ACTIONS =================
function addActions(wrapper, text) {
  const actions = document.createElement("div");
  actions.className = "msg-actions";

  const copyBtn = createBtn("📋", () => {
    navigator.clipboard.writeText(text);
    toast("Copied ✔");
  });

  const shareBtn = createBtn("🔗", async () => {
    try {
      if (navigator.share) {
        await navigator.share({ text });
        return;
      }
    } catch {}
    navigator.clipboard.writeText(text);
    toast("Copied ✔");
  });

  const likeBtn = createBtn("👍");
  const dislikeBtn = createBtn("👎");

  // ===== FEEDBACK STATE =====
  function sendFeedback(type) {
    const msg = document.createElement("div");
    msg.className = "message assistant";
    msg.style.opacity = "0.7";
    msg.style.fontSize = "12px";

    if (type === "like") {
      msg.textContent = "🙏 Terima kasih atas feedback Anda!";
    } else {
      msg.textContent = "🙏 Terima kasih atas feedback Anda! Kami akan meningkatkan respons AI.";
    }

    messagesEl.appendChild(msg);
    scrollToBottom();
    toast("Feedback terkirim ✔");
  }

  likeBtn.onclick = () => {
    likeBtn.classList.add("liked");
    dislikeBtn.classList.remove("disliked");

    sendFeedback("like");
  };

  dislikeBtn.onclick = () => {
    dislikeBtn.classList.add("disliked");
    likeBtn.classList.remove("liked");

    sendFeedback("dislike");
  };

  actions.append(copyBtn, shareBtn, likeBtn, dislikeBtn);
  wrapper.appendChild(actions);
}

// ================= BUTTON =================
function createBtn(label, fn) {
  const b = document.createElement("button");
  b.className = "msg-btn";
  b.textContent = label;
  b.type = "button";
  if (fn) b.onclick = fn;
  return b;
}

// ================= FORMAT TEXT =================
function formatText(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
    .replace(/`(.*?)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br>");
}

// ================= TOAST =================
function toast(msg) {
  const t = document.createElement("div");

  Object.assign(t.style, {
    position: "fixed",
    bottom: "80px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "#111",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: "10px",
    fontSize: "13px",
    zIndex: 9999
  });

  t.textContent = msg;
  document.body.appendChild(t);

  setTimeout(() => t.remove(), 1400);
}

// ================= TYPEWRITER =================
function typeWriter(el, text) {
  el.innerHTML = "";
  let i = 0;

  return new Promise(resolve => {
    const interval = setInterval(() => {
      el.innerHTML += text[i] || "";
      i++;

      scrollToBottom();

      if (i >= text.length) {
        clearInterval(interval);
        resolve();
      }
    }, 10);
  });
}

// ================= SEND MESSAGE =================
async function sendMessage(text) {
  let chat = getChat();
  if (!chat) return;

  chat.messages.push({ role: "user", content: text });

  if (chat.title === "Obrolan Baru") {
    chat.title = text.slice(0, 30);
  }

  save();
  renderHistory();

  appendMessage("user", text);

  const typing = document.createElement("div");
  typing.className = "message assistant";
  typing.textContent = "sedang berpikir...";
  messagesEl.appendChild(typing);

  scrollToBottom();

  try {
    const res = await fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: chat.messages })
    });

    const data = await res.json();

    typing.remove();

    const ai = document.createElement("div");
    ai.className = "message assistant";

    const textEl = document.createElement("div");
    textEl.className = "msg-text";

    ai.appendChild(textEl);
    messagesEl.appendChild(ai);

    await typeWriter(textEl, data.reply);

    addActions(ai, data.reply);

    chat.messages.push({
      role: "assistant",
      content: data.reply
    });

    save();

  } catch (e) {
    typing.textContent = "Error: " + e.message;
  }
}

// ================= SIDEBAR =================
function openSidebar() {
  sidebar.classList.remove("hidden");
  backdrop.classList.add("active");
}

function closeSidebar() {
  sidebar.classList.add("hidden");
  backdrop.classList.remove("active");
}

// ================= EVENTS =================
chatForm.addEventListener("submit", e => {
  e.preventDefault();

  const text = userInput.value.trim();

  if (!text) {
    toast("⚠️ Pesan tidak boleh kosong");
    userInput.focus();
    return;
  }

  userInput.value = "";
  sendMessage(text);
});

menuBtn.onclick = openSidebar;
backdrop.onclick = closeSidebar;
newChatBtn.onclick = createChat;

// ================= INIT =================
if (!conversations.length) createChat();
else {
  currentId = conversations[0].id;
  renderHistory();
  renderMessages();
}
// ===== PRO MAX KEYBOARD SMOOTH FIX =====
const inputBar = document.querySelector(".chat-input-form");

if (window.visualViewport) {
  const vp = window.visualViewport;

  let lastOffset = 0;

  function adjustKeyboard() {
    const offset = window.innerHeight - vp.height - vp.offsetTop;

    // smoothing (anti jitter)
    const smooth = offset * 0.9;

    if (Math.abs(smooth - lastOffset) < 1) return;

    lastOffset = smooth;

    inputBar.style.transform = offset > 0
      ? `translateY(-${smooth}px)`
      : "translateY(0)";
  }

  vp.addEventListener("resize", adjustKeyboard);
  vp.addEventListener("scroll", adjustKeyboard);
}