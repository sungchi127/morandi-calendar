const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  avatar: {
    type: String,
    default: ''
  },
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      browser: { type: Boolean, default: true },
      mobile: { type: Boolean, default: true }
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'morandi'],
      default: 'morandi'
    },
    defaultCalendarView: {
      type: String,
      enum: ['month', 'week', 'day'],
      default: 'month'
    },
    timezone: {
      type: String,
      default: 'Asia/Taipei'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);