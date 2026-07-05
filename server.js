require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const { AccessToken } = require('livekit-server-sdk');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*', methods: ['GET','POST'] } });

const PORT = process.env.PORT || 3000;
const APP_URL = (process.env.APP_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ROOM_NAME = process.env.LIVEKIT_ROOM || 'ochoa-live';

app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${APP_URL}/auth/google/callback`
}, (accessToken, refreshToken, profile, done) => {
  const email = profile.emails?.[0]?.value || '';
  done(null, { id: profile.id, name: profile.displayName || email, email, picture: profile.photos?.[0]?.value || '' });
}));
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

function ensureAuth(req, res, next){ if(req.isAuthenticated()) return next(); return res.redirect('/login'); }
function ensureAdmin(req, res, next){ if(req.isAuthenticated() && req.user.email === ADMIN_EMAIL) return next(); return res.status(403).send('Solo el administrador puede entrar aqui.'); }
async function makeLiveKitToken(user, role){
  if(!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) throw new Error('Faltan LIVEKIT_API_KEY o LIVEKIT_API_SECRET');
  const identity = `${role}-${user.id || Date.now()}`;
  const at = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, {
    identity,
    name: user.name || user.email || role,
    metadata: JSON.stringify({ email: user.email || '', role, picture: user.picture || '' })
  });
  at.addGrant({ room: ROOM_NAME, roomJoin: true, canPublish: role === 'admin', canSubscribe: true, canPublishData: true });
  return await at.toJwt();
}

app.get('/login', (req,res)=>{ if(req.isAuthenticated()) return res.redirect(req.user.email === ADMIN_EMAIL ? '/admin' : '/'); res.sendFile(path.join(__dirname,'public','login.html')); });
app.get('/auth/google', passport.authenticate('google', { scope: ['profile','email'] }));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login?error=google' }), (req,res)=>res.redirect(req.user.email === ADMIN_EMAIL ? '/admin' : '/'));
app.get('/logout', (req,res)=>req.logout(()=>res.redirect('/login')));
app.get('/', ensureAuth, (req,res)=>res.sendFile(path.join(__dirname,'public','index.html')));
app.get('/admin', ensureAuth, ensureAdmin, (req,res)=>res.sendFile(path.join(__dirname,'public','admin.html')));
app.get('/api/me', ensureAuth, (req,res)=>res.json({ ...req.user, isAdmin: req.user.email === ADMIN_EMAIL }));
app.get('/api/livekit/token', ensureAuth, async (req,res)=>{
  try { const role = req.user.email === ADMIN_EMAIL ? 'admin' : 'viewer'; const token = await makeLiveKitToken(req.user, role); res.json({ token, url: process.env.LIVEKIT_URL, room: ROOM_NAME, role }); }
  catch(e){ console.error(e); res.status(500).json({ error: e.message }); }
});

let live = false, viewerCount = 0, chatHistory = [];
io.on('connection', socket => {
  viewerCount++; io.emit('viewer-count', viewerCount); socket.emit('live-status', live); socket.emit('chat-history', chatHistory.slice(-100));
  socket.on('live-started', ()=>{ live = true; io.emit('live-status', true); });
  socket.on('live-stopped', ()=>{ live = false; io.emit('live-status', false); });
  socket.on('chat-message', msg=>{ if(!msg || !msg.text) return; const safe={ user:String(msg.user||'Usuario').slice(0,60), picture:msg.picture||'', text:String(msg.text).slice(0,500), time:new Date().toLocaleTimeString() }; chatHistory.push(safe); if(chatHistory.length>200) chatHistory.shift(); io.emit('chat-message', safe); });
  socket.on('disconnect', ()=>{ viewerCount=Math.max(0,viewerCount-1); io.emit('viewer-count', viewerCount); });
});

server.listen(PORT, ()=>{ console.log(`🚀 Server running on port ${PORT}`); console.log(`🌐 APP_URL: ${APP_URL}`); console.log(`👑 Admin: ${ADMIN_EMAIL}`); });
