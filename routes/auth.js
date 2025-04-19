const express = require('express');
const passport = require('passport');
const router = express.Router();
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
require('../config/passport-github'); // Import the passport configuration
require('dotenv').config();

const secret = process.env.JWT_SECRET || "your_jwt_secret";

// GitHub Auth Routes
router.get('/github', (req, res, next) => {
  console.log('GitHub auth route accessed');
  passport.authenticate('github', { scope: ['user:email'] })(req, res, next);
});

router.get('/github/callback', (req, res, next) => {
  console.log('GitHub callback route accessed');
  
  passport.authenticate('github', { failureRedirect: '/login' }, async (err, profile) => {
    if (err) {
      console.error('GitHub auth error:', err);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=github_auth_failed`);
    }
    
    if (!profile) {
      console.error('No profile returned from GitHub');
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=github_auth_failed`);
    }
    
    try {
      console.log('Processing GitHub profile:', profile);
      
      // Access email from the profile
      let email = '';
      if (profile.emails && profile.emails.length > 0) {
        email = profile.emails[0].value;
      } else {
        console.error('No email found in GitHub profile');
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=github_email_not_available`);
      }
      
      // Try to find the user
      let user = await userModel.findOne({ 
        $or: [
          { githubId: profile.id },
          { email: email }
        ]
      });
      
      if (!user) {
        console.log('Creating new user from GitHub profile');
        // Create new user
        user = await userModel.create({
          email: email,
          fullName: profile.displayName || profile.username || 'GitHub User',
          password: Math.random().toString(36).slice(-8), // Generate random password
          githubId: profile.id
        });
      } else {
        console.log('Updating existing user with GitHub ID');
        // Update existing user with GitHub ID if needed
        if (!user.githubId) {
          user.githubId = profile.id;
          await user.save();
        }
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id },
        secret,
        { expiresIn: '24h' }
      );

      console.log('Authentication successful, redirecting to frontend');
      // Redirect to frontend with token and fullName
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?token=${token}&fullName=${encodeURIComponent(user.fullName)}`);
    } catch (error) {
      console.error('Error during GitHub auth processing:', error);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=github_auth_failed`);
    }
  })(req, res, next);
});

// Google Auth Routes
router.get('/google', (req, res, next) => {
  console.log('Google auth route accessed');
  // This will redirect to Google's authentication page
  passport.authenticate('google', { 
    scope: ['profile', 'email']
  })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
  console.log('Google callback route accessed');
  
  passport.authenticate('google', { failureRedirect: '/login' }, async (err, profile) => {
    if (err) {
      console.error('Google auth error:', err);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=google_auth_failed`);
    }
    
    if (!profile) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=google_auth_failed`);
    }
    
    try {
      // Process the Google profile
      let email = profile.emails[0].value;
      
      // Try to find the user
      let user = await userModel.findOne({ 
        $or: [
          { googleId: profile.id },
          { email: email }
        ]
      });
      
      if (!user) {
        // Create new user
        user = await userModel.create({
          email: email,
          fullName: profile.displayName,
          password: Math.random().toString(36).slice(-8), // Generate random password
          googleId: profile.id
        });
      } else {
        // Update existing user with Google ID if needed
        if (!user.googleId) {
          user.googleId = profile.id;
          await user.save();
        }
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id },
        secret,
        { expiresIn: '24h' }
      );

      // Redirect to frontend with token and fullName
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?token=${token}&fullName=${encodeURIComponent(user.fullName)}`);
    } catch (error) {
      console.error('Error during Google auth processing:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=google_auth_failed`);
    }
  })(req, res, next);
});

// Facebook Auth Routes
router.get('/facebook', (req, res, next) => {
  console.log('Facebook auth route accessed');
  passport.authenticate('facebook', { 
    scope: ['email', 'public_profile']
  })(req, res, next);
});

router.get('/facebook/callback', (req, res, next) => {
  console.log('Facebook callback route accessed');
  
  passport.authenticate('facebook', { failureRedirect: '/login' }, async (err, profile) => {
    if (err) {
      console.error('Facebook auth error:', err);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=facebook_auth_failed`);
    }
    
    if (!profile) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=facebook_auth_failed`);
    }
    
    try {
      // Process the Facebook profile
      let email = profile.emails[0].value;
      
      // Try to find the user
      let user = await userModel.findOne({ 
        $or: [
          { facebookId: profile.id },
          { email: email }
        ]
      });
      
      if (!user) {
        // Create new user
        user = await userModel.create({
          email: email,
          fullName: profile.displayName,
          password: Math.random().toString(36).slice(-8), // Generate random password
          facebookId: profile.id
        });
      } else {
        // Update existing user with Facebook ID if needed
        if (!user.facebookId) {
          user.facebookId = profile.id;
          await user.save();
        }
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id },
        secret,
        { expiresIn: '24h' }
      );

      // Redirect to frontend with token and fullName
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?token=${token}&fullName=${encodeURIComponent(user.fullName)}`);
    } catch (error) {
      console.error('Error during Facebook auth processing:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=facebook_auth_failed`);
    }
  })(req, res, next);
});

module.exports = router;
