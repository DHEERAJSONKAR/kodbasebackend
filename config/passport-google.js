const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const userModel = require('../models/userModel');
require('dotenv').config();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3001/auth/google/callback",
    passReqToCallback: true
  },
  async function(req, accessToken, refreshToken, profile, done) {
    try {
      // Check if user exists by Google ID or email
      let user = await userModel.findOne({ 
        $or: [
          { googleId: profile.id },
          { email: profile.emails[0].value }
        ]
      });
      
      if (!user) {
        // Create new user if doesn't exist
        user = await userModel.create({
          email: profile.emails[0].value,
          fullName: profile.displayName,
          password: Math.random().toString(36).slice(-8), // Generate random password
          googleId: profile.id
        });
      } else if (!user.googleId) {
        // Update existing user's Google ID if not set
        user.googleId = profile.id;
        await user.save();
      }
      
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

module.exports = passport;
