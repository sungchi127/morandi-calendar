const Group = require('../models/Group');
const GroupMember = require('../models/GroupMember');
const Invitation = require('../models/Invitation');
const Notification = require('../models/Notification');
const User = require('../models/User');

// 獲取用戶的團體列表
const getUserGroups = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, role = null } = req.query;

    // 構建查詢條件
    let memberQuery = {
      user: userId,
      status: 'active'
    };

    if (role) {
      memberQuery.role = role;
    }

    // 獲取用戶的團體成員資格
    const memberships = await GroupMember.find(memberQuery)
      .populate({
        path: 'group',
        match: { isActive: true },
        populate: {
          path: 'creator',
          select: 'displayName avatar'
        }
      })
      .sort({ joinedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // 過濾掉已刪除的團體
    const validMemberships = memberships.filter(membership => membership.group);

    // 格式化回應資料
    const groups = validMemberships.map(membership => ({
      ...membership.group.toObject(),
      userRole: membership.role,
      joinedAt: membership.joinedAt,
      permissions: membership.permissions
    }));

    res.json({
      success: true,
      data: {
        groups,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: groups.length
        }
      }
    });
  } catch (error) {
    console.error('獲取用戶團體列表錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取團體列表失敗'
    });
  }
};

// 創建新團體
const createGroup = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      name,
      description,
      visibility = 'private',
      settings = {},
      tags = []
    } = req.body;

    // 驗證必填欄位
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: '團體名稱不能為空'
      });
    }

    // 創建團體
    const group = new Group({
      name: name.trim(),
      description: description?.trim(),
      visibility,
      creator: userId,
      settings: {
        allowMembersCreateEvents: true,
        requireEventApproval: false,
        allowMembersInvite: true,
        defaultEventPrivacy: 'group_only',
        ...settings
      },
      tags: tags.map(tag => tag.trim()).filter(tag => tag.length > 0)
    });

    // 如果是邀請制團體，生成邀請碼
    if (visibility === 'invite_only') {
      group.generateInviteCode();
    }

    await group.save();

    // 創建創建者的成員記錄
    await GroupMember.create({
      group: group._id,
      user: userId,
      role: 'owner',
      status: 'active',
      joinedAt: new Date(),
      permissions: {
        canCreateEvents: true,
        canEditEvents: true,
        canDeleteEvents: true,
        canInviteMembers: true,
        canRemoveMembers: true,
        canViewPrivateEvents: true
      }
    });

    // 填充創建者資訊
    await group.populate('creator', 'displayName avatar');

    res.status(201).json({
      success: true,
      data: {
        group: {
          ...group.toObject(),
          userRole: 'owner'
        }
      },
      message: '團體創建成功'
    });
  } catch (error) {
    console.error('創建團體錯誤:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: '團體名稱已存在'
      });
    }

    res.status(500).json({
      success: false,
      message: '創建團體失敗'
    });
  }
};

// 獲取團體詳情
const getGroupDetail = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    // 獲取團體資訊
    const group = await Group.findById(groupId)
      .populate('creator', 'displayName avatar');

    if (!group || !group.isActive) {
      return res.status(404).json({
        success: false,
        message: '團體不存在'
      });
    }

    // 檢查用戶是否有權限查看團體
    const membership = await GroupMember.findOne({
      group: groupId,
      user: userId,
      status: 'active'
    });

    if (group.visibility === 'private' && !membership) {
      return res.status(403).json({
        success: false,
        message: '無權限查看此團體'
      });
    }

    // 獲取團體成員列表
    const members = await GroupMember.getActiveMembers(groupId);

    // 格式化回應資料
    const groupData = {
      ...group.toObject(),
      userRole: membership ? membership.role : null,
      isMember: !!membership,
      members: members.map(member => ({
        _id: member._id,
        user: member.user,
        role: member.role,
        joinedAt: member.joinedAt,
        lastActiveAt: member.lastActiveAt
      }))
    };

    res.json({
      success: true,
      data: { group: groupData }
    });
  } catch (error) {
    console.error('獲取團體詳情錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取團體詳情失敗'
    });
  }
};

// 更新團體資訊
const updateGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;
    const { name, description, visibility, settings, tags } = req.body;

    // 獲取團體
    const group = await Group.findById(groupId);
    if (!group || !group.isActive) {
      return res.status(404).json({
        success: false,
        message: '團體不存在'
      });
    }

    // 檢查權限
    const hasPermission = await group.checkUserPermission(userId, 'edit_group');
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: '無權限編輯此團體'
      });
    }

    // 更新團體資訊
    if (name && name.trim().length > 0) {
      group.name = name.trim();
    }
    
    if (description !== undefined) {
      group.description = description?.trim();
    }
    
    if (visibility && ['public', 'private', 'invite_only'].includes(visibility)) {
      group.visibility = visibility;
      
      // 如果改為邀請制且沒有邀請碼，生成一個
      if (visibility === 'invite_only' && !group.inviteCode) {
        group.generateInviteCode();
      }
    }
    
    if (settings) {
      group.settings = { ...group.settings, ...settings };
    }
    
    if (tags) {
      group.tags = tags.map(tag => tag.trim()).filter(tag => tag.length > 0);
    }

    await group.save();

    res.json({
      success: true,
      data: { group },
      message: '團體資訊更新成功'
    });
  } catch (error) {
    console.error('更新團體錯誤:', error);
    res.status(500).json({
      success: false,
      message: '更新團體失敗'
    });
  }
};

// 刪除團體
const deleteGroup = async (req, res) => {
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

    // 檢查權限（只有創建者可以刪除團體）
    if (group.creator.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: '只有團體創建者可以刪除團體'
      });
    }

    // 軟刪除團體
    group.isActive = false;
    await group.save();

    res.json({
      success: true,
      message: '團體刪除成功'
    });
  } catch (error) {
    console.error('刪除團體錯誤:', error);
    res.status(500).json({
      success: false,
      message: '刪除團體失敗'
    });
  }
};

// 邀請成員
const inviteMembers = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;
    const { invitations } = req.body; // [{ email, userId, role, message }]

    // 驗證輸入
    if (!invitations || !Array.isArray(invitations) || invitations.length === 0) {
      return res.status(400).json({
        success: false,
        message: '邀請資料不能為空'
      });
    }

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
        message: '無權限邀請成員'
      });
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < invitations.length; i++) {
      const inv = invitations[i];
      
      try {
        // 確定邀請類型
        let inviteType = 'email';
        let targetUserId = null;

        if (inv.userId) {
          // 直接邀請用戶
          const targetUser = await User.findById(inv.userId);
          if (!targetUser) {
            errors.push({ index: i, message: '用戶不存在' });
            continue;
          }
          targetUserId = inv.userId;
          inviteType = 'direct';
        } else if (inv.email) {
          // 通過郵件邀請
          const existingUser = await User.findOne({ email: inv.email });
          if (existingUser) {
            targetUserId = existingUser._id;
            inviteType = 'direct';
          }
        }

        // 檢查是否已經是成員
        if (targetUserId) {
          const existingMember = await GroupMember.findOne({
            group: groupId,
            user: targetUserId
          });

          if (existingMember && existingMember.status === 'active') {
            errors.push({ index: i, message: '用戶已經是團體成員' });
            continue;
          }
        }

        // 創建邀請
        const invitation = await Invitation.create({
          group: groupId,
          inviter: userId,
          invitee: targetUserId,
          email: inv.email,
          type: inviteType,
          role: inv.role || 'member',
          message: inv.message || ''
        });

        // 創建通知（如果是直接邀請用戶）
        if (targetUserId && inviteType === 'direct') {
          await Notification.createGroupInvitation({
            recipient: targetUserId,
            sender: req.user,
            group,
            invitation
          });
        }

        results.push({
          invitation,
          type: inviteType,
          targetUser: targetUserId
        });

      } catch (error) {
        console.error(`邀請 ${i} 失敗:`, error);
        errors.push({ index: i, message: error.message });
      }
    }

    res.json({
      success: true,
      data: {
        sent: results.length,
        failed: errors.length,
        results,
        errors
      },
      message: `成功發送 ${results.length} 個邀請`
    });

  } catch (error) {
    console.error('邀請成員錯誤:', error);
    res.status(500).json({
      success: false,
      message: '邀請成員失敗'
    });
  }
};

// 移除成員
const removeMember = async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
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
    const hasPermission = await group.checkUserPermission(userId, 'remove_member');
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: '無權限移除成員'
      });
    }

    // 獲取要移除的成員
    const memberToRemove = await GroupMember.findOne({
      group: groupId,
      user: memberId,
      status: 'active'
    });

    if (!memberToRemove) {
      return res.status(404).json({
        success: false,
        message: '成員不存在'
      });
    }

    // 不能移除團體創建者
    if (group.creator.toString() === memberId.toString()) {
      return res.status(400).json({
        success: false,
        message: '不能移除團體創建者'
      });
    }

    // 移除成員
    memberToRemove.status = 'inactive';
    await memberToRemove.save();

    res.json({
      success: true,
      message: '成員移除成功'
    });

  } catch (error) {
    console.error('移除成員錯誤:', error);
    res.status(500).json({
      success: false,
      message: '移除成員失敗'
    });
  }
};

// 更新成員角色
const updateMemberRole = async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const { role } = req.body;
    const userId = req.user._id;

    // 驗證角色
    if (!['admin', 'member', 'viewer'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: '無效的角色'
      });
    }

    // 獲取團體
    const group = await Group.findById(groupId);
    if (!group || !group.isActive) {
      return res.status(404).json({
        success: false,
        message: '團體不存在'
      });
    }

    // 檢查權限
    const hasPermission = await group.checkUserPermission(userId, 'remove_member');
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: '無權限更改成員角色'
      });
    }

    // 獲取要更新的成員
    const member = await GroupMember.findOne({
      group: groupId,
      user: memberId,
      status: 'active'
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: '成員不存在'
      });
    }

    // 不能更改團體創建者的角色
    if (group.creator.toString() === memberId.toString()) {
      return res.status(400).json({
        success: false,
        message: '不能更改團體創建者的角色'
      });
    }

    // 更新角色和權限
    member.role = role;
    member.setPermissions({});
    await member.save();

    res.json({
      success: true,
      data: { member },
      message: '成員角色更新成功'
    });

  } catch (error) {
    console.error('更新成員角色錯誤:', error);
    res.status(500).json({
      success: false,
      message: '更新成員角色失敗'
    });
  }
};

// 離開團體
const leaveGroup = async (req, res) => {
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

    // 團體創建者不能離開團體
    if (group.creator.toString() === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: '團體創建者不能離開團體，請先轉移所有權或刪除團體'
      });
    }

    // 獲取用戶的成員資格
    const membership = await GroupMember.findOne({
      group: groupId,
      user: userId,
      status: 'active'
    });

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: '您不是此團體的成員'
      });
    }

    // 離開團體
    membership.status = 'inactive';
    await membership.save();

    res.json({
      success: true,
      message: '已成功離開團體'
    });

  } catch (error) {
    console.error('離開團體錯誤:', error);
    res.status(500).json({
      success: false,
      message: '離開團體失敗'
    });
  }
};

// 搜尋公開團體
const searchPublicGroups = async (req, res) => {
  try {
    const { query, page = 1, limit = 10 } = req.query;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: '搜尋關鍵字不能為空'
      });
    }

    const groups = await Group.searchPublicGroups(query.trim(), {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: {
        groups,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: groups.length
        }
      }
    });

  } catch (error) {
    console.error('搜尋團體錯誤:', error);
    res.status(500).json({
      success: false,
      message: '搜尋團體失敗'
    });
  }
};

module.exports = {
  getUserGroups,
  createGroup,
  getGroupDetail,
  updateGroup,
  deleteGroup,
  inviteMembers,
  removeMember,
  updateMemberRole,
  leaveGroup,
  searchPublicGroups
};