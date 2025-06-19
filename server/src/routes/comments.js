const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createComment,
  getComments,
  updateComment,
  deleteComment,
  toggleLike
} = require('../controllers/commentController');

// 所有路由都需要認證
router.use(auth);

// 獲取特定活動的留言
router.get('/event/:eventId', getComments);

// 創建留言（包括回覆）
router.post('/event/:eventId', createComment);

// 更新留言
router.put('/:commentId', updateComment);

// 刪除留言
router.delete('/:commentId', deleteComment);

// 按讚/取消按讚
router.post('/:commentId/like', toggleLike);

module.exports = router;