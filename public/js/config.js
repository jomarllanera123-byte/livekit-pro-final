window.STREAM_CONFIG = {
  peerOptions: {
    host: window.location.hostname,
    port: window.location.protocol === 'https:' ? 443 : Number(window.location.port || 3000),
    path: '/peerjs',
    secure: window.location.protocol === 'https:',
    config: {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    }
  }
};
