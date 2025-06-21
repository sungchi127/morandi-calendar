const mongoose = require('mongoose');

const groupMemberSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['owner', 'admin', 'member', 'viewer'],
    default: 'member'
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'inactive', 'banned'],
    default: 'pending'
  },
  joinedAt: {
    type: Date,
    default: null
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  permissions: {
    canCreateEvents: {
      type: Boolean,
      default: true
    },
    canEditEvents: {
      type: Boolean,
      default: false
    },
    canDeleteEvents: {
      type: Boolean,
      default: false
    },
    canInviteMembers: {
      type: Boolean,
      default: false
    },
    canRemoveMembers: {
      type: Boolean,
      default: false
    },
    canViewPrivateEvents: {
      type: Boolean,
      default: true
    }
  },
  preferences: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    pushNotifications: {
      type: Boolean,
      default: true
    },
    eventReminders: {
      type: Boolean,
      default: true
    }
  },
  lastActiveAt: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    maxLength: 200
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 複合索引：確保用戶在同一團體中只能有一個記錄
groupMemberSchema.index({ group: 1, user: 1 }, { unique: true });

// 其他索引
groupMemberSchema.index({ group: 1, status: 1 });
groupMemberSchema.index({ user: 1, status: 1 });
groupMemberSchema.index({ role: 1 });

// 虛擬欄位：檢查是否為管理員
groupMemberSchema.virtual('isAdmin').get(function() {
  return ['owner', 'admin'].includes(this.role);
});

// 虛擬欄位：檢查是否活躍
groupMemberSchema.virtual('isActive').get(function() {
  return this.status === 'active';
});

// 中間件：當狀態變為 active 時設定 joinedAt
groupMemberSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'active' && !this.joinedAt) {
    this.joinedAt = new Date();
  }
  next();
});

// 中間件：更新團體成員數量
groupMemberSchema.post('save', async function(doc) {
  if (doc.status === 'active') {
    const Group = mongoose.model('Group');
    const activeCount = await mongoose.model('GroupMember').countDocuments({
      group: doc.group,
      status: 'active'
    });
    
    await Group.findByIdAndUpdate(doc.group, {
      'statistics.memberCount': activeCount
    });
  }
});

groupMemberSchema.post('deleteOne', { document: true, query: false }, async function(doc) {
  const Group = mongoose.model('Group');
  const activeCount = await mongoose.model('GroupMember').countDocuments({
    group: doc.group,
    status: 'active'
  });
  
  await Group.findByIdAndUpdate(doc.group, {
    'statistics.memberCount': activeCount
  });
});

// 實例方法：設定權限
groupMemberSchema.methods.setPermissions = function(permissions) {
  const rolePermissions = {
    owner: {
      canCreateEvents: true,
      canEditEvents: true,
      canDeleteEvents: true,
      canInviteMembers: true,
      canRemoveMembers: true,
      canViewPrivateEvents: true
    },
    admin: {
      canCreateEvents: true,
      canEditEvents: true,
      canDeleteEvents: true,
      canInviteMembers: true,
      canRemoveMembers: true,
      canViewPrivateEvents: true
    },
    member: {
      canCreateEvents: true,
      canEditEvents: false,
      canDeleteEvents: false,
      canInviteMembers: false,
      canRemoveMembers: false,
      canViewPrivateEvents: true
    },
    viewer: {
      canCreateEvents: false,
      canEditEvents: false,
      canDeleteEvents: false,
      canInviteMembers: false,
      canRemoveMembers: false,
      canViewPrivateEvents: false
    }
  };
  
  this.permissions = { ...rolePermissions[this.role], ...permissions };
  return this;
};

// 實例方法：檢查特定權限
groupMemberSchema.methods.hasPermission = function(permission) {
  return this.permissions[permission] === true;
};

// 實例方法：更新最後活躍時間
groupMemberSchema.methods.updateLastActive = function() {
  this.lastActiveAt = new Date();
  return this.save();
};

// 靜態方法：獲取團體的活躍成員
groupMemberSchema.statics.getActiveMembers = function(groupId, populate = true) {
  let query = this.find({ 
    group: groupId, 
    status: 'active' 
  }).sort({ role: 1, joinedAt: 1 });
  
  if (populate) {
    query = query.populate('user', 'displayName email avatar lastLoginAt');
  }
  
  return query;
};

// 靜態方法：檢查用戶在團體中的角色
groupMemberSchema.statics.getUserRole = async function(groupId, userId) {
  const membership = await this.findOne({
    group: groupId,
    user: userId,
    status: 'active'
  });
  
  return membership ? membership.role : null;
};

// 靜態方法：批次邀請用戶
groupMemberSchema.statics.batchInvite = async function(groupId, userIds, invitedBy, role = 'member') {
  const invitations = userIds.map(userId => ({
    group: groupId,
    user: userId,
    role,
    status: 'pending',
    invitedBy
  }));
  
  try {
    return await this.insertMany(invitations, { ordered: false });
  } catch (error) {
    // 處理重複邀請的情況
    if (error.code === 11000) {
      throw new Error('部分用戶已經是團體成員');
    }
    throw error;
  }
};

module.exports = mongoose.model('GroupMember', groupMemberSchema);