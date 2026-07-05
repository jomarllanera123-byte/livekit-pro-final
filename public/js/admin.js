import { Room, RoomEvent, Track, createLocalScreenTracks, createLocalVideoTrack, createLocalAudioTrack } from 'https://cdn.jsdelivr.net/npm/livekit-client/+esm';
import { socket, getMe, getLiveKitConfig, setupChat, setupLiveUi } from './common.js';

const screenVideo = document.getElementById('screenVideo');
const cameraVideo = document.getElementById('cameraVideo');
const emptyState = document.getElementById('emptyState');
const liveBadge = document.getElementById('liveBadge');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const camBtn = document.getElementById('camBtn');
const micBtn = document.getElementById('micBtn');
const screenBtn = document.getElementById('screenBtn');
const statusEl = document.getElementById('status');
const qualitySelect = document.getElementById('qualitySelect');
const fpsSelect = document.getElementById('fpsSelect');
const bitrateSelect = document.getElementById('bitrateSelect');
const timerEl = document.getElementById('liveTimer');

let room, screenTracks = [], cameraTrack, micTrack;
let cameraOn = true, micOn = true, startedAt = 0, timer;
const QUALITIES = { '720p': {width:1280,height:720, bitrate:2500000}, '1080p': {width:1920,height:1080, bitrate:6000000}, '1440p': {width:2560,height:1440, bitrate:12000000}, '2160p': {width:3840,height:2160, bitrate:20000000} };
function status(t){ statusEl.textContent = t; }
function selectedQuality(){ const q=QUALITIES[qualitySelect.value] || QUALITIES['1080p']; const fps=Number(fpsSelect.value||30); const br=bitrateSelect.value==='auto' ? q.bitrate : Number(bitrateSelect.value); return {...q, fps, bitrate:br}; }
function setLive(on){ liveBadge.textContent=on?'LIVE':'OFFLINE'; liveBadge.classList.toggle('off',!on); emptyState.style.display=on?'none':'grid'; startBtn.disabled=on; stopBtn.disabled=!on; screenBtn.disabled=!on; }
function startTimer(){ startedAt=Date.now(); timer=setInterval(()=>{ const s=Math.floor((Date.now()-startedAt)/1000); const h=String(Math.floor(s/3600)).padStart(2,'0'); const m=String(Math.floor((s%3600)/60)).padStart(2,'0'); const ss=String(s%60).padStart(2,'0'); timerEl.textContent=`${h}:${m}:${ss}`; },500); }
function stopTimer(){ clearInterval(timer); timerEl.textContent='00:00:00'; }
async function connectRoom(){ const cfg=await getLiveKitConfig(); const q=selectedQuality(); room=new Room({ adaptiveStream:true, dynacast:true, publishDefaults:{ videoEncoding:{ maxBitrate:q.bitrate, maxFramerate:q.fps }, screenShareEncoding:{ maxBitrate:q.bitrate, maxFramerate:q.fps } } }); room.on(RoomEvent.Disconnected,()=>{status('Desconectado de LiveKit'); setLive(false);}); await room.connect(cfg.url, cfg.token); status('Conectado a LiveKit.'); }
async function publishScreen(){ const q=selectedQuality(); screenTracks=await createLocalScreenTracks({ audio:true, video:{ resolution:{ width:q.width, height:q.height }, frameRate:q.fps } }); for(const t of screenTracks){ await room.localParticipant.publishTrack(t, t.kind===Track.Kind.Video ? { name:'screen', source:Track.Source.ScreenShare, videoEncoding:{ maxBitrate:q.bitrate, maxFramerate:q.fps } } : { name:'screen-audio', source:Track.Source.ScreenShareAudio }); } const videoTrack=screenTracks.find(t=>t.kind===Track.Kind.Video); if(videoTrack){ videoTrack.attach(screenVideo); videoTrack.mediaStreamTrack.onended=()=>stopLive(); } }
async function publishCameraMic(){ const q=selectedQuality(); const camW = q.width >= 1920 ? 1280 : 960; const camH = q.width >= 1920 ? 720 : 540; cameraTrack=await createLocalVideoTrack({ resolution:{ width:camW, height:camH }, frameRate:Math.min(q.fps,30), facingMode:'user' }); await room.localParticipant.publishTrack(cameraTrack,{ name:'camera', source:Track.Source.Camera, videoEncoding:{ maxBitrate:Math.min(q.bitrate,3000000), maxFramerate:30 } }); cameraTrack.attach(cameraVideo); micTrack=await createLocalAudioTrack({ echoCancellation:true, noiseSuppression:true, autoGainControl:true }); await room.localParticipant.publishTrack(micTrack,{ name:'microphone', source:Track.Source.Microphone }); }
async function startLive(){ try{ setLive(true); status('Conectando...'); await connectRoom(); await publishScreen(); await publishCameraMic(); socket.emit('live-started'); startTimer(); const q=selectedQuality(); status(`Transmitiendo ${q.width}x${q.height} @ ${q.fps} FPS / ${(q.bitrate/1000000).toFixed(1)} Mbps`); }catch(e){ alert('Error iniciando transmisión: '+e.message); console.error(e); await stopLive(); } }
async function stopLive(){ try{ [...screenTracks,cameraTrack,micTrack].filter(Boolean).forEach(t=>{ try{ room?.localParticipant?.unpublishTrack(t); t.stop(); t.detach?.().forEach(el=>el.remove()); }catch{} }); screenTracks=[]; cameraTrack=null; micTrack=null; await room?.disconnect(); room=null; } finally { screenVideo.srcObject=null; cameraVideo.srcObject=null; socket.emit('live-stopped'); setLive(false); stopTimer(); status('Live detenido.'); } }
camBtn.onclick=async()=>{ cameraOn=!cameraOn; if(cameraTrack) cameraOn ? await cameraTrack.unmute() : await cameraTrack.mute(); cameraVideo.style.display=cameraOn?'block':'none'; };
micBtn.onclick=async()=>{ micOn=!micOn; if(micTrack) micOn ? await micTrack.unmute() : await micTrack.mute(); };
screenBtn.onclick=async()=>{ if(!room) return; screenTracks.forEach(t=>{ try{room.localParticipant.unpublishTrack(t); t.stop();}catch{} }); await publishScreen(); };
startBtn.onclick=startLive; stopBtn.onclick=stopLive;
const user=await getMe(); setupChat(user); setupLiveUi(); setLive(false);
