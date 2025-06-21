import React from 'react';
import { Bell, BellDot } from 'lucide-react';

interface NotificationBadgeProps {
  count: number;
  onClick: () => void;
  className?: string;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  onClick,
  className = ''
}) => {
  return (
    <button
      onClick={onClick}
      className={`relative p-2 text-text-secondary hover:text-text-primary hover:bg-surface-alt rounded-lg transition-colors ${className}`}
      title={count > 0 ? `你有 ${count} 個未讀通知` : '沒有新通知'}
    >
      {count > 0 ? (
        <BellDot className="w-5 h-5" />
      ) : (
        <Bell className="w-5 h-5" />
      )}
      
      {count > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-error text-white text-xs font-medium flex items-center justify-center rounded-full px-1">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
};

export default NotificationBadge;