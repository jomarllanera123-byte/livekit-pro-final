export const socket = io();
export async function getMe(){ const r = await fetch('/api/me'); if(!r.ok) location.href='/login'; return await r.json(); }
export async function getLiveKitConfig(){ const r = await fetch('/api/livekit/token'); const j = await r.json(); if(!r.ok) throw new Error(j.error || 'No token'); return j; }
export function setupChat(user){
  const box = document.getElementById('chatMessages'); const form = document.getElementById('chatForm'); const input = document.getElementById('chatInput');
  const add = (m)=>{ const d=document.createElement('div'); d.className='msg'; d.innerHTML=`<b>${escapeHtml(m.user)}</b> <small>${m.time||''}</small><br>${escapeHtml(m.text)}`; box.appendChild(d); box.scrollTop=box.scrollHeight; };
  socket.on('chat-history', list=>{ box.innerHTML=''; (list||[]).forEach(add); }); socket.on('chat-message', add);
  form?.addEventListener('submit', e=>{ e.preventDefault(); const text=input.value.trim(); if(!text) return; socket.emit('chat-message',{ user:user.name||user.email, picture:user.picture, text }); input.value=''; });
}
export function setupLiveUi(){ const vc=document.getElementById('viewerCount'); const badge=document.getElementById('liveBadge'); socket.on('viewer-count', n=>{ if(vc) vc.textContent=n; }); socket.on('live-status', on=>{ if(badge){ badge.textContent=on?'LIVE':'OFFLINE'; badge.classList.toggle('off',!on); } }); }
function escapeHtml(s){ return String(s||'').replace(/[&<>'"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
