const { ExpressPeerServer } = require('peer');

module.exports = function setupPeerServer(app, server) {
  const peerServer = ExpressPeerServer(server, {
    debug: true,
    path: '/'
  });

  app.use('/peerjs', peerServer);
};
