const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxLength: 100
  },
  description: {
    type: String,
    maxLength: 500
  },
  avatar: {
    type: String, // 圖片 URL 或路徑
    default: null
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'invite_only'],
    default: 'private'
  },
  inviteCode: {
    type: String,
    sparse: true // 只對非 null 值建立唯一索引，通過手動索引設置 unique
  },
  settings: {
    allowMembersCreateEvents: {
      type: Boolean,
      default: true
    },
    requireEventApproval: {
      type: Boolean,
      default: false
    },
    allowMembersInvite: {
      type: Boolean,
      default: true
    },
    defaultEventPrivacy: {
      type: String,
      enum: ['public', 'private', 'group_only'],
      default: 'group_only'
    }
  },
  statistics: {
    memberCount: {
      type: Number,
      default: 0
    },
    eventCount: {
      type: Number,
      default: 0
    }
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 虛擬欄位：獲取成員列表
groupSchema.virtual('members', {
  ref: 'GroupMember',
  localField: '_id',
  foreignField: 'group'
});

// 虛擬欄位：獲取活動列表
groupSchema.virtual('events', {
  ref: 'Event',
  localField: '_id',
  foreignField: 'group'
});

// 索引優化
groupSchema.index({ creator: 1 });
groupSchema.index({ visibility: 1 });
groupSchema.index({ inviteCode: 1 }, { unique: true, sparse: true });
groupSchema.index({ name: 'text', description: 'text' });

// 中間件：刪除團體時清理相關資料
groupSchema.pre('deleteOne', { document: true, query: false }, async function() {
  const GroupMember = mongoose.model('GroupMember');
  const Event = mongoose.model('Event');
  const Invitation = mongoose.model('Invitation');
  
  await GroupMember.deleteMany({ group: this._id });
  await Event.deleteMany({ group: this._id });
  await Invitation.deleteMany({ group: this._id });
});

// 實例方法：生成邀請碼
groupSchema.methods.generateInviteCode = function() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  this.inviteCode = result;
  return result;
};

// 實例方法：檢查用戶權限
groupSchema.methods.checkUserPermission = async function(userId, action) {
  const GroupMember = mongoose.model('GroupMember');
  
  // 檢查是否為創建者
  if (this.creator.toString() === userId.toString()) {
    return true;
  }
  
  // 檢查成員權限
  const membership = await GroupMember.findOne({
    group: this._id,
    user: userId,
    status: 'active'
  });
  
  if (!membership) return false;
  
  const permissions = {
    'view': ['owner', 'admin', 'member', 'viewer'],
    'create_event': ['owner', 'admin', 'member'],
    'edit_event': ['owner', 'admin'],
    'delete_event': ['owner', 'admin'],
    'invite_member': ['owner', 'admin'],
    'remove_member': ['owner', 'admin'],
    'edit_group': ['owner', 'admin'],
    'delete_group': ['owner']
  };
  
  return permissions[action]?.includes(membership.role) || false;
};

// 靜態方法：搜尋公開團體
groupSchema.statics.searchPublicGroups = function(query, options = {}) {
  const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = -1 } = options;
  
  return this.find({
    visibility: 'public',
    isActive: true,
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { tags: { $in: [new RegExp(query, 'i')] } }
    ]
  })
  .populate('creator', 'displayName avatar')
  .sort({ [sortBy]: sortOrder })
  .skip((page - 1) * limit)
  .limit(limit);
};

module.exports = mongoose.model('Group', groupSchema);