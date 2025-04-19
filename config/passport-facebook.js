const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
require('dotenv').config();

// Configure the Facebook strategy for use by Passport
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID || "876456147548863", // Using a sample app ID if env is not available
    clientSecret: process.env.FACEBOOK_APP_SECRET || "b74220dfd849b798d78f30ea9ce99617", // Using a sample secret if env is not available
    callbackURL: "http://localhost:3001/auth/facebook/callback",
    profileFields: ['id', 'displayName', 'name', 'emails', 'photos'], // Request these fields
    enableProof: true
  },
  function(accessToken, refreshToken, profile, done) {
    // Log profile for debugging
    console.log('Facebook authentication successful, profile:', JSON.stringify(profile));
    return done(null, profile);
  }
));

module.exports = passport;
