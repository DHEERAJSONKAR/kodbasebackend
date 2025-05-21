var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require("cors");
const passport = require('passport');
const session = require('express-session');
// Import the fs module for error handling without templates
const fs = require('fs');
require('dotenv').config();

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const connectDB = require('./config/db');

connectDB();

var app = express();

// GitHub OAuth configuration
try {
  require('./config/passport-github');
  console.log('GitHub authentication strategy initialized successfully');
} catch (error) {
  console.warn('GitHub strategy initialization error:', error.message);
}

// Google OAuth configuration
try {
  const GoogleStrategy = require('passport-google-oauth20').Strategy;
  
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3001/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    console.log("Google profile received");
    return done(null, profile);
  }));
} catch (error) {
  console.warn('Google strategy not available:', error.message);
}

// Facebook OAuth configuration
try {
  const FacebookStrategy = require('passport-facebook').Strategy;
  
  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3001/auth/facebook/callback",
    profileFields: ['id', 'displayName', 'photos', 'email']
  },
  function(accessToken, refreshToken, profile, done) {
    console.log("Facebook profile received");
    return done(null, profile);
  }));
} catch (error) {
  console.warn('Facebook strategy not available:', error.message);
}

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

// view engine setup - avoid jade dependency issues
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.engine('html', function(path, options, callback) {
  fs.readFile(path, 'utf-8', callback);
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// CORS configuration
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests from these origins
    const allowedOrigins = [
      'http://localhost:5173',
      'https://kodebasefrontend.vercel.app',
      'https://kodebase.vercel.app'
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('Blocked origin:', origin);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Session configuration
app.use(session({
  secret: process.env.JWT_SECRET || 'your_jwt_secret',
  resave: false,
  saveUninitialized: false
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/auth', require('./routes/auth'));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler - return JSON instead of rendering views
app.use(function(err, req, res, next) {
  const message = err.message;
  const error = req.app.get('env') === 'development' ? err : {};
  const status = err.status || 500;

  res.status(status);
  res.json({
    success: false,
    error: {
      message: message,
      status: status
    }
  });
});

module.exports = app;
