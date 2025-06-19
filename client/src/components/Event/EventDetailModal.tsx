import React, { useState } from 'react';
import { X, Edit3, Trash2, Calendar, Clock, MapPin, User, Palette, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Event } from '@/types';
import { getColorConfig } from '@/utils/colors';
import { formatDateTime, formatDate, formatTime, isAllDayEvent } from '@/utils/date';
import CommentsList from '@/components/Comment/CommentsList';

interface EventDetailModalProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (event: Event) => void;
  onDelete: (eventId: string) => void;
  isOwner: boolean;
}

const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  isOwner
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showComments, setShowComments] = useState(false);

  if (!event || !isOpen) return null;

  const colorConfig = getColorConfig(event.color);
  const isAllDay = isAllDayEvent(event.startDate, event.endDate);

  const handleDelete = async () => {
    if (!window.confirm('確定要刪除這個活動嗎？此操作無法復原。')) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete(event._id);
      onClose();
    } catch (error) {
      console.error('Delete event error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const getCategoryText = (category: string) => {
    const categoryMap = {
      work: '工作',
      personal: '個人',
      friends: '朋友',
      family: '家庭',
      health: '健康',
      other: '其他'
    };
    return categoryMap[category as keyof typeof categoryMap] || category;
  };

  const getPrivacyText = (privacy: string) => {
    const privacyMap = {
      private: '私人',
      shared: '共享',
      public: '公開'
    };
    return privacyMap[privacy as keyof typeof privacyMap] || privacy;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className="relative bg-surface rounded-xl shadow-strong max-w-lg w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className={`
            p-6 border-b border-border relative overflow-hidden
            ${colorConfig.bg}
          `}>
            <div className="relative z-10">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h2 className={`text-xl font-semibold mb-2 ${colorConfig.text}`}>
                    {event.title}
                  </h2>
                  <div className="flex items-center space-x-2">
                    <span className={`
                      px-2 py-1 rounded-md text-xs font-medium
                      ${colorConfig.bgDark} ${colorConfig.text}
                    `}>
                      {getCategoryText(event.category)}
                    </span>
                    <span className={`
                      px-2 py-1 rounded-md text-xs font-medium
                      ${colorConfig.bgLight} ${colorConfig.text}
                    `}>
                      {getPrivacyText(event.privacy)}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  {isOwner && (
                    <>
                      <button
                        onClick={() => onEdit(event)}
                        className={`
                          p-2 rounded-lg transition-colors
                          ${colorConfig.text} hover:bg-white/20
                        `}
                        title="編輯活動"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className={`
                          p-2 rounded-lg transition-colors
                          ${colorConfig.text} hover:bg-red-500/20
                          ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                        title="刪除活動"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={onClose}
                    className={`
                      p-2 rounded-lg transition-colors
                      ${colorConfig.text} hover:bg-white/20
                    `}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Time Information */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-text-muted" />
                <div>
                  <div className="font-medium text-text-primary">
                    {isAllDay ? '全天活動' : '時間'}
                  </div>
                  <div className="text-text-secondary">
                    {isAllDay ? (
                      <>
                        {formatDate(event.startDate, 'yyyy年MM月dd日')}
                        {!isSameDay(event.startDate, event.endDate) && 
                          ` - ${formatDate(event.endDate, 'yyyy年MM月dd日')}`
                        }
                      </>
                    ) : (
                      <>
                        <div>{formatDateTime(event.startDate)}</div>
                        <div>至 {formatDateTime(event.endDate)}</div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {!isAllDay && (
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-text-muted" />
                  <div>
                    <div className="font-medium text-text-primary">持續時間</div>
                    <div className="text-text-secondary">
                      {getDurationText(event.startDate, event.endDate)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Location */}
            {event.location && (
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-text-muted mt-0.5" />
                <div>
                  <div className="font-medium text-text-primary">地點</div>
                  <div className="text-text-secondary">{event.location}</div>
                </div>
              </div>
            )}

            {/* Description */}
            {event.description && (
              <div className="space-y-2">
                <div className="font-medium text-text-primary">描述</div>
                <div className="text-text-secondary whitespace-pre-wrap bg-surface-alt p-3 rounded-lg">
                  {event.description}
                </div>
              </div>
            )}

            {/* Color */}
            <div className="flex items-center space-x-3">
              <Palette className="w-5 h-5 text-text-muted" />
              <div className="flex items-center space-x-2">
                <div className={`w-4 h-4 rounded ${colorConfig.bg}`}></div>
                <span className="text-text-secondary">{colorConfig.name || event.color}</span>
              </div>
            </div>

            {/* Creator */}
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-text-muted" />
              <div>
                <div className="font-medium text-text-primary">創建者</div>
                <div className="text-text-secondary">
                  {event.creator.displayName}
                  {isOwner && ' (你)'}
                </div>
              </div>
            </div>

            {/* Attendees */}
            {event.attendees && event.attendees.length > 0 && (
              <div className="space-y-2">
                <div className="font-medium text-text-primary">參與者</div>
                <div className="space-y-1">
                  {event.attendees.map((attendee, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-text-secondary">{attendee.user.displayName}</span>
                      <span className={`
                        px-2 py-1 rounded text-xs
                        ${attendee.status === 'accepted' ? 'bg-morandi-sage-light text-morandi-sage-dark' :
                          attendee.status === 'declined' ? 'bg-morandi-rose-light text-morandi-rose-dark' :
                          'bg-surface-alt text-text-muted'}
                      `}>
                        {attendee.status === 'accepted' ? '已接受' :
                         attendee.status === 'declined' ? '已拒絕' : '待回覆'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Created Date */}
            <div className="text-xs text-text-muted pt-4 border-t border-border">
              創建於 {formatDateTime(event.createdAt)}
              {event.updatedAt !== event.createdAt && (
                <span> · 更新於 {formatDateTime(event.updatedAt)}</span>
              )}
            </div>

            {/* Comments Toggle */}
            <div className="pt-4 border-t border-border">
              <button
                onClick={() => setShowComments(!showComments)}
                className="flex items-center space-x-2 w-full p-3 text-left bg-surface-alt hover:bg-surface-alt/70 rounded-lg transition-colors"
              >
                <MessageCircle className="w-5 h-5 text-text-secondary" />
                <span className="font-medium text-text-primary">
                  {showComments ? '隱藏留言' : '顯示留言'}
                </span>
              </button>
            </div>
          </div>

          {/* Comments Section */}
          <CommentsList 
            eventId={event._id} 
            isOpen={showComments} 
          />
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// Helper functions
const isSameDay = (date1: string | Date, date2: string | Date) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1.toDateString() === d2.toDateString();
};

const getDurationText = (startDate: string | Date, endDate: string | Date) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end.getTime() - start.getTime();
  
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffDays > 0) {
    return `${diffDays}天 ${diffHours}小時`;
  } else if (diffHours > 0) {
    return `${diffHours}小時 ${diffMinutes}分鐘`;
  } else {
    return `${diffMinutes}分鐘`;
  }
};

export default EventDetailModal;