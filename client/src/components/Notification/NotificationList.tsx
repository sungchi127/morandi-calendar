import React from 'react';
import { Bell, CheckCircle2, Archive, Trash2 } from 'lucide-react';
import { Notification } from '@/types';
import NotificationItem from './NotificationItem';

interface NotificationListProps {
  notifications: Notification[];
  loading?: boolean;
  onMarkAsRead: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onMarkAllAsRead: () => void;
  onBatchArchive: (ids: string[]) => void;
  onBatchDelete: (ids: string[]) => void;
  onNotificationClick?: (notification: Notification) => void;
}

const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  loading = false,
  onMarkAsRead,
  onArchive,
  onDelete,
  onMarkAllAsRead,
  onBatchArchive,
  onBatchDelete,
  onNotificationClick
}) => {
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = React.useState(false);

  const unreadNotifications = notifications.filter(n => n.status === 'unread');
  const hasUnread = unreadNotifications.length > 0;

  const handleSelectAll = () => {
    if (selectedIds.length === notifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(notifications.map(n => n._id));
    }
  };

  const handleSelectNotification = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    );
  };

  const handleBatchAction = (action: 'archive' | 'delete') => {
    if (selectedIds.length === 0) return;
    
    if (action === 'archive') {
      onBatchArchive(selectedIds);
    } else {
      onBatchDelete(selectedIds);
    }
    
    setSelectedIds([]);
    setIsSelectionMode(false);
  };

  const handleNotificationClick = (notification: Notification) => {
    if (isSelectionMode) {
      handleSelectNotification(notification._id);
    } else {
      if (notification.status === 'unread') {
        onMarkAsRead(notification._id);
      }
      onNotificationClick?.(notification);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-4 border-b border-border">
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 bg-surface-alt rounded animate-pulse"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-surface-alt rounded animate-pulse"></div>
                <div className="h-3 bg-surface-alt rounded animate-pulse w-3/4"></div>
                <div className="h-3 bg-surface-alt rounded animate-pulse w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Bell className="w-16 h-16 text-text-disabled mb-4" />
        <h3 className="text-lg font-medium text-text-primary mb-2">
          沒有通知
        </h3>
        <p className="text-text-secondary">
          目前沒有任何通知，當有新活動時會在這裡顯示。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* 操作工具列 */}
      <div className="p-4 bg-surface border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {hasUnread && (
              <button
                onClick={onMarkAllAsRead}
                className="flex items-center space-x-2 text-sm text-morandi-sage hover:text-morandi-sage-dark transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>全部標為已讀</span>
              </button>
            )}
            
            <button
              onClick={() => setIsSelectionMode(!isSelectionMode)}
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              {isSelectionMode ? '取消選擇' : '批次操作'}
            </button>
          </div>

          {isSelectionMode && selectedIds.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-text-secondary">
                已選擇 {selectedIds.length} 項
              </span>
              <button
                onClick={() => handleBatchAction('archive')}
                className="p-1 text-text-secondary hover:text-text-primary transition-colors"
                title="批次歸檔"
              >
                <Archive className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleBatchAction('delete')}
                className="p-1 text-text-secondary hover:text-error transition-colors"
                title="批次刪除"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {isSelectionMode && (
          <div className="mt-3">
            <label className="flex items-center space-x-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                checked={selectedIds.length === notifications.length}
                onChange={handleSelectAll}
                className="rounded border-border text-morandi-sage focus:ring-morandi-sage"
              />
              <span>全選</span>
            </label>
          </div>
        )}
      </div>

      {/* 通知列表 */}
      <div className="divide-y divide-border">
        {notifications.map((notification) => (
          <div key={notification._id} className="relative">
            {isSelectionMode && (
              <div className="absolute left-4 top-4 z-10">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(notification._id)}
                  onChange={() => handleSelectNotification(notification._id)}
                  className="rounded border-border text-morandi-sage focus:ring-morandi-sage"
                />
              </div>
            )}
            
            <div className={isSelectionMode ? 'pl-10' : ''}>
              <NotificationItem
                notification={notification}
                onMarkAsRead={onMarkAsRead}
                onArchive={onArchive}
                onDelete={onDelete}
                onClick={() => handleNotificationClick(notification)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationList;