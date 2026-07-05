module.exports = function ensureAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.email === process.env.ADMIN_EMAIL) return next();
  res.status(403).send('⛔ Solo admin');
};
