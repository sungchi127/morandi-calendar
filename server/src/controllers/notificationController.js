const Notification = require('../models/Notification');

// 獲取用戶通知列表
const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      status = ['unread', 'read'],
      types,
      page = 1,
      limit = 20,
      includeExpired = false
    } = req.query;

    // 處理狀態參數
    const statusArray = Array.isArray(status) ? status : [status];
    
    // 處理類型參數
    const typesArray = types ? (Array.isArray(types) ? types : [types]) : null;

    const options = {
      status: statusArray,
      types: typesArray,
      page: parseInt(page),
      limit: parseInt(limit),
      includeExpired: includeExpired === 'true'
    };

    const notifications = await Notification.getUserNotifications(userId, options);
    const unreadCount = await Notification.getUnreadCount(userId);

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: notifications.length
        }
      }
    });

  } catch (error) {
    console.error('獲取通知列表錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取通知列表失敗'
    });
  }
};

// 獲取未讀通知數量
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const unreadCount = await Notification.getUnreadCount(userId);

    res.json({
      success: true,
      data: { unreadCount }
    });

  } catch (error) {
    console.error('獲取未讀通知數量錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取未讀通知數量失敗'
    });
  }
};

// 標記通知為已讀
const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: '通知不存在'
      });
    }

    await notification.markAsRead();

    res.json({
      success: true,
      data: { notification },
      message: '通知已標記為已讀'
    });

  } catch (error) {
    console.error('標記通知為已讀錯誤:', error);
    res.status(500).json({
      success: false,
      message: '標記通知失敗'
    });
  }
};

// 批次標記為已讀
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { notificationIds } = req.body;

    const modifiedCount = await Notification.markAllAsRead(userId, notificationIds);

    res.json({
      success: true,
      data: { modifiedCount },
      message: `已標記 ${modifiedCount} 個通知為已讀`
    });

  } catch (error) {
    console.error('批次標記為已讀錯誤:', error);
    res.status(500).json({
      success: false,
      message: '批次標記失敗'
    });
  }
};

// 歸檔通知
const archiveNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: '通知不存在'
      });
    }

    await notification.archive();

    res.json({
      success: true,
      message: '通知已歸檔'
    });

  } catch (error) {
    console.error('歸檔通知錯誤:', error);
    res.status(500).json({
      success: false,
      message: '歸檔通知失敗'
    });
  }
};

// 批次歸檔通知
const batchArchive = async (req, res) => {
  try {
    const userId = req.user._id;
    const { notificationIds } = req.body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({
        success: false,
        message: '請提供要歸檔的通知ID列表'
      });
    }

    const result = await Notification.updateMany(
      {
        _id: { $in: notificationIds },
        recipient: userId
      },
      {
        status: 'archived'
      }
    );

    res.json({
      success: true,
      data: { modifiedCount: result.modifiedCount },
      message: `已歸檔 ${result.modifiedCount} 個通知`
    });

  } catch (error) {
    console.error('批次歸檔通知錯誤:', error);
    res.status(500).json({
      success: false,
      message: '批次歸檔失敗'
    });
  }
};

// 刪除通知
const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;

    const result = await Notification.deleteOne({
      _id: notificationId,
      recipient: userId
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: '通知不存在'
      });
    }

    res.json({
      success: true,
      message: '通知已刪除'
    });

  } catch (error) {
    console.error('刪除通知錯誤:', error);
    res.status(500).json({
      success: false,
      message: '刪除通知失敗'
    });
  }
};

// 批次刪除通知
const batchDelete = async (req, res) => {
  try {
    const userId = req.user._id;
    const { notificationIds } = req.body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({
        success: false,
        message: '請提供要刪除的通知ID列表'
      });
    }

    const result = await Notification.deleteMany({
      _id: { $in: notificationIds },
      recipient: userId
    });

    res.json({
      success: true,
      data: { deletedCount: result.deletedCount },
      message: `已刪除 ${result.deletedCount} 個通知`
    });

  } catch (error) {
    console.error('批次刪除通知錯誤:', error);
    res.status(500).json({
      success: false,
      message: '批次刪除失敗'
    });
  }
};

// 清理已讀通知
const cleanupReadNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const { olderThanDays = 30 } = req.body;

    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);

    const result = await Notification.deleteMany({
      recipient: userId,
      status: 'read',
      readAt: { $lt: cutoffDate }
    });

    res.json({
      success: true,
      data: { deletedCount: result.deletedCount },
      message: `已清理 ${result.deletedCount} 個舊通知`
    });

  } catch (error) {
    console.error('清理已讀通知錯誤:', error);
    res.status(500).json({
      success: false,
      message: '清理通知失敗'
    });
  }
};

// 獲取通知設定
const getNotificationSettings = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // 這裡可以從用戶設定或單獨的設定表中獲取通知偏好
    // 目前返回預設設定
    const settings = {
      emailNotifications: {
        groupInvitations: true,
        eventInvitations: true,
        eventUpdates: false,
        eventReminders: true,
        mentions: true
      },
      pushNotifications: {
        groupInvitations: true,
        eventInvitations: true,
        eventUpdates: true,
        eventReminders: true,
        mentions: true
      },
      inAppNotifications: {
        groupInvitations: true,
        eventInvitations: true,
        eventUpdates: true,
        eventReminders: true,
        mentions: true
      }
    };

    res.json({
      success: true,
      data: { settings }
    });

  } catch (error) {
    console.error('獲取通知設定錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取通知設定失敗'
    });
  }
};

// 更新通知設定
const updateNotificationSettings = async (req, res) => {
  try {
    const userId = req.user._id;
    const { settings } = req.body;

    // 這裡應該將設定保存到資料庫
    // 目前只是回傳成功訊息
    
    res.json({
      success: true,
      data: { settings },
      message: '通知設定更新成功'
    });

  } catch (error) {
    console.error('更新通知設定錯誤:', error);
    res.status(500).json({
      success: false,
      message: '更新通知設定失敗'
    });
  }
};

// 測試通知（開發用）
const sendTestNotification = async (req, res) => {
  try {
    const userId = req.user._id;
    const { type = 'test', title, message } = req.body;

    await Notification.create({
      recipient: userId,
      sender: userId,
      type: 'mention',
      title: title || '測試通知',
      message: message || '這是一個測試通知',
      priority: 'normal'
    });

    res.json({
      success: true,
      message: '測試通知已發送'
    });

  } catch (error) {
    console.error('發送測試通知錯誤:', error);
    res.status(500).json({
      success: false,
      message: '發送測試通知失敗'
    });
  }
};

module.exports = {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  archiveNotification,
  batchArchive,
  deleteNotification,
  batchDelete,
  cleanupReadNotifications,
  getNotificationSettings,
  updateNotificationSettings,
  sendTestNotification
};