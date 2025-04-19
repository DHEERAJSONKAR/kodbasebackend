const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  githubId: {
    type: String,
    sparse: true, // This ensures the index only applies to documents where the field exists
  },
  googleId: {
    type: String,
    sparse: true,
  },
  facebookId: {
    type: String,
    sparse: true,
  },
  name: {
    type: String
  },
  resetPasswordCode: String,
  resetPasswordExpires: Date,
  date: {
    type: Date,
    default: Date.now,
  }
});

// Create sparse indices for social auth IDs
userSchema.index({ githubId: 1 }, { unique: true, sparse: true });
userSchema.index({ googleId: 1 }, { unique: true, sparse: true });
userSchema.index({ facebookId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('User', userSchema);