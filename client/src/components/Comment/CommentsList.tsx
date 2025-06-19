import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Loader2 } from 'lucide-react';
import { commentAPI } from '@/services/api';
import { Comment } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import CommentItem from './CommentItem';
import CommentInput from './CommentInput';
import toast from 'react-hot-toast';

interface CommentsListProps {
  eventId: string;
  isOpen: boolean;
}

const CommentsList: React.FC<CommentsListProps> = ({ eventId, isOpen }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);

  // 獲取留言列表
  const { data: commentsData, isLoading, error } = useQuery({
    queryKey: ['comments', eventId],
    queryFn: () => commentAPI.getComments(eventId),
    enabled: !!eventId && isOpen,
  });

  // 創建留言
  const createCommentMutation = useMutation({
    mutationFn: ({ content, parentComment }: { content: string; parentComment?: string }) =>
      commentAPI.createComment(eventId, { content, parentComment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', eventId] });
      toast.success('留言發送成功！');
      setReplyingTo(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '發送留言失敗');
    },
  });

  // 更新留言
  const updateCommentMutation = useMutation({
    mutationFn: ({ commentId, content }: { commentId: string; content: string }) =>
      commentAPI.updateComment(commentId, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', eventId] });
      toast.success('留言更新成功！');
      setEditingComment(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '更新留言失敗');
    },
  });

  // 刪除留言
  const deleteCommentMutation = useMutation({
    mutationFn: commentAPI.deleteComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', eventId] });
      toast.success('留言刪除成功！');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '刪除留言失敗');
    },
  });

  // 按讚/取消按讚
  const toggleLikeMutation = useMutation({
    mutationFn: commentAPI.toggleLike,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', eventId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '操作失敗');
    },
  });

  const comments = commentsData?.data.comments || [];

  const handleCreateComment = async (content: string) => {
    if (!user) return;
    createCommentMutation.mutate({ content });
  };

  const handleReply = (parentId: string) => {
    setReplyingTo(parentId);
    setEditingComment(null);
  };

  const handleReplySubmit = async (content: string) => {
    if (!user || !replyingTo) return;
    createCommentMutation.mutate({ content, parentComment: replyingTo });
  };

  const handleEdit = (comment: Comment) => {
    setEditingComment(comment);
    setReplyingTo(null);
  };

  const handleEditSubmit = async (content: string) => {
    if (!editingComment) return;
    updateCommentMutation.mutate({
      commentId: editingComment._id,
      content,
    });
  };

  const handleDelete = async (commentId: string) => {
    if (window.confirm('確定要刪除這條留言嗎？')) {
      deleteCommentMutation.mutate(commentId);
    }
  };

  const handleLike = async (commentId: string) => {
    toggleLikeMutation.mutate(commentId);
  };

  if (!isOpen) return null;

  if (error) {
    return (
      <div className="p-4 text-center text-error">
        載入留言失敗，請稍後重試
      </div>
    );
  }

  return (
    <div className="bg-background border-t border-border">
      {/* 留言標題 */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center space-x-2">
          <MessageCircle className="w-5 h-5 text-text-secondary" />
          <h3 className="font-medium text-text-primary">
            留言 {comments.length > 0 && `(${comments.length})`}
          </h3>
        </div>
      </div>

      {/* 留言內容區 */}
      <div className="max-h-96 overflow-y-auto">
        <div className="p-4">
          {/* 新增留言輸入框 */}
          {!editingComment && (
            <div className="mb-6">
              <CommentInput
                onSubmit={handleCreateComment}
                placeholder="寫下你的留言..."
                isLoading={createCommentMutation.isPending}
              />
            </div>
          )}

          {/* 編輯留言輸入框 */}
          {editingComment && (
            <div className="mb-6 p-3 bg-surface-alt rounded-lg border border-border">
              <div className="text-sm text-text-secondary mb-2">編輯留言</div>
              <CommentInput
                onSubmit={handleEditSubmit}
                onCancel={() => setEditingComment(null)}
                initialValue={editingComment.content}
                placeholder="編輯你的留言..."
                isLoading={updateCommentMutation.isPending}
              />
            </div>
          )}

          {/* 載入狀態 */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-text-secondary" />
              <span className="ml-2 text-text-secondary">載入留言中...</span>
            </div>
          )}

          {/* 留言列表 */}
          {!isLoading && comments.length === 0 && (
            <div className="text-center py-8 text-text-secondary">
              <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>還沒有留言，來發表第一條留言吧！</p>
            </div>
          )}

          {!isLoading && comments.length > 0 && (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment._id}>
                  <CommentItem
                    comment={comment}
                    currentUserId={user?._id || ''}
                    onReply={handleReply}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onLike={handleLike}
                  />
                  
                  {/* 回覆輸入框 */}
                  {replyingTo === comment._id && (
                    <div className="ml-11 mt-2">
                      <CommentInput
                        onSubmit={handleReplySubmit}
                        onCancel={() => setReplyingTo(null)}
                        placeholder={`回覆 ${comment.author.displayName}...`}
                        isReply={true}
                        isLoading={createCommentMutation.isPending}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentsList;