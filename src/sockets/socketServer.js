const { Server } = require('socket.io');

module.exports = function setupSocketServer(server) {
  const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    transports: ['websocket', 'polling']
  });

  let chatHistory = [];
  let isLive = false;
  let adminPeerId = null;
  let viewerCount = 0;

  io.on('connection', (socket) => {
    viewerCount++;
    io.emit('viewer-count', viewerCount);
    socket.emit('stream-status', { isLive, adminPeerId });
    socket.emit('chat-history', chatHistory.slice(-100));

    socket.on('admin-ready', (peerId) => {
      adminPeerId = peerId;
      isLive = true;
      io.emit('stream-status', { isLive: true, adminPeerId });
    });

    socket.on('stream-stopped', () => {
      isLive = false;
      adminPeerId = null;
      io.emit('stream-status', { isLive: false, adminPeerId: null });
    });

    socket.on('chat-message', (msg) => {
      if (!msg?.text) return;
      const message = {
        user: msg.user || 'anon',
        picture: msg.picture || '',
        text: String(msg.text).slice(0, 500),
        time: new Date().toLocaleTimeString()
      };
      chatHistory.push(message);
      if (chatHistory.length > 200) chatHistory.shift();
      io.emit('chat-message', message);
    });

    socket.on('disconnect', () => {
      viewerCount = Math.max(0, viewerCount - 1);
      io.emit('viewer-count', viewerCount);
    });
  });
};
