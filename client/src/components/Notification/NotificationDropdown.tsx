import React, { useRef, useEffect } from 'react';
import { X, Settings, ExternalLink } from 'lucide-react';
import { Notification } from '@/types';
import NotificationItem from './NotificationItem';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  unreadCount: number;
  loading?: boolean;
  onMarkAsRead: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onMarkAllAsRead: () => void;
  onViewAll: () => void;
  onSettings: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  loading = false,
  onMarkAsRead,
  onArchive,
  onDelete,
  onMarkAllAsRead,
  onViewAll,
  onSettings
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const recentNotifications = notifications.slice(0, 5);

  return (
    <div className="absolute right-0 top-full mt-2 w-96 bg-surface border border-border rounded-lg shadow-lg z-50">
      <div ref={dropdownRef}>
        {/* 標題列 */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold text-text-primary">通知</h3>
            {unreadCount > 0 && (
              <span className="px-2 py-1 bg-morandi-sage text-white text-xs font-medium rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={onSettings}
              className="p-1 text-text-secondary hover:text-text-primary transition-colors"
              title="通知設定"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1 text-text-secondary hover:text-text-primary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 快速操作 */}
        {unreadCount > 0 && (
          <div className="p-3 bg-morandi-sage-light/10 border-b border-border">
            <button
              onClick={onMarkAllAsRead}
              className="text-sm text-morandi-sage hover:text-morandi-sage-dark transition-colors"
            >
              將所有通知標記為已讀
            </button>
          </div>
        )}

        {/* 通知列表 */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="space-y-4 p-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-start space-x-3">
                  <div className="w-5 h-5 bg-surface-alt rounded animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-surface-alt rounded animate-pulse"></div>
                    <div className="h-3 bg-surface-alt rounded animate-pulse w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : recentNotifications.length > 0 ? (
            <div>
              {recentNotifications.map((notification) => (
                <NotificationItem
                  key={notification._id}
                  notification={notification}
                  onMarkAsRead={onMarkAsRead}
                  onArchive={onArchive}
                  onDelete={onDelete}
                  onClick={() => {
                    if (notification.data?.actionUrl) {
                      // 根據通知類型導航到相應頁面
                      console.log('Navigate to:', notification.data.actionUrl);
                    }
                    onClose();
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-text-secondary">沒有新通知</p>
            </div>
          )}
        </div>

        {/* 底部操作 */}
        {notifications.length > 5 && (
          <div className="p-3 border-t border-border">
            <button
              onClick={() => {
                onViewAll();
                onClose();
              }}
              className="w-full flex items-center justify-center space-x-2 py-2 text-sm text-morandi-sage hover:text-morandi-sage-dark transition-colors"
            >
              <span>查看所有通知</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;