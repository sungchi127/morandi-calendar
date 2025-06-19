const mongoose = require('mongoose');

const calendarShareSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sharedWith: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  permissions: {
    canViewEvents: {
      type: Boolean,
      default: true
    },
    canCreateEvents: {
      type: Boolean,
      default: false
    },
    canEditEvents: {
      type: Boolean,
      default: false
    },
    canDeleteEvents: {
      type: Boolean,
      default: false
    },
    canComment: {
      type: Boolean,
      default: true
    },
    canInviteOthers: {
      type: Boolean,
      default: false
    }
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined'],
    default: 'pending'
  },
  shareType: {
    type: String,
    enum: ['full_calendar', 'specific_events'],
    default: 'specific_events'
  },
  categories: [{
    type: String,
    enum: ['work', 'personal', 'friends', 'family', 'health', 'other']
  }],
  note: {
    type: String,
    trim: true,
    maxlength: 200
  },
  expiresAt: Date,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

calendarShareSchema.index({ owner: 1, sharedWith: 1 }, { unique: true });
calendarShareSchema.index({ sharedWith: 1, status: 1 });
calendarShareSchema.index({ owner: 1, isActive: 1 });

calendarShareSchema.pre('find', function() {
  this.where({ isActive: { $ne: false } });
});

calendarShareSchema.pre('findOne', function() {
  this.where({ isActive: { $ne: false } });
});

calendarShareSchema.statics.findSharedCalendars = function(userId) {
  return this.find({
    $or: [
      { owner: userId },
      { sharedWith: userId, status: 'accepted' }
    ]
  }).populate('owner sharedWith', 'displayName email avatar');
};

calendarShareSchema.statics.canUserAccessEvent = async function(userId, eventId) {
  const Event = mongoose.model('Event');
  const event = await Event.findById(eventId);
  
  if (!event) return false;
  
  if (event.creator.equals(userId)) return true;
  
  if (event.privacy === 'private') {
    return event.sharedWith.some(share => share.user.equals(userId));
  }
  
  const sharedCalendar = await this.findOne({
    owner: event.creator,
    sharedWith: userId,
    status: 'accepted',
    isActive: true
  });
  
  return !!sharedCalendar;
};

module.exports = mongoose.model('CalendarShare', calendarShareSchema);