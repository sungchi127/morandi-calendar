const express = require('express');
const router = express.Router();
const {
  getUserInvitations,
  getInvitationByToken,
  acceptInvitation,
  declineInvitation,
  acceptInvitationByToken,
  joinByInviteCode,
  cancelInvitation,
  resendInvitation,
  generateNewInviteCode
} = require('../controllers/invitationController');
const authenticate = require('../middleware/auth');

// 所有路由都需要身份驗證
router.use(authenticate);

// 邀請管理
router.get('/', getUserInvitations);                           // 獲取用戶的邀請列表
router.get('/token/:token', getInvitationByToken);             // 通過 token 獲取邀請詳情
router.post('/:invitationId/accept', acceptInvitation);        // 接受邀請
router.post('/:invitationId/decline', declineInvitation);      // 拒絕邀請
router.post('/token/:token/accept', acceptInvitationByToken);  // 通過 token 接受邀請
router.post('/join-by-code', joinByInviteCode);                // 通過邀請碼加入團體
router.delete('/:invitationId', cancelInvitation);             // 取消邀請
router.post('/:invitationId/resend', resendInvitation);        // 重新發送邀請

// 邀請碼管理
router.post('/groups/:groupId/generate-code', generateNewInviteCode);  // 生成新的邀請碼

module.exports = router;