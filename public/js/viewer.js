import { Room, RoomEvent, Track } from 'https://cdn.jsdelivr.net/npm/livekit-client/+esm';
import { socket, getMe, getLiveKitConfig, setupChat, setupLiveUi } from './common.js';

const screenVideo=document.getElementById('screenVideo');
const cameraVideo=document.getElementById('cameraVideo');
const emptyState=document.getElementById('emptyState');
const statusEl=document.getElementById('status');
let room;
function status(t){ statusEl.textContent=t; }
function showLive(on){ emptyState.style.display=on?'none':'grid'; }
async function connect(){
  try{
    const cfg=await getLiveKitConfig(); room=new Room({ adaptiveStream:true, dynacast:true });
    room.on(RoomEvent.TrackSubscribed,(track, pub)=>attachTrack(track,pub));
    room.on(RoomEvent.TrackUnsubscribed,(track)=>{ track.detach().forEach(el=>{ el.srcObject=null; }); });
    room.on(RoomEvent.Disconnected,()=>status('Desconectado. Intentando reconectar...'));
    await room.connect(cfg.url,cfg.token); status('Conectado. Esperando video...');
    room.remoteParticipants.forEach(p=>p.trackPublications.forEach(pub=>{ if(pub.track) attachTrack(pub.track,pub); }));
  }catch(e){ status('Error conectando: '+e.message); console.error(e); setTimeout(connect,3000); }
}
function attachTrack(track,pub){
  if(track.kind===Track.Kind.Audio){ track.attach(); return; }
  const source=pub.source;
  if(source===Track.Source.ScreenShare || pub.trackName==='screen') { track.attach(screenVideo); showLive(true); status('Viendo transmisión en vivo.'); return; }
  if(source===Track.Source.Camera || pub.trackName==='camera') { track.attach(cameraVideo); cameraVideo.style.display='block'; return; }
}
socket.on('live-status', on=>{ showLive(on); if(!on){ status('El live todavía no empieza.'); screenVideo.srcObject=null; cameraVideo.srcObject=null; } });
const user=await getMe(); setupChat(user); setupLiveUi(); await connect();
