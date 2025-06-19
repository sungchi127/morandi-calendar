const Joi = require('joi');
const Comment = require('../models/Comment');
const Event = require('../models/Event');

// 留言驗證schema
const createCommentSchema = Joi.object({
  content: Joi.string().trim().min(1).max(500).required().messages({
    'string.empty': '留言內容不能為空',
    'string.max': '留言內容不能超過500個字符',
    'any.required': '留言內容是必填項目'
  }),
  images: Joi.array().items(
    Joi.object({
      url: Joi.string().uri().required(),
      publicId: Joi.string().required(),
      caption: Joi.string().max(100).allow('')
    })
  ).max(3).default([]),
  parentComment: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).allow(null).optional()
});

const updateCommentSchema = Joi.object({
  content: Joi.string().trim().min(1).max(500).required().messages({
    'string.empty': '留言內容不能為空',
    'string.max': '留言內容不能超過500個字符',
    'any.required': '留言內容是必填項目'
  }),
  images: Joi.array().items(
    Joi.object({
      url: Joi.string().uri().required(),
      publicId: Joi.string().required(),
      caption: Joi.string().max(100).allow('')
    })
  ).max(3).default([])
});

// 創建留言
const createComment = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // 驗證活動是否存在且用戶有權限查看
    const event = await Event.findOne({
      _id: eventId,
      $or: [
        { creator: req.user._id },
        { 'sharedWith.user': req.user._id },
        { privacy: 'public' }
      ]
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: '找不到該活動或沒有權限'
      });
    }

    // 驗證請求數據
    const { error, value } = createCommentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    // 如果是回覆，檢查父留言是否存在
    if (value.parentComment) {
      const parentComment = await Comment.findById(value.parentComment);
      if (!parentComment || parentComment.event.toString() !== eventId) {
        return res.status(400).json({
          success: false,
          message: '父留言不存在或不屬於此活動'
        });
      }
    }

    // 創建留言
    const comment = new Comment({
      ...value,
      event: eventId,
      author: req.user._id
    });

    await comment.save();
    await comment.populate('author', 'displayName email avatar');

    // 如果是回覆，更新父留言的replies陣列
    if (value.parentComment) {
      const parentComment = await Comment.findById(value.parentComment);
      await parentComment.addReply(comment._id);
    }

    res.status(201).json({
      success: true,
      message: '留言創建成功',
      data: { comment }
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({
      success: false,
      message: '創建留言時發生錯誤'
    });
  }
};

// 獲取活動的所有留言
const getComments = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // 驗證活動是否存在且用戶有權限查看
    const event = await Event.findOne({
      _id: eventId,
      $or: [
        { creator: req.user._id },
        { 'sharedWith.user': req.user._id },
        { privacy: 'public' }
      ]
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: '找不到該活動或沒有權限'
      });
    }

    // 獲取主留言（非回覆）
    const comments = await Comment.find({
      event: eventId,
      parentComment: null
    })
    .populate('author', 'displayName email avatar')
    .populate({
      path: 'replies',
      populate: {
        path: 'author',
        select: 'displayName email avatar'
      },
      options: { sort: { createdAt: 1 } }
    })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

    // 計算總數
    const total = await Comment.countDocuments({
      event: eventId,
      parentComment: null
    });

    res.json({
      success: true,
      data: {
        comments,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      message: '獲取留言時發生錯誤'
    });
  }
};

// 更新留言
const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    // 驗證請求數據
    const { error, value } = updateCommentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    // 查找留言並檢查權限
    const comment = await Comment.findOne({
      _id: commentId,
      author: req.user._id
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: '找不到該留言或沒有權限編輯'
      });
    }

    // 更新留言
    comment.content = value.content;
    comment.images = value.images;
    comment.isEdited = true;
    comment.editedAt = new Date();

    await comment.save();
    await comment.populate('author', 'displayName email avatar');

    res.json({
      success: true,
      message: '留言更新成功',
      data: { comment }
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({
      success: false,
      message: '更新留言時發生錯誤'
    });
  }
};

// 刪除留言
const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    // 查找留言並檢查權限
    const comment = await Comment.findOne({
      _id: commentId,
      author: req.user._id
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: '找不到該留言或沒有權限刪除'
      });
    }

    // 軟刪除留言
    comment.isDeleted = true;
    await comment.save();

    // 如果是回覆，從父留言的replies陣列中移除
    if (comment.parentComment) {
      const parentComment = await Comment.findById(comment.parentComment);
      if (parentComment) {
        await parentComment.removeReply(comment._id);
      }
    }

    res.json({
      success: true,
      message: '留言刪除成功'
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: '刪除留言時發生錯誤'
    });
  }
};

// 按讚/取消按讚
const toggleLike = async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: '找不到該留言'
      });
    }

    // 檢查用戶是否已按讚
    const existingLikeIndex = comment.likes.findIndex(
      like => like.user.toString() === req.user._id.toString()
    );

    if (existingLikeIndex > -1) {
      // 取消按讚
      comment.likes.splice(existingLikeIndex, 1);
    } else {
      // 新增按讚
      comment.likes.push({
        user: req.user._id,
        likedAt: new Date()
      });
    }

    await comment.save();

    res.json({
      success: true,
      message: existingLikeIndex > -1 ? '取消按讚成功' : '按讚成功',
      data: {
        likesCount: comment.likes.length,
        isLiked: existingLikeIndex === -1
      }
    });
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({
      success: false,
      message: '操作失敗'
    });
  }
};

module.exports = {
  createComment,
  getComments,
  updateComment,
  deleteComment,
  toggleLike
};