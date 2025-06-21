const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/groupController');

const {
  createGroupEvent,
  getGroupEvents,
  approveGroupEvent,
  joinGroupEvent,
  leaveGroupEvent
} = require('../controllers/groupEventController');
const authenticate = require('../middleware/auth');

// 所有路由都需要身份驗證
router.use(authenticate);

// 團體基本操作
router.get('/', getUserGroups);                    // 獲取用戶的團體列表
router.post('/', createGroup);                     // 創建新團體
router.get('/search', searchPublicGroups);         // 搜尋公開團體
router.get('/:groupId', getGroupDetail);           // 獲取團體詳情
router.put('/:groupId', updateGroup);              // 更新團體資訊
router.delete('/:groupId', deleteGroup);           // 刪除團體

// 成員管理
router.post('/:groupId/invite', inviteMembers);    // 邀請成員
router.delete('/:groupId/members/:memberId', removeMember);  // 移除成員
router.put('/:groupId/members/:memberId/role', updateMemberRole);  // 更新成員角色
router.post('/:groupId/leave', leaveGroup);        // 離開團體

// 團體活動管理
router.post('/:groupId/events', createGroupEvent);           // 創建團體活動
router.get('/:groupId/events', getGroupEvents);              // 獲取團體活動列表
router.put('/:groupId/events/:eventId/approve', approveGroupEvent);  // 審核團體活動
router.post('/:groupId/events/:eventId/join', joinGroupEvent);       // 加入團體活動
router.post('/:groupId/events/:eventId/leave', leaveGroupEvent);     // 離開團體活動

module.exports = router;