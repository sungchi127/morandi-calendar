import React from 'react';
import { 
  Users, Calendar, MessageCircle, UserPlus, Settings,
  CheckCircle, XCircle, Archive, Trash2, Bell
} from 'lucide-react';
import { Notification, NotificationType } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onClick?: () => void;
}

const getNotificationIcon = (type: NotificationType) => {
  const iconClass = "w-5 h-5";
  
  switch (type) {
    case 'group_invitation':
    case 'group_join_request':
      return <Users className={iconClass} />;
    case 'group_member_added':
    case 'group_member_removed':
      return <UserPlus className={iconClass} />;
    case 'group_role_changed':
      return <Settings className={iconClass} />;
    case 'event_invitation':
    case 'event_updated':
    case 'event_cancelled':
    case 'event_reminder':
      return <Calendar className={iconClass} />;
    case 'event_approval_required':
    case 'event_approved':
      return <CheckCircle className={iconClass} />;
    case 'event_rejected':
      return <XCircle className={iconClass} />;
    case 'comment_added':
    case 'mention':
      return <MessageCircle className={iconClass} />;
    default:
      return <Bell className={iconClass} />;
  }
};

const getNotificationColor = (type: NotificationType, priority: string) => {
  if (priority === 'urgent') return 'text-error';
  if (priority === 'high') return 'text-morandi-rose';
  
  switch (type) {
    case 'group_invitation':
    case 'group_join_request':
      return 'text-morandi-sage';
    case 'event_invitation':
    case 'event_reminder':
      return 'text-morandi-blue';
    case 'event_approved':
      return 'text-morandi-sage';
    case 'event_rejected':
      return 'text-morandi-rose';
    case 'comment_added':
    case 'mention':
      return 'text-morandi-lavender';
    default:
      return 'text-text-secondary';
  }
};

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onArchive,
  onDelete,
  onClick
}) => {
  const isUnread = notification.status === 'unread';
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
    locale: zhTW
  });

  const iconColor = getNotificationColor(notification.type, notification.priority);

  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  return (
    <div
      className={`p-4 border-b border-border hover:bg-surface-alt transition-colors cursor-pointer ${
        isUnread ? 'bg-morandi-sage-light/20 border-l-4 border-l-morandi-sage' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start space-x-3">
        {/* 圖標 */}
        <div className={`flex-shrink-0 ${iconColor} mt-1`}>
          {getNotificationIcon(notification.type)}
        </div>

        {/* 內容 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className={`text-sm font-medium ${isUnread ? 'text-text-primary' : 'text-text-secondary'}`}>
                {notification.title}
              </h4>
              <p className="text-sm text-text-secondary mt-1 line-clamp-2">
                {notification.message}
              </p>
              
              {/* 發送者和時間 */}
              <div className="flex items-center space-x-2 mt-2 text-xs text-text-disabled">
                <span>來自 {notification.sender.displayName}</span>
                <span>•</span>
                <span>{timeAgo}</span>
                {notification.priority === 'high' && (
                  <>
                    <span>•</span>
                    <span className="text-morandi-rose font-medium">高優先級</span>
                  </>
                )}
                {notification.priority === 'urgent' && (
                  <>
                    <span>•</span>
                    <span className="text-error font-medium">緊急</span>
                  </>
                )}
              </div>
            </div>

            {/* 狀態指示器 */}
            {isUnread && (
              <div className="flex-shrink-0 w-2 h-2 bg-morandi-sage rounded-full mt-2"></div>
            )}
          </div>

          {/* 操作按鈕 */}
          <div className="flex items-center justify-end space-x-2 mt-3">
            {isUnread && (
              <button
                onClick={(e) => handleActionClick(e, () => onMarkAsRead(notification._id))}
                className="text-xs text-morandi-sage hover:text-morandi-sage-dark transition-colors"
                title="標記為已讀"
              >
                標記已讀
              </button>
            )}
            
            <button
              onClick={(e) => handleActionClick(e, () => onArchive(notification._id))}
              className="p-1 text-text-disabled hover:text-text-secondary transition-colors"
              title="歸檔"
            >
              <Archive className="w-3 h-3" />
            </button>
            
            <button
              onClick={(e) => handleActionClick(e, () => onDelete(notification._id))}
              className="p-1 text-text-disabled hover:text-error transition-colors"
              title="刪除"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;