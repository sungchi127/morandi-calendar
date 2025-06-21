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
    enum: ['private', 'shared', 'public', 'group_only'],
    default: 'private'
  },
  // 團體相關欄位
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    default: null
  },
  groupEventType: {
    type: String,
    enum: ['meeting', 'deadline', 'social', 'project', 'other'],
    default: 'other'
  },
  requiresAttendance: {
    type: Boolean,
    default: false
  },
  maxAttendees: {
    type: Number,
    default: null
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'cancelled', 'completed'],
    default: 'published'
  },
  approval: {
    required: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved'
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    approvedAt: {
      type: Date,
      default: null
    },
    rejectionReason: {
      type: String,
      maxlength: 200
    }
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

// 索引優化
eventSchema.index({ creator: 1, startDate: 1 });
eventSchema.index({ 'sharedWith.user': 1, startDate: 1 });
eventSchema.index({ startDate: 1, endDate: 1 });
eventSchema.index({ group: 1, startDate: 1 });
eventSchema.index({ group: 1, status: 1 });
eventSchema.index({ privacy: 1 });
eventSchema.index({ 'approval.status': 1 });

eventSchema.pre('find', function() {
  this.where({ isDeleted: { $ne: true } });
});

eventSchema.pre('findOne', function() {
  this.where({ isDeleted: { $ne: true } });
});

// 虛擬欄位：檢查是否為團體活動
eventSchema.virtual('isGroupEvent').get(function() {
  return this.group !== null;
});

// 虛擬欄位：獲取參與人數
eventSchema.virtual('attendeeCount').get(function() {
  return this.attendees.filter(attendee => attendee.status === 'accepted').length;
});

// 實例方法：檢查用戶是否可以編輯此活動
eventSchema.methods.canUserEdit = async function(userId) {
  // 創建者可以編輯
  if (this.creator.toString() === userId.toString()) {
    return true;
  }
  
  // 如果是團體活動，檢查團體權限
  if (this.group) {
    const Group = mongoose.model('Group');
    const group = await Group.findById(this.group);
    if (group) {
      return await group.checkUserPermission(userId, 'edit_event');
    }
  }
  
  // 檢查是否有編輯權限的共享用戶
  const sharedUser = this.sharedWith.find(
    share => share.user.toString() === userId.toString()
  );
  
  return sharedUser?.permissions.canEdit || false;
};

// 實例方法：檢查用戶是否可以查看此活動
eventSchema.methods.canUserView = async function(userId) {
  // 公開活動任何人都可以查看
  if (this.privacy === 'public') {
    return true;
  }
  
  // 創建者可以查看
  if (this.creator.toString() === userId.toString()) {
    return true;
  }
  
  // 參與者可以查看
  const isAttendee = this.attendees.some(
    attendee => attendee.user.toString() === userId.toString()
  );
  if (isAttendee) {
    return true;
  }
  
  // 如果是團體活動，檢查團體成員資格
  if (this.group && this.privacy === 'group_only') {
    const GroupMember = mongoose.model('GroupMember');
    const membership = await GroupMember.findOne({
      group: this.group,
      user: userId,
      status: 'active'
    });
    return !!membership;
  }
  
  // 檢查是否有查看權限的共享用戶
  const sharedUser = this.sharedWith.find(
    share => share.user.toString() === userId.toString()
  );
  
  return sharedUser?.permissions.canView || false;
};

// 實例方法：添加參與者
eventSchema.methods.addAttendee = function(userId, status = 'pending') {
  const existingAttendee = this.attendees.find(
    attendee => attendee.user.toString() === userId.toString()
  );
  
  if (existingAttendee) {
    existingAttendee.status = status;
  } else {
    this.attendees.push({
      user: userId,
      status,
      addedAt: new Date()
    });
  }
  
  return this;
};

// 實例方法：移除參與者
eventSchema.methods.removeAttendee = function(userId) {
  this.attendees = this.attendees.filter(
    attendee => attendee.user.toString() !== userId.toString()
  );
  return this;
};

// 實例方法：檢查是否可以添加更多參與者
eventSchema.methods.canAddMoreAttendees = function() {
  if (!this.maxAttendees) return true;
  return this.attendeeCount < this.maxAttendees;
};

// 靜態方法：獲取團體的活動
eventSchema.statics.getGroupEvents = function(groupId, options = {}) {
  const {
    startDate,
    endDate,
    status = ['published'],
    includeApprovalPending = false,
    page = 1,
    limit = 50
  } = options;
  
  let query = {
    group: groupId,
    status: { $in: status }
  };
  
  if (!includeApprovalPending) {
    query['approval.status'] = { $ne: 'pending' };
  }
  
  if (startDate || endDate) {
    query.startDate = {};
    if (startDate) query.startDate.$gte = new Date(startDate);
    if (endDate) query.startDate.$lte = new Date(endDate);
  }
  
  return this.find(query)
    .populate('creator', 'displayName avatar')
    .populate('group', 'name')
    .sort({ startDate: 1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

// 靜態方法：獲取用戶可見的活動（包括團體活動）
eventSchema.statics.getUserVisibleEvents = async function(userId, options = {}) {
  const GroupMember = mongoose.model('GroupMember');
  
  // 獲取用戶所屬的團體
  const userGroups = await GroupMember.find({
    user: userId,
    status: 'active'
  }).select('group');
  
  const groupIds = userGroups.map(membership => membership.group);
  
  const {
    startDate,
    endDate,
    page = 1,
    limit = 50
  } = options;
  
  let dateQuery = {};
  if (startDate || endDate) {
    dateQuery.startDate = {};
    if (startDate) dateQuery.startDate.$gte = new Date(startDate);
    if (endDate) dateQuery.startDate.$lte = new Date(endDate);
  }
  
  const query = {
    $or: [
      // 用戶創建的活動
      { creator: userId },
      // 公開活動
      { privacy: 'public' },
      // 用戶被邀請的活動
      { 'attendees.user': userId },
      // 與用戶共享的活動
      { 'sharedWith.user': userId },
      // 用戶團體的活動
      {
        group: { $in: groupIds },
        privacy: 'group_only',
        'approval.status': 'approved'
      }
    ],
    status: { $ne: 'cancelled' },
    ...dateQuery
  };
  
  return this.find(query)
    .populate('creator', 'displayName avatar')
    .populate('group', 'name avatar')
    .sort({ startDate: 1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

module.exports = mongoose.model('Event', eventSchema);