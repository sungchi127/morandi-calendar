import React, { useState } from 'react';
import { Mail, Users, Check, Filter, RefreshCw } from 'lucide-react';
import { Invitation } from '@/types';
import InvitationItem from './InvitationItem';

interface InvitationListProps {
  invitations: Invitation[];
  loading?: boolean;
  type?: 'received' | 'sent';
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  onCancel?: (id: string) => void;
  onResend?: (id: string) => void;
  onRefresh?: () => void;
}

type FilterType = 'all' | 'pending' | 'accepted' | 'declined' | 'expired';

const InvitationList: React.FC<InvitationListProps> = ({
  invitations,
  loading = false,
  type = 'received',
  onAccept,
  onDecline,
  onCancel,
  onResend,
  onRefresh
}) => {
  const [currentFilter, setCurrentFilter] = useState<FilterType>('all');

  const filteredInvitations = invitations.filter(invitation => {
    if (currentFilter === 'all') return true;
    
    if (currentFilter === 'expired') {
      return new Date(invitation.expiresAt) < new Date();
    }
    
    return invitation.status === currentFilter;
  });

  const pendingCount = invitations.filter(inv => 
    inv.status === 'pending' && new Date(inv.expiresAt) >= new Date()
  ).length;

  const getFilterCount = (filter: FilterType) => {
    if (filter === 'all') return invitations.length;
    if (filter === 'expired') {
      return invitations.filter(inv => new Date(inv.expiresAt) < new Date()).length;
    }
    return invitations.filter(inv => inv.status === filter).length;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-4 border border-border rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-surface-alt rounded-full animate-pulse"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-surface-alt rounded animate-pulse"></div>
                <div className="h-3 bg-surface-alt rounded animate-pulse w-3/4"></div>
                <div className="h-3 bg-surface-alt rounded animate-pulse w-1/2"></div>
              </div>
              <div className="flex space-x-2">
                <div className="w-16 h-6 bg-surface-alt rounded animate-pulse"></div>
                <div className="w-16 h-6 bg-surface-alt rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-20 h-20 bg-morandi-sage-light rounded-full flex items-center justify-center mb-4">
          {type === 'received' ? (
            <Mail className="w-8 h-8 text-morandi-sage" />
          ) : (
            <Users className="w-8 h-8 text-morandi-sage" />
          )}
        </div>
        <h3 className="text-lg font-medium text-text-primary mb-2">
          {type === 'received' ? '沒有收到邀請' : '沒有發送邀請'}
        </h3>
        <p className="text-text-secondary max-w-md">
          {type === 'received' 
            ? '目前沒有收到任何團體邀請，當有人邀請你加入團體時會在這裡顯示。'
            : '你還沒有發送任何邀請，前往團體頁面邀請成員加入你的團體。'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 統計和篩選 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="text-sm text-text-secondary">
            共 {invitations.length} 個邀請
            {pendingCount > 0 && (
              <span className="ml-2 px-2 py-1 bg-morandi-blue text-white text-xs rounded-full">
                {pendingCount} 個待處理
              </span>
            )}
          </div>
          
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="flex items-center space-x-1 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>重新整理</span>
            </button>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-text-secondary" />
          <select
            value={currentFilter}
            onChange={(e) => setCurrentFilter(e.target.value as FilterType)}
            className="text-sm border border-border rounded-lg px-3 py-1 bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-morandi-sage"
          >
            <option value="all">全部 ({getFilterCount('all')})</option>
            <option value="pending">待回覆 ({getFilterCount('pending')})</option>
            <option value="accepted">已接受 ({getFilterCount('accepted')})</option>
            <option value="declined">已拒絕 ({getFilterCount('declined')})</option>
            <option value="expired">已過期 ({getFilterCount('expired')})</option>
          </select>
        </div>
      </div>

      {/* 邀請列表 */}
      <div className="space-y-3">
        {filteredInvitations.length > 0 ? (
          filteredInvitations.map((invitation) => (
            <InvitationItem
              key={invitation._id}
              invitation={invitation}
              type={type}
              onAccept={onAccept}
              onDecline={onDecline}
              onCancel={onCancel}
              onResend={onResend}
            />
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-text-secondary">
              沒有符合篩選條件的邀請
            </p>
          </div>
        )}
      </div>

      {/* 批次操作提示 */}
      {pendingCount > 0 && type === 'received' && (
        <div className="p-4 bg-morandi-blue-light rounded-lg border border-morandi-blue">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 bg-morandi-blue rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-morandi-blue mb-1">
                你有 {pendingCount} 個待處理的邀請
              </h4>
              <p className="text-xs text-morandi-blue/80">
                及時回覆邀請可以讓邀請者知道你的決定，過期的邀請將無法接受。
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvitationList;