const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/notificationController');
const authenticate = require('../middleware/auth');

// 所有路由都需要身份驗證
router.use(authenticate);

// 通知查看
router.get('/', getUserNotifications);                         // 獲取用戶通知列表
router.get('/unread-count', getUnreadCount);                   // 獲取未讀通知數量

// 通知操作
router.put('/:notificationId/read', markAsRead);               // 標記通知為已讀
router.put('/mark-all-read', markAllAsRead);                   // 批次標記為已讀
router.put('/:notificationId/archive', archiveNotification);  // 歸檔通知
router.put('/batch-archive', batchArchive);                    // 批次歸檔
router.delete('/:notificationId', deleteNotification);         // 刪除通知
router.delete('/batch-delete', batchDelete);                   // 批次刪除
router.delete('/cleanup-read', cleanupReadNotifications);      // 清理已讀通知

// 通知設定
router.get('/settings', getNotificationSettings);              // 獲取通知設定
router.put('/settings', updateNotificationSettings);           // 更新通知設定

// 開發工具
router.post('/test', sendTestNotification);                    // 發送測試通知

module.exports = router;