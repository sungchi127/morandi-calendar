import React, { useState } from 'react';
import { Heart, MoreHorizontal, Edit2, Trash2, Reply } from 'lucide-react';
import { Comment } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';

interface CommentItemProps {
  comment: Comment;
  currentUserId: string;
  onReply: (parentId: string) => void;
  onEdit: (comment: Comment) => void;
  onDelete: (commentId: string) => void;
  onLike: (commentId: string) => void;
  isReply?: boolean;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
  onLike,
  isReply = false,
}) => {
  const [showActions, setShowActions] = useState(false);
  const isAuthor = comment.author._id === currentUserId;
  const isLiked = comment.likes.some(like => like.user._id === currentUserId);

  const formatTime = (date: Date) => {
    return formatDistanceToNow(new Date(date), { 
      addSuffix: true, 
      locale: zhTW 
    });
  };

  return (
    <div className={`group ${isReply ? 'ml-8 mt-2' : 'mb-4'}`}>
      <div className="flex space-x-3">
        {/* 頭像 */}
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-morandi-sage rounded-full flex items-center justify-center">
            {comment.author.avatar ? (
              <img 
                src={comment.author.avatar} 
                alt={comment.author.displayName}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <span className="text-white text-sm font-medium">
                {comment.author.displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* 留言內容 */}
        <div className="flex-1 min-w-0">
          <div className="bg-surface border border-border rounded-lg p-3">
            {/* 留言頭部 */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-text-primary">
                  {comment.author.displayName}
                </span>
                {comment.isEdited && (
                  <span className="text-xs text-text-secondary">(已編輯)</span>
                )}
              </div>
              
              {/* 操作選單 */}
              {isAuthor && (
                <div className="relative">
                  <button
                    onClick={() => setShowActions(!showActions)}
                    className="p-1 text-text-secondary hover:text-text-primary rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  
                  {showActions && (
                    <div className="absolute right-0 top-6 bg-surface border border-border rounded-lg shadow-lg z-10 min-w-[120px]">
                      <button
                        onClick={() => {
                          onEdit(comment);
                          setShowActions(false);
                        }}
                        className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-alt"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span>編輯</span>
                      </button>
                      <button
                        onClick={() => {
                          onDelete(comment._id);
                          setShowActions(false);
                        }}
                        className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-error hover:bg-error/10"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>刪除</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 留言內容 */}
            <p className="text-text-primary whitespace-pre-wrap mb-2">
              {comment.content}
            </p>

            {/* 圖片 */}
            {comment.images && comment.images.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mb-2">
                {comment.images.map((image, index) => (
                  <img
                    key={index}
                    src={image.url}
                    alt={image.caption || '留言圖片'}
                    className="rounded border border-border max-h-32 object-cover"
                  />
                ))}
              </div>
            )}

            {/* 留言時間 */}
            <div className="text-xs text-text-secondary">
              {formatTime(comment.createdAt)}
            </div>
          </div>

          {/* 留言操作 */}
          <div className="flex items-center space-x-4 mt-2 text-sm">
            <button
              onClick={() => onLike(comment._id)}
              className={`flex items-center space-x-1 hover:text-morandi-rose transition-colors ${
                isLiked ? 'text-morandi-rose' : 'text-text-secondary'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              <span>{comment.likes.length > 0 ? comment.likes.length : ''}</span>
            </button>

            {!isReply && (
              <button
                onClick={() => onReply(comment._id)}
                className="flex items-center space-x-1 text-text-secondary hover:text-text-primary transition-colors"
              >
                <Reply className="w-4 h-4" />
                <span>回覆</span>
              </button>
            )}
          </div>

          {/* 回覆 */}
          {!isReply && comment.replies && comment.replies.length > 0 && (
            <div className="mt-3">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply._id}
                  comment={reply}
                  currentUserId={currentUserId}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onLike={onLike}
                  isReply={true}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentItem;