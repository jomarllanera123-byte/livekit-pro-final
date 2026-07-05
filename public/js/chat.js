window.socket = io();
let currentUser = { name: 'Usuario', picture: '' };

fetch('/api/me').then(r => r.json()).then(user => { currentUser = user; }).catch(() => {});

const chatMessages = document.getElementById('chatMessages');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const viewerCount = document.getElementById('viewerCount');

function addMessage(msg) {
  if (!chatMessages) return;
  const div = document.createElement('div');
  div.className = 'message';
  div.innerHTML = `<strong>${escapeHtml(msg.user)}</strong><small>${msg.time || ''}</small><p>${escapeHtml(msg.text)}</p>`;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function escapeHtml(text) {
  return String(text || '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

socket.on('viewer-count', count => { if (viewerCount) viewerCount.textContent = `${count} viewers`; });
socket.on('chat-history', list => { if (chatMessages) { chatMessages.innerHTML = ''; list.forEach(addMessage); } });
socket.on('chat-message', addMessage);

if (chatForm) {
  chatForm.addEventListener('submit', e => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;
    socket.emit('chat-message', { user: currentUser.name, picture: currentUser.picture, text });
    chatInput.value = '';
  });
}
