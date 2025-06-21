const Invitation = require('../models/Invitation');
const Group = require('../models/Group');
const GroupMember = require('../models/GroupMember');
const Notification = require('../models/Notification');
const User = require('../models/User');

// 獲取用戶的邀請列表
const getUserInvitations = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status = 'pending', page = 1, limit = 10 } = req.query;

    let query = {
      $or: [
        { invitee: userId },
        { email: req.user.email }
      ]
    };

    if (status !== 'all') {
      query.status = status;
    }

    if (status === 'pending') {
      query.expiresAt = { $gt: new Date() };
    }

    const invitations = await Invitation.find(query)
      .populate([
        { path: 'group', select: 'name description avatar visibility' },
        { path: 'inviter', select: 'displayName avatar' }
      ])
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Invitation.countDocuments(query);

    res.json({
      success: true,
      data: {
        invitations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('獲取邀請列表錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取邀請列表失敗'
    });
  }
};

// 通過 token 獲取邀請詳情
const getInvitationByToken = async (req, res) => {
  try {
    const { token } = req.params;

    const invitation = await Invitation.findByToken(token);

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: '邀請不存在或已過期'
      });
    }

    res.json({
      success: true,
      data: { invitation }
    });

  } catch (error) {
    console.error('獲取邀請詳情錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取邀請詳情失敗'
    });
  }
};

// 接受邀請
const acceptInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const userId = req.user._id;

    // 獲取邀請
    const invitation = await Invitation.findById(invitationId)
      .populate('group', 'name')
      .populate('inviter', 'displayName');

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: '邀請不存在'
      });
    }

    // 檢查邀請是否屬於當前用戶
    const belongsToUser = invitation.invitee?.toString() === userId.toString() ||
                         invitation.email === req.user.email;

    if (!belongsToUser) {
      return res.status(403).json({
        success: false,
        message: '無權限處理此邀請'
      });
    }

    // 接受邀請
    await invitation.accept(userId);

    // 創建通知給邀請者
    await Notification.create({
      recipient: invitation.inviter,
      sender: userId,
      type: 'group_member_added',
      title: `新成員加入：${invitation.group.name}`,
      message: `${req.user.displayName} 接受了您的邀請，加入了團體「${invitation.group.name}」`,
      data: {
        groupId: invitation.group._id
      }
    });

    res.json({
      success: true,
      message: `已成功加入團體「${invitation.group.name}」`
    });

  } catch (error) {
    console.error('接受邀請錯誤:', error);
    
    if (error.message.includes('已經是團體成員')) {
      return res.status(400).json({
        success: false,
        message: '您已經是該團體的成員'
      });
    }

    res.status(500).json({
      success: false,
      message: '接受邀請失敗'
    });
  }
};

// 拒絕邀請
const declineInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const userId = req.user._id;

    // 獲取邀請
    const invitation = await Invitation.findById(invitationId)
      .populate('group', 'name')
      .populate('inviter', 'displayName');

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: '邀請不存在'
      });
    }

    // 檢查邀請是否屬於當前用戶
    const belongsToUser = invitation.invitee?.toString() === userId.toString() ||
                         invitation.email === req.user.email;

    if (!belongsToUser) {
      return res.status(403).json({
        success: false,
        message: '無權限處理此邀請'
      });
    }

    // 拒絕邀請
    await invitation.decline();

    // 創建通知給邀請者
    await Notification.create({
      recipient: invitation.inviter,
      sender: userId,
      type: 'group_invitation',
      title: `邀請被拒絕：${invitation.group.name}`,
      message: `${req.user.displayName} 拒絕了加入團體「${invitation.group.name}」的邀請`,
      data: {
        groupId: invitation.group._id
      }
    });

    res.json({
      success: true,
      message: '已拒絕邀請'
    });

  } catch (error) {
    console.error('拒絕邀請錯誤:', error);
    res.status(500).json({
      success: false,
      message: '拒絕邀請失敗'
    });
  }
};

// 通過 token 接受邀請（公開連結）
const acceptInvitationByToken = async (req, res) => {
  try {
    const { token } = req.params;
    const userId = req.user._id;

    // 獲取邀請
    const invitation = await Invitation.findByToken(token);

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: '邀請不存在或已過期'
      });
    }

    // 檢查用戶是否已經是團體成員
    const existingMember = await GroupMember.findOne({
      group: invitation.group._id,
      user: userId
    });

    if (existingMember && existingMember.status === 'active') {
      return res.status(400).json({
        success: false,
        message: '您已經是該團體的成員'
      });
    }

    // 接受邀請
    await invitation.accept(userId);

    res.json({
      success: true,
      message: `已成功加入團體「${invitation.group.name}」`,
      data: {
        group: invitation.group
      }
    });

  } catch (error) {
    console.error('通過 token 接受邀請錯誤:', error);
    res.status(500).json({
      success: false,
      message: '加入團體失敗'
    });
  }
};

// 通過邀請碼加入團體
const joinByInviteCode = async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const userId = req.user._id;

    if (!inviteCode || inviteCode.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: '邀請碼不能為空'
      });
    }

    // 查找團體
    const group = await Group.findOne({
      inviteCode: inviteCode.trim().toUpperCase(),
      isActive: true
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: '無效的邀請碼'
      });
    }

    // 檢查用戶是否已經是團體成員
    const existingMember = await GroupMember.findOne({
      group: group._id,
      user: userId
    });

    if (existingMember && existingMember.status === 'active') {
      return res.status(400).json({
        success: false,
        message: '您已經是該團體的成員'
      });
    }

    // 創建或重新激活成員資格
    if (existingMember) {
      existingMember.status = 'active';
      existingMember.role = 'member';
      existingMember.joinedAt = new Date();
      await existingMember.save();
    } else {
      await GroupMember.create({
        group: group._id,
        user: userId,
        role: 'member',
        status: 'active',
        joinedAt: new Date()
      });
    }

    // 創建邀請記錄（用於追蹤）
    await Invitation.create({
      group: group._id,
      inviter: group.creator,
      invitee: userId,
      type: 'invite_code',
      status: 'accepted',
      role: 'member',
      respondedAt: new Date(),
      metadata: {
        inviteCode: inviteCode.trim().toUpperCase()
      }
    });

    // 通知團體創建者
    await Notification.create({
      recipient: group.creator,
      sender: userId,
      type: 'group_member_added',
      title: `新成員加入：${group.name}`,
      message: `${req.user.displayName} 通過邀請碼加入了團體「${group.name}」`,
      data: {
        groupId: group._id
      }
    });

    res.json({
      success: true,
      message: `已成功加入團體「${group.name}」`,
      data: {
        group: {
          _id: group._id,
          name: group.name,
          description: group.description,
          avatar: group.avatar
        }
      }
    });

  } catch (error) {
    console.error('通過邀請碼加入團體錯誤:', error);
    res.status(500).json({
      success: false,
      message: '加入團體失敗'
    });
  }
};

// 取消邀請
const cancelInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const userId = req.user._id;

    // 獲取邀請
    const invitation = await Invitation.findById(invitationId);

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: '邀請不存在'
      });
    }

    // 檢查是否為邀請發起者
    if (invitation.inviter.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: '只有邀請發起者可以取消邀請'
      });
    }

    // 取消邀請
    await invitation.cancel();

    res.json({
      success: true,
      message: '邀請已取消'
    });

  } catch (error) {
    console.error('取消邀請錯誤:', error);
    res.status(500).json({
      success: false,
      message: '取消邀請失敗'
    });
  }
};

// 重新發送邀請
const resendInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const userId = req.user._id;

    // 獲取邀請
    const invitation = await Invitation.findById(invitationId)
      .populate('group', 'name')
      .populate('invitee', 'displayName email');

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: '邀請不存在'
      });
    }

    // 檢查是否為邀請發起者
    if (invitation.inviter.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: '只有邀請發起者可以重新發送邀請'
      });
    }

    // 檢查邀請狀態
    if (invitation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: '只能重新發送待處理的邀請'
      });
    }

    // 更新邀請過期時間
    invitation.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await invitation.save();

    // 如果是直接邀請用戶，重新發送通知
    if (invitation.invitee) {
      await Notification.createGroupInvitation({
        recipient: invitation.invitee._id,
        sender: req.user,
        group: invitation.group,
        invitation
      });
    }

    res.json({
      success: true,
      message: '邀請已重新發送'
    });

  } catch (error) {
    console.error('重新發送邀請錯誤:', error);
    res.status(500).json({
      success: false,
      message: '重新發送邀請失敗'
    });
  }
};

// 生成新的邀請碼
const generateNewInviteCode = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    // 獲取團體
    const group = await Group.findById(groupId);
    if (!group || !group.isActive) {
      return res.status(404).json({
        success: false,
        message: '團體不存在'
      });
    }

    // 檢查權限
    const hasPermission = await group.checkUserPermission(userId, 'invite_member');
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: '無權限生成邀請碼'
      });
    }

    // 生成新的邀請碼
    group.generateInviteCode();
    await group.save();

    res.json({
      success: true,
      data: {
        inviteCode: group.inviteCode
      },
      message: '新邀請碼生成成功'
    });

  } catch (error) {
    console.error('生成邀請碼錯誤:', error);
    res.status(500).json({
      success: false,
      message: '生成邀請碼失敗'
    });
  }
};

module.exports = {
  getUserInvitations,
  getInvitationByToken,
  acceptInvitation,
  declineInvitation,
  acceptInvitationByToken,
  joinByInviteCode,
  cancelInvitation,
  resendInvitation,
  generateNewInviteCode
};