require('dotenv').config();

const express = require('express');
const session = require('express-session');
const passport = require('passport');
const http = require('http');
const path = require('path');

const configureGoogleAuth = require('./src/auth/googleAuth');
const ensureAuth = require('./src/middleware/ensureAuth');
const ensureAdmin = require('./src/middleware/ensureAdmin');
const setupPeerServer = require('./src/streaming/peerServer');
const setupSocketServer = require('./src/sockets/socketServer');

const app = express();
const server = http.createServer(app);

app.use(session({
  secret: process.env.SESSION_SECRET || 'secreto-temporal',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax',
    secure: process.env.APP_URL?.startsWith('https://') || false
  }
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

configureGoogleAuth(passport);
app.use(passport.initialize());
app.use(passport.session());

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => res.redirect(req.user.email === process.env.ADMIN_EMAIL ? '/admin' : '/')
);

app.get('/logout', (req, res) => req.logout(() => res.redirect('/login')));

app.get('/login', (req, res) => {
  if (req.isAuthenticated()) return res.redirect(req.user.email === process.env.ADMIN_EMAIL ? '/admin' : '/');
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/', ensureAuth, (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/admin', ensureAuth, ensureAdmin, (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

app.get('/api/me', (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'no auth' });
  res.json({
    name: req.user.name,
    email: req.user.email,
    picture: req.user.picture,
    isAdmin: req.user.email === process.env.ADMIN_EMAIL
  });
});

setupPeerServer(app, server);
setupSocketServer(server);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running: http://localhost:${PORT}`);
  console.log(`👑 Admin: ${process.env.ADMIN_EMAIL}`);
});
