const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  isAllDay: {
    type: Boolean,
    default: false
  },
  color: {
    type: String,
    enum: [
      'morandi-sage',      // 鼠尾草綠
      'morandi-rose',      // 玫瑰粉
      'morandi-lavender',  // 薰衣草紫
      'morandi-peach',     // 蜜桃橘
      'morandi-blue',      // 霧霾藍
      'morandi-cream',     // 奶油色
      'morandi-grey'       // 暖灰色
    ],
    default: 'morandi-sage'
  },
  category: {
    type: String,
    enum: ['work', 'personal', 'friends', 'family', 'health', 'other'],
    default: 'personal'
  },
  location: {
    type: String,
    trim: true,
    maxlength: 200
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  attendees: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  privacy: {
    type: String,
    enum: ['private', 'shared', 'public'],
    default: 'private'
  },
  sharedWith: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permissions: {
      canView: { type: Boolean, default: true },
      canComment: { type: Boolean, default: true },
      canEdit: { type: Boolean, default: false }
    }
  }],
  recurrence: {
    type: {
      type: String,
      enum: ['none', 'daily', 'weekly', 'monthly', 'yearly'],
      default: 'none'
    },
    interval: {
      type: Number,
      default: 1
    },
    endDate: Date,
    occurrences: Number
  },
  reminders: [{
    type: String,
    enum: ['5min', '15min', '30min', '1hour', '1day', '1week']
  }],
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

eventSchema.index({ creator: 1, startDate: 1 });
eventSchema.index({ 'sharedWith.user': 1, startDate: 1 });
eventSchema.index({ startDate: 1, endDate: 1 });

eventSchema.pre('find', function() {
  this.where({ isDeleted: { $ne: true } });
});

eventSchema.pre('findOne', function() {
  this.where({ isDeleted: { $ne: true } });
});

module.exports = mongoose.model('Event', eventSchema);