const Event = require('../models/Event');
const Group = require('../models/Group');
const GroupMember = require('../models/GroupMember');
const Notification = require('../models/Notification');
const Joi = require('joi');

// 團體活動 schema
const groupEventSchema = Joi.object({
  title: Joi.string().trim().min(1).max(100).required(),
  description: Joi.string().max(1000).allow(''),
  startDate: Joi.date().required(),
  endDate: Joi.date().min(Joi.ref('startDate')).required(),
  isAllDay: Joi.boolean().default(false),
  color: Joi.string().valid(
    'morandi-sage', 'morandi-rose', 'morandi-lavender',
    'morandi-peach', 'morandi-blue', 'morandi-cream', 'morandi-grey'
  ).default('morandi-sage'),
  location: Joi.string().max(200).allow(''),
  groupEventType: Joi.string().valid('meeting', 'deadline', 'social', 'project', 'other').default('other'),
  requiresAttendance: Joi.boolean().default(false),
  maxAttendees: Joi.number().integer().min(1).allow(null).optional(),
  reminders: Joi.array().items(
    Joi.string().valid('5min', '15min', '30min', '1hour', '1day', '1week')
  ).default([]),
  recurrence: Joi.object({
    type: Joi.string().valid('none', 'daily', 'weekly', 'monthly', 'yearly').default('none'),
    interval: Joi.number().integer().min(1).max(999).default(1),
    endDate: Joi.date().allow(null).optional(),
    occurrences: Joi.number().integer().min(1).max(999).allow(null).optional()
  }).default({ type: 'none', interval: 1 }).optional()
});

// 創建團體活動
const createGroupEvent = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    // 驗證輸入
    const { error, value } = groupEventSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
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

    // 檢查用戶是否有權限創建活動
    const hasPermission = await group.checkUserPermission(userId, 'create_event');
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: '無權限在此團體創建活動'
      });
    }

    // 檢查是否需要審核
    const requiresApproval = group.settings.requireEventApproval;
    
    // 創建活動
    const event = new Event({
      ...value,
      group: groupId,
      creator: userId,
      privacy: 'group_only',
      category: 'other',
      status: 'published',
      approval: {
        required: requiresApproval,
        status: requiresApproval ? 'pending' : 'approved',
        approvedBy: requiresApproval ? null : userId,
        approvedAt: requiresApproval ? null : new Date()
      }
    });

    await event.save();
    await event.populate([
      { path: 'creator', select: 'displayName avatar' },
      { path: 'group', select: 'name' }
    ]);

    // 如果需要審核，通知團體管理員
    if (requiresApproval) {
      const admins = await GroupMember.find({
        group: groupId,
        role: { $in: ['owner', 'admin'] },
        status: 'active'
      }).select('user');

      for (const admin of admins) {
        if (admin.user.toString() !== userId.toString()) {
          await Notification.create({
            recipient: admin.user,
            sender: userId,
            type: 'event_approval_required',
            title: `活動審核：${event.title}`,
            message: `${req.user.displayName} 在團體「${group.name}」中創建了需要審核的活動`,
            data: {
              eventId: event._id,
              groupId: groupId
            }
          });
        }
      }
    } else {
      // 自動通知團體成員
      await notifyGroupMembers(groupId, userId, event, 'event_created');
    }

    res.status(201).json({
      success: true,
      data: { event },
      message: requiresApproval ? '活動已創建，等待審核' : '團體活動創建成功'
    });

  } catch (error) {
    console.error('創建團體活動錯誤:', error);
    res.status(500).json({
      success: false,
      message: '創建團體活動失敗'
    });
  }
};

// 獲取團體活動列表
const getGroupEvents = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;
    const {
      startDate,
      endDate,
      status = ['published'],
      includeApprovalPending = false,
      page = 1,
      limit = 50
    } = req.query;

    // 獲取團體
    const group = await Group.findById(groupId);
    if (!group || !group.isActive) {
      return res.status(404).json({
        success: false,
        message: '團體不存在'
      });
    }

    // 檢查用戶是否為團體成員
    const membership = await GroupMember.findOne({
      group: groupId,
      user: userId,
      status: 'active'
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: '您不是此團體的成員'
      });
    }

    // 檢查是否可以查看待審核的活動
    const canViewPending = ['owner', 'admin'].includes(membership.role);
    const includesPending = includeApprovalPending === 'true' && canViewPending;

    const options = {
      startDate,
      endDate,
      status: Array.isArray(status) ? status : [status],
      includeApprovalPending: includesPending,
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const events = await Event.getGroupEvents(groupId, options);
    const total = await Event.countDocuments({
      group: groupId,
      status: { $in: options.status }
    });

    res.json({
      success: true,
      data: {
        events,
        group: {
          _id: group._id,
          name: group.name,
          userRole: membership.role
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('獲取團體活動錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取團體活動失敗'
    });
  }
};

// 審核團體活動
const approveGroupEvent = async (req, res) => {
  try {
    const { groupId, eventId } = req.params;
    const { action, rejectionReason } = req.body; // action: 'approve' | 'reject'
    const userId = req.user._id;

    // 驗證動作
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: '無效的審核動作'
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
    const hasPermission = await group.checkUserPermission(userId, 'edit_event');
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: '無權限審核活動'
      });
    }

    // 獲取活動
    const event = await Event.findOne({
      _id: eventId,
      group: groupId
    }).populate('creator', 'displayName');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: '活動不存在'
      });
    }

    // 檢查活動是否需要審核
    if (!event.approval.required || event.approval.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: '此活動不需要審核或已經審核過'
      });
    }

    // 更新審核狀態
    if (action === 'approve') {
      event.approval.status = 'approved';
      event.approval.approvedBy = userId;
      event.approval.approvedAt = new Date();
      
      // 通知創建者
      await Notification.create({
        recipient: event.creator._id,
        sender: userId,
        type: 'event_approved',
        title: `活動已批准：${event.title}`,
        message: `您在團體「${group.name}」中的活動已獲得批准`,
        data: {
          eventId: event._id,
          groupId: groupId
        }
      });

      // 通知團體成員
      await notifyGroupMembers(groupId, userId, event, 'event_published');

    } else {
      event.approval.status = 'rejected';
      event.approval.rejectionReason = rejectionReason || '未提供原因';
      event.status = 'cancelled';

      // 通知創建者
      await Notification.create({
        recipient: event.creator._id,
        sender: userId,
        type: 'event_rejected',
        title: `活動被拒絕：${event.title}`,
        message: `您在團體「${group.name}」中的活動被拒絕。原因：${rejectionReason || '未提供原因'}`,
        data: {
          eventId: event._id,
          groupId: groupId
        }
      });
    }

    await event.save();

    res.json({
      success: true,
      data: { event },
      message: action === 'approve' ? '活動已批准' : '活動已拒絕'
    });

  } catch (error) {
    console.error('審核團體活動錯誤:', error);
    res.status(500).json({
      success: false,
      message: '審核活動失敗'
    });
  }
};

// 加入團體活動
const joinGroupEvent = async (req, res) => {
  try {
    const { groupId, eventId } = req.params;
    const userId = req.user._id;

    // 獲取活動
    const event = await Event.findOne({
      _id: eventId,
      group: groupId
    }).populate('group', 'name');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: '活動不存在'
      });
    }

    // 檢查用戶是否可以查看此活動
    const canView = await event.canUserView(userId);
    if (!canView) {
      return res.status(403).json({
        success: false,
        message: '無權限查看此活動'
      });
    }

    // 檢查是否已經參加
    const isAlreadyAttendee = event.attendees.some(
      attendee => attendee.user.toString() === userId.toString()
    );

    if (isAlreadyAttendee) {
      return res.status(400).json({
        success: false,
        message: '您已經參加了此活動'
      });
    }

    // 檢查人數限制
    if (!event.canAddMoreAttendees()) {
      return res.status(400).json({
        success: false,
        message: '活動人數已滿'
      });
    }

    // 添加參與者
    event.addAttendee(userId, 'accepted');
    await event.save();

    // 通知活動創建者
    if (event.creator.toString() !== userId.toString()) {
      await Notification.create({
        recipient: event.creator,
        sender: userId,
        type: 'event_invitation',
        title: `新參與者：${event.title}`,
        message: `${req.user.displayName} 加入了活動「${event.title}」`,
        data: {
          eventId: event._id,
          groupId: groupId
        }
      });
    }

    res.json({
      success: true,
      message: '已成功加入活動'
    });

  } catch (error) {
    console.error('加入團體活動錯誤:', error);
    res.status(500).json({
      success: false,
      message: '加入活動失敗'
    });
  }
};

// 離開團體活動
const leaveGroupEvent = async (req, res) => {
  try {
    const { groupId, eventId } = req.params;
    const userId = req.user._id;

    // 獲取活動
    const event = await Event.findOne({
      _id: eventId,
      group: groupId
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: '活動不存在'
      });
    }

    // 檢查是否為參與者
    const isAttendee = event.attendees.some(
      attendee => attendee.user.toString() === userId.toString()
    );

    if (!isAttendee) {
      return res.status(400).json({
        success: false,
        message: '您沒有參加此活動'
      });
    }

    // 移除參與者
    event.removeAttendee(userId);
    await event.save();

    res.json({
      success: true,
      message: '已離開活動'
    });

  } catch (error) {
    console.error('離開團體活動錯誤:', error);
    res.status(500).json({
      success: false,
      message: '離開活動失敗'
    });
  }
};

// 輔助函數：通知團體成員
const notifyGroupMembers = async (groupId, senderId, event, notificationType) => {
  try {
    const members = await GroupMember.find({
      group: groupId,
      status: 'active',
      user: { $ne: senderId } // 排除發送者
    }).select('user');

    const notifications = members.map(member => ({
      recipient: member.user,
      sender: senderId,
      type: notificationType,
      title: `團體活動：${event.title}`,
      message: `團體中有新的活動「${event.title}」`,
      data: {
        eventId: event._id,
        groupId: groupId
      }
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
  } catch (error) {
    console.error('通知團體成員錯誤:', error);
  }
};

module.exports = {
  createGroupEvent,
  getGroupEvents,
  approveGroupEvent,
  joinGroupEvent,
  leaveGroupEvent
};