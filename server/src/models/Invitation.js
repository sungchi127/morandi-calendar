const mongoose = require('mongoose');

const invitationSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  inviter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  invitee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // 可以為空，代表通過邀請碼邀請
  },
  email: {
    type: String,
    lowercase: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['direct', 'email', 'invite_code'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'expired', 'cancelled'],
    default: 'pending'
  },
  role: {
    type: String,
    enum: ['admin', 'member', 'viewer'],
    default: 'member'
  },
  message: {
    type: String,
    maxLength: 200
  },
  token: {
    type: String,
    sparse: true // unique 通過手動索引設置
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7天後過期
  },
  respondedAt: {
    type: Date,
    default: null
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    inviteCode: String // 如果是通過邀請碼加入
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 索引
invitationSchema.index({ group: 1, status: 1 });
invitationSchema.index({ invitee: 1, status: 1 });
invitationSchema.index({ email: 1, status: 1 });
invitationSchema.index({ token: 1 }, { unique: true, sparse: true });
invitationSchema.index({ expiresAt: 1 });

// 虛擬欄位：檢查是否已過期
invitationSchema.virtual('isExpired').get(function() {
  return this.expiresAt < new Date();
});

// 虛擬欄位：檢查是否可以回應
invitationSchema.virtual('canRespond').get(function() {
  return this.status === 'pending' && !this.isExpired;
});

// 中間件：生成邀請 token
invitationSchema.pre('save', function(next) {
  if (this.isNew && !this.token) {
    this.token = require('crypto').randomBytes(32).toString('hex');
  }
  next();
});

// 中間件：自動清理過期邀請
invitationSchema.pre('save', function(next) {
  if (this.isExpired && this.status === 'pending') {
    this.status = 'expired';
  }
  next();
});

// 實例方法：接受邀請
invitationSchema.methods.accept = async function(userId = null) {
  if (!this.canRespond) {
    throw new Error('邀請已過期或無法回應');
  }
  
  const GroupMember = mongoose.model('GroupMember');
  const User = mongoose.model('User');
  
  // 確定被邀請的用戶
  let inviteeId = this.invitee || userId;
  
  if (!inviteeId && this.email) {
    // 通過郵件邀請，查找對應用戶
    const user = await User.findOne({ email: this.email });
    if (!user) {
      throw new Error('找不到對應的用戶帳戶');
    }
    inviteeId = user._id;
  }
  
  if (!inviteeId) {
    throw new Error('無法確定被邀請的用戶');
  }
  
  // 檢查是否已經是成員
  const existingMember = await GroupMember.findOne({
    group: this.group,
    user: inviteeId
  });
  
  if (existingMember) {
    if (existingMember.status === 'active') {
      throw new Error('用戶已經是團體成員');
    } else {
      // 重新激活成員資格
      existingMember.status = 'active';
      existingMember.role = this.role;
      existingMember.joinedAt = new Date();
      await existingMember.save();
    }
  } else {
    // 創建新的成員記錄
    await GroupMember.create({
      group: this.group,
      user: inviteeId,
      role: this.role,
      status: 'active',
      joinedAt: new Date(),
      invitedBy: this.inviter
    });
  }
  
  // 更新邀請狀態
  this.status = 'accepted';
  this.respondedAt = new Date();
  await this.save();
  
  return this;
};

// 實例方法：拒絕邀請
invitationSchema.methods.decline = async function() {
  if (!this.canRespond) {
    throw new Error('邀請已過期或無法回應');
  }
  
  this.status = 'declined';
  this.respondedAt = new Date();
  await this.save();
  
  return this;
};

// 實例方法：取消邀請
invitationSchema.methods.cancel = async function() {
  if (this.status !== 'pending') {
    throw new Error('只能取消待處理的邀請');
  }
  
  this.status = 'cancelled';
  await this.save();
  
  return this;
};

// 靜態方法：通過 token 查找邀請
invitationSchema.statics.findByToken = function(token) {
  return this.findOne({ 
    token, 
    status: 'pending',
    expiresAt: { $gt: new Date() }
  }).populate([
    { path: 'group', select: 'name description avatar' },
    { path: 'inviter', select: 'displayName avatar' }
  ]);
};

// 靜態方法：獲取用戶的待處理邀請
invitationSchema.statics.getPendingInvitations = function(userId) {
  return this.find({
    $or: [
      { invitee: userId },
      { email: userId } // 如果 userId 是郵件地址
    ],
    status: 'pending',
    expiresAt: { $gt: new Date() }
  }).populate([
    { path: 'group', select: 'name description avatar' },
    { path: 'inviter', select: 'displayName avatar' }
  ]).sort({ createdAt: -1 });
};

// 靜態方法：清理過期邀請
invitationSchema.statics.cleanupExpired = async function() {
  const result = await this.updateMany(
    { 
      status: 'pending',
      expiresAt: { $lt: new Date() }
    },
    { 
      status: 'expired' 
    }
  );
  
  return result.modifiedCount;
};

// 靜態方法：批次邀請
invitationSchema.statics.batchInvite = async function(groupId, inviterId, invitations) {
  const docs = invitations.map(inv => ({
    group: groupId,
    inviter: inviterId,
    invitee: inv.userId || null,
    email: inv.email || null,
    type: inv.type,
    role: inv.role || 'member',
    message: inv.message || ''
  }));
  
  return await this.insertMany(docs);
};

module.exports = mongoose.model('Invitation', invitationSchema);