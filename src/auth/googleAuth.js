const GoogleStrategy = require('passport-google-oauth20').Strategy;

module.exports = function configureGoogleAuth(passport) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn('⚠️ Falta GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET');
  }

  const appUrl = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');

  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${appUrl}/auth/google/callback`
  }, (accessToken, refreshToken, profile, done) => {
    const user = {
      id: profile.id,
      name: profile.displayName,
      email: profile.emails?.[0]?.value || 'no-email',
      picture: profile.photos?.[0]?.value || ''
    };
    done(null, user);
  }));

  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((user, done) => done(null, user));
};
