const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'group_invitation',
      'group_join_request',
      'group_member_added',
      'group_member_removed',
      'group_role_changed',
      'event_invitation',
      'event_updated',
      'event_cancelled',
      'event_reminder',
      'event_approval_required',
      'event_approved',
      'event_rejected',
      'comment_added',
      'mention'
    ],
    required: true
  },
  title: {
    type: String,
    required: true,
    maxLength: 100
  },
  message: {
    type: String,
    required: true,
    maxLength: 500
  },
  data: {
    groupId: mongoose.Schema.Types.ObjectId,
    eventId: mongoose.Schema.Types.ObjectId,
    invitationId: mongoose.Schema.Types.ObjectId,
    commentId: mongoose.Schema.Types.ObjectId,
    actionUrl: String,
    metadata: mongoose.Schema.Types.Mixed
  },
  status: {
    type: String,
    enum: ['unread', 'read', 'archived'],
    default: 'unread'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  readAt: {
    type: Date,
    default: null
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30天後過期
  },
  channels: {
    inApp: {
      type: Boolean,
      default: true
    },
    email: {
      type: Boolean,
      default: false
    },
    push: {
      type: Boolean,
      default: false
    }
  },
  emailSent: {
    type: Boolean,
    default: false
  },
  pushSent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 索引
notificationSchema.index({ recipient: 1, status: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1 });
notificationSchema.index({ expiresAt: 1 });
notificationSchema.index({ 'data.groupId': 1 });
notificationSchema.index({ 'data.eventId': 1 });

// 虛擬欄位：檢查是否已過期
notificationSchema.virtual('isExpired').get(function() {
  return this.expiresAt < new Date();
});

// 虛擬欄位：檢查是否為新通知（24小時內）
notificationSchema.virtual('isNew').get(function() {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return this.createdAt > oneDayAgo;
});

// 中間件：自動清理過期通知
notificationSchema.pre('save', function(next) {
  if (this.isExpired && this.status !== 'archived') {
    this.status = 'archived';
  }
  next();
});

// 實例方法：標記為已讀
notificationSchema.methods.markAsRead = function() {
  if (this.status === 'unread') {
    this.status = 'read';
    this.readAt = new Date();
  }
  return this.save();
};

// 實例方法：歸檔通知
notificationSchema.methods.archive = function() {
  this.status = 'archived';
  return this.save();
};

// 靜態方法：創建團體邀請通知
notificationSchema.statics.createGroupInvitation = async function(data) {
  const { recipient, sender, group, invitation } = data;
  
  return await this.create({
    recipient,
    sender,
    type: 'group_invitation',
    title: `邀請加入團體：${group.name}`,
    message: `${sender.displayName} 邀請您加入團體「${group.name}」`,
    data: {
      groupId: group._id,
      invitationId: invitation._id,
      actionUrl: `/invitations/${invitation.token}`
    },
    channels: {
      inApp: true,
      email: true,
      push: true
    }
  });
};

// 靜態方法：創建活動邀請通知
notificationSchema.statics.createEventInvitation = async function(data) {
  const { recipient, sender, event } = data;
  
  return await this.create({
    recipient,
    sender,
    type: 'event_invitation',
    title: `活動邀請：${event.title}`,
    message: `${sender.displayName} 邀請您參加活動「${event.title}」`,
    data: {
      eventId: event._id,
      groupId: event.group,
      actionUrl: `/events/${event._id}`
    },
    channels: {
      inApp: true,
      email: true,
      push: true
    }
  });
};

// 靜態方法：創建活動更新通知
notificationSchema.statics.createEventUpdate = async function(data) {
  const { recipients, sender, event, updateType } = data;
  
  const notifications = recipients.map(recipient => ({
    recipient,
    sender,
    type: 'event_updated',
    title: `活動更新：${event.title}`,
    message: `${sender.displayName} 更新了活動「${event.title}」的${updateType}`,
    data: {
      eventId: event._id,
      groupId: event.group,
      actionUrl: `/events/${event._id}`,
      metadata: { updateType }
    },
    channels: {
      inApp: true,
      email: false,
      push: true
    }
  }));
  
  return await this.insertMany(notifications);
};

// 靜態方法：創建活動提醒通知
notificationSchema.statics.createEventReminder = async function(data) {
  const { recipients, event, reminderTime } = data;
  
  const notifications = recipients.map(recipient => ({
    recipient,
    sender: event.creator,
    type: 'event_reminder',
    title: `活動提醒：${event.title}`,
    message: `您的活動「${event.title}」將在${reminderTime}後開始`,
    data: {
      eventId: event._id,
      groupId: event.group,
      actionUrl: `/events/${event._id}`,
      metadata: { reminderTime }
    },
    priority: 'high',
    channels: {
      inApp: true,
      email: true,
      push: true
    }
  }));
  
  return await this.insertMany(notifications);
};

// 靜態方法：獲取用戶通知
notificationSchema.statics.getUserNotifications = function(userId, options = {}) {
  const {
    status = ['unread', 'read'],
    types = null,
    page = 1,
    limit = 20,
    includeExpired = false
  } = options;
  
  let query = {
    recipient: userId,
    status: { $in: status }
  };
  
  if (types && types.length > 0) {
    query.type = { $in: types };
  }
  
  if (!includeExpired) {
    query.expiresAt = { $gt: new Date() };
  }
  
  return this.find(query)
    .populate('sender', 'displayName avatar')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

// 靜態方法：獲取未讀通知數量
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    recipient: userId,
    status: 'unread',
    expiresAt: { $gt: new Date() }
  });
};

// 靜態方法：批次標記為已讀
notificationSchema.statics.markAllAsRead = async function(userId, notificationIds = null) {
  let query = {
    recipient: userId,
    status: 'unread'
  };
  
  if (notificationIds && notificationIds.length > 0) {
    query._id = { $in: notificationIds };
  }
  
  const result = await this.updateMany(query, {
    status: 'read',
    readAt: new Date()
  });
  
  return result.modifiedCount;
};

// 靜態方法：清理過期通知
notificationSchema.statics.cleanupExpired = async function() {
  const result = await this.deleteMany({
    expiresAt: { $lt: new Date() },
    status: 'archived'
  });
  
  return result.deletedCount;
};

module.exports = mongoose.model('Notification', notificationSchema);