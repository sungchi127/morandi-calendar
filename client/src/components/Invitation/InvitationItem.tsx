import React from 'react';
import { 
  Users, Check, X, Clock, Mail, Link, 
  Crown, Shield, Eye, User
} from 'lucide-react';
import { Invitation, GroupRole } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';

interface InvitationItemProps {
  invitation: Invitation;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  onCancel?: (id: string) => void;
  onResend?: (id: string) => void;
  showActions?: boolean;
  type?: 'received' | 'sent';
}

const getRoleIcon = (role: GroupRole) => {
  const iconClass = "w-4 h-4";
  
  switch (role) {
    case 'owner':
      return <Crown className={iconClass} />;
    case 'admin':
      return <Shield className={iconClass} />;
    case 'member':
      return <User className={iconClass} />;
    case 'viewer':
      return <Eye className={iconClass} />;
    default:
      return <User className={iconClass} />;
  }
};

const getRoleColor = (role: GroupRole) => {
  switch (role) {
    case 'owner':
      return 'text-morandi-rose';
    case 'admin':
      return 'text-morandi-sage';
    case 'member':
      return 'text-morandi-blue';
    case 'viewer':
      return 'text-text-secondary';
    default:
      return 'text-text-secondary';
  }
};

const getRoleName = (role: GroupRole) => {
  switch (role) {
    case 'owner':
      return '創建者';
    case 'admin':
      return '管理員';
    case 'member':
      return '成員';
    case 'viewer':
      return '觀察者';
    default:
      return '成員';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'text-morandi-blue bg-morandi-blue-light';
    case 'accepted':
      return 'text-morandi-sage bg-morandi-sage-light';
    case 'declined':
      return 'text-morandi-rose bg-morandi-rose-light';
    case 'expired':
      return 'text-text-disabled bg-surface-alt';
    case 'cancelled':
      return 'text-text-disabled bg-surface-alt';
    default:
      return 'text-text-secondary bg-surface-alt';
  }
};

const getStatusName = (status: string) => {
  switch (status) {
    case 'pending':
      return '待回覆';
    case 'accepted':
      return '已接受';
    case 'declined':
      return '已拒絕';
    case 'expired':
      return '已過期';
    case 'cancelled':
      return '已取消';
    default:
      return status;
  }
};

const InvitationItem: React.FC<InvitationItemProps> = ({
  invitation,
  onAccept,
  onDecline,
  onCancel,
  onResend,
  showActions = true,
  type = 'received'
}) => {
  const timeAgo = formatDistanceToNow(new Date(invitation.createdAt), {
    addSuffix: true,
    locale: zhTW
  });

  const isExpired = new Date(invitation.expiresAt) < new Date();
  const isPending = invitation.status === 'pending' && !isExpired;
  const canRespond = type === 'received' && isPending;
  const canManage = type === 'sent' && invitation.status === 'pending';

  const handleAccept = () => {
    onAccept(invitation._id);
  };

  const handleDecline = () => {
    onDecline(invitation._id);
  };

  const handleCancel = () => {
    onCancel?.(invitation._id);
  };

  const handleResend = () => {
    onResend?.(invitation._id);
  };

  const getTypeIcon = () => {
    switch (invitation.type) {
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'invite_code':
        return <Link className="w-4 h-4" />;
      case 'direct':
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  return (
    <div className={`p-4 border border-border rounded-lg hover:bg-surface-alt transition-colors ${
      isPending ? 'border-l-4 border-l-morandi-blue' : ''
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          {/* 圖標 */}
          <div className="flex-shrink-0 mt-1">
            <div className="w-10 h-10 bg-morandi-sage-light rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-morandi-sage" />
            </div>
          </div>

          {/* 內容 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="text-sm font-medium text-text-primary truncate">
                {invitation.group.name}
              </h4>
              <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${getStatusColor(invitation.status)}`}>
                <span>{getStatusName(invitation.status)}</span>
              </div>
            </div>

            <div className="flex items-center space-x-4 text-sm text-text-secondary mb-2">
              <div className="flex items-center space-x-1">
                <span>
                  {type === 'received' 
                    ? `${invitation.inviter.displayName} 邀請你` 
                    : `邀請 ${invitation.invitee?.displayName || invitation.email}`
                  }
                </span>
              </div>
              
              <div className={`flex items-center space-x-1 ${getRoleColor(invitation.role)}`}>
                {getRoleIcon(invitation.role)}
                <span>{getRoleName(invitation.role)}</span>
              </div>

              <div className="flex items-center space-x-1">
                {getTypeIcon()}
                <span className="text-xs">{timeAgo}</span>
              </div>
            </div>

            {invitation.message && (
              <p className="text-sm text-text-secondary mb-2 line-clamp-2">
                {invitation.message}
              </p>
            )}

            {invitation.group.description && (
              <p className="text-xs text-text-disabled line-clamp-1">
                {invitation.group.description}
              </p>
            )}

            {isExpired && (
              <div className="mt-2 text-xs text-error">
                已於 {new Date(invitation.expiresAt).toLocaleDateString()} 過期
              </div>
            )}
          </div>
        </div>

        {/* 操作按鈕 */}
        {showActions && (
          <div className="flex-shrink-0 ml-4">
            {canRespond ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleDecline}
                  className="flex items-center space-x-1 px-3 py-1 text-xs border border-border text-text-secondary hover:text-error hover:border-error rounded-lg transition-colors"
                >
                  <X className="w-3 h-3" />
                  <span>拒絕</span>
                </button>
                <button
                  onClick={handleAccept}
                  className="flex items-center space-x-1 px-3 py-1 text-xs bg-morandi-sage text-white hover:bg-morandi-sage-dark rounded-lg transition-colors"
                >
                  <Check className="w-3 h-3" />
                  <span>接受</span>
                </button>
              </div>
            ) : canManage ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCancel}
                  className="flex items-center space-x-1 px-3 py-1 text-xs border border-border text-text-secondary hover:text-error hover:border-error rounded-lg transition-colors"
                >
                  <X className="w-3 h-3" />
                  <span>取消</span>
                </button>
                {onResend && (
                  <button
                    onClick={handleResend}
                    className="flex items-center space-x-1 px-3 py-1 text-xs border border-border text-text-secondary hover:text-text-primary hover:border-morandi-sage rounded-lg transition-colors"
                  >
                    <Clock className="w-3 h-3" />
                    <span>重發</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="text-xs text-text-disabled">
                {invitation.respondedAt && (
                  <span>
                    回覆於 {new Date(invitation.respondedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InvitationItem;