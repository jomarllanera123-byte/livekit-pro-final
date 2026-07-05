const screenPreview = document.getElementById('screenPreview');
const cameraPreview = document.getElementById('cameraPreview');
const emptyState = document.getElementById('emptyState');
const liveBadge = document.getElementById('liveBadge');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const screenBtn = document.getElementById('screenBtn');
const cameraBtn = document.getElementById('cameraBtn');
const micBtn = document.getElementById('micBtn');

let peer, screenStream, cameraStream, mixedStream;
let cameraEnabled = true;
let micEnabled = true;
const calls = new Set();

async function getStreams() {
  screenStream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 30 }, audio: true });
  cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  screenPreview.srcObject = screenStream;
  cameraPreview.srcObject = cameraStream;
  mixedStream = new MediaStream([
    ...screenStream.getVideoTracks(),
    ...screenStream.getAudioTracks(),
    ...cameraStream.getVideoTracks(),
    ...cameraStream.getAudioTracks()
  ]);
}

async function startLive() {
  await getStreams();
  peer = new Peer(window.STREAM_CONFIG.peerOptions);
  peer.on('open', id => {
    socket.emit('admin-ready', id);
    setLive(true);
  });
  peer.on('call', call => {
    call.answer(mixedStream);
    calls.add(call);
    call.on('close', () => calls.delete(call));
  });
  screenStream.getVideoTracks()[0].onended = stopLive;
}

function stopLive() {
  [screenStream, cameraStream, mixedStream].forEach(stream => stream?.getTracks().forEach(t => t.stop()));
  calls.forEach(call => call.close());
  calls.clear();
  if (peer) peer.destroy();
  socket.emit('stream-stopped');
  screenPreview.srcObject = null;
  cameraPreview.srcObject = null;
  setLive(false);
}

function setLive(live) {
  liveBadge.textContent = live ? 'LIVE' : 'OFFLINE';
  liveBadge.classList.toggle('off', !live);
  emptyState.style.display = live ? 'none' : 'grid';
  startBtn.disabled = live;
  stopBtn.disabled = !live;
}

cameraBtn.onclick = () => {
  cameraEnabled = !cameraEnabled;
  cameraStream?.getVideoTracks().forEach(t => t.enabled = cameraEnabled);
  cameraPreview.style.display = cameraEnabled ? 'block' : 'none';
};
micBtn.onclick = () => {
  micEnabled = !micEnabled;
  cameraStream?.getAudioTracks().forEach(t => t.enabled = micEnabled);
};
screenBtn.onclick = async () => {
  if (screenStream) screenStream.getTracks().forEach(t => t.stop());
  screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
  screenPreview.srcObject = screenStream;
};
startBtn.onclick = () => startLive().catch(err => alert('Error iniciando transmisión: ' + err.message));
stopBtn.onclick = stopLive;
