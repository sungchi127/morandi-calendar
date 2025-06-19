const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  images: [{
    url: String,
    publicId: String, // Cloudinary public ID for deletion
    caption: String
  }],
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  replies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    likedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

commentSchema.index({ event: 1, createdAt: -1 });
commentSchema.index({ author: 1 });
commentSchema.index({ parentComment: 1 });

commentSchema.pre('find', function() {
  this.where({ isDeleted: { $ne: true } });
});

commentSchema.pre('findOne', function() {
  this.where({ isDeleted: { $ne: true } });
});

commentSchema.methods.addReply = function(replyId) {
  if (!this.replies.includes(replyId)) {
    this.replies.push(replyId);
    return this.save();
  }
};

commentSchema.methods.removeReply = function(replyId) {
  this.replies = this.replies.filter(id => !id.equals(replyId));
  return this.save();
};

module.exports = mongoose.model('Comment', commentSchema);