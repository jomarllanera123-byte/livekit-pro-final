const remoteVideo = document.getElementById('remoteVideo');
const emptyState = document.getElementById('emptyState');
const liveBadge = document.getElementById('liveBadge');
let peer, currentCall;

function setLive(live) {
  liveBadge.textContent = live ? 'LIVE' : 'OFFLINE';
  liveBadge.classList.toggle('off', !live);
  emptyState.style.display = live ? 'none' : 'grid';
}

function connectToAdmin(adminPeerId) {
  if (!adminPeerId) return;
  if (currentCall) currentCall.close();
  peer = peer && !peer.destroyed ? peer : new Peer(window.STREAM_CONFIG.peerOptions);
  peer.on('open', () => {
    currentCall = peer.call(adminPeerId, new MediaStream());
    currentCall.on('stream', stream => {
      remoteVideo.srcObject = stream;
      remoteVideo.play().catch(() => {});
      setLive(true);
    });
    currentCall.on('close', () => setLive(false));
  });
}

socket.on('stream-status', status => {
  if (status?.isLive && status?.adminPeerId) connectToAdmin(status.adminPeerId);
  else {
    setLive(false);
    if (remoteVideo) remoteVideo.srcObject = null;
  }
});
