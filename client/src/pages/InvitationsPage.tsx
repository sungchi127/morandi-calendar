import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, Inbox, Send, Users, RefreshCw,
  Mail, Link2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { invitationAPI } from '@/services/api';
import InvitationList from '@/components/Invitation/InvitationList';
import InviteCodeInput from '@/components/Invitation/InviteCodeInput';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

type TabType = 'received' | 'sent' | 'join';

const InvitationsPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<TabType>('received');
  const [currentPage, setCurrentPage] = useState(1);

  // 獲取收到的邀請
  const { data: receivedInvitationsData, isLoading: receivedLoading, error: receivedError } = useQuery({
    queryKey: ['invitations', 'received', currentPage],
    queryFn: () => invitationAPI.getUserInvitations({
      type: 'received',
      page: currentPage,
      limit: 10
    }),
    enabled: !!user && activeTab === 'received',
  });

  // 獲取發送的邀請
  const { data: sentInvitationsData, isLoading: sentLoading, error: sentError } = useQuery({
    queryKey: ['invitations', 'sent', currentPage],
    queryFn: () => invitationAPI.getUserInvitations({
      type: 'sent',
      page: currentPage,
      limit: 10
    }),
    enabled: !!user && activeTab === 'sent',
  });

  // 接受邀請 mutation
  const acceptInvitationMutation = useMutation({
    mutationFn: invitationAPI.acceptInvitation,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      queryClient.invalidateQueries({ queryKey: ['user-groups'] });
      toast.success(`成功加入團體「${response.data.invitation.group.name}」！`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '接受邀請失敗');
    },
  });

  // 拒絕邀請 mutation
  const declineInvitationMutation = useMutation({
    mutationFn: invitationAPI.declineInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      toast.success('已拒絕邀請');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '拒絕邀請失敗');
    },
  });

  // 取消邀請 mutation
  const cancelInvitationMutation = useMutation({
    mutationFn: invitationAPI.cancelInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      toast.success('邀請已取消');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '取消邀請失敗');
    },
  });

  // 重新發送邀請 mutation
  const resendInvitationMutation = useMutation({
    mutationFn: invitationAPI.resendInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      toast.success('邀請已重新發送');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '重新發送失敗');
    },
  });

  // 通過邀請碼加入 mutation
  const joinByCodeMutation = useMutation({
    mutationFn: invitationAPI.joinByInviteCode,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['user-groups'] });
      toast.success(`成功加入團體「${response.data.group.name}」！`);
      navigate('/groups');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '加入團體失敗');
    },
  });

  const receivedInvitations = receivedInvitationsData?.data.invitations || [];
  const sentInvitations = sentInvitationsData?.data.invitations || [];
  const receivedPagination = receivedInvitationsData?.data.pagination;
  const sentPagination = sentInvitationsData?.data.pagination;

  const pendingReceivedCount = receivedInvitations.filter(inv => 
    inv.status === 'pending' && new Date(inv.expiresAt) >= new Date()
  ).length;

  const handleAcceptInvitation = (id: string) => {
    acceptInvitationMutation.mutate(id);
  };

  const handleDeclineInvitation = (id: string) => {
    if (window.confirm('確定要拒絕這個邀請嗎？')) {
      declineInvitationMutation.mutate(id);
    }
  };

  const handleCancelInvitation = (id: string) => {
    if (window.confirm('確定要取消這個邀請嗎？')) {
      cancelInvitationMutation.mutate(id);
    }
  };

  const handleResendInvitation = (id: string) => {
    resendInvitationMutation.mutate(id);
  };

  const handleJoinByCode = (code: string) => {
    joinByCodeMutation.mutate(code);
  };

  const handleRefresh = () => {
    if (activeTab === 'received') {
      queryClient.invalidateQueries({ queryKey: ['invitations', 'received'] });
    } else if (activeTab === 'sent') {
      queryClient.invalidateQueries({ queryKey: ['invitations', 'sent'] });
    }
  };

  const isLoading = receivedLoading || sentLoading;
  const error = receivedError || sentError;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Mail className="w-16 h-16 text-error mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-text-primary mb-2">載入失敗</h2>
          <p className="text-text-secondary">無法載入邀請資料，請稍後再試。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 頂部導航 */}
      <header className="bg-surface border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/calendar')}
              className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-alt rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2">
              <Mail className="w-8 h-8 text-morandi-sage" />
              <h1 className="text-xl font-semibold text-text-primary">
                邀請管理
              </h1>
              {activeTab === 'received' && pendingReceivedCount > 0 && (
                <span className="px-2 py-1 bg-morandi-blue text-white text-xs font-medium rounded-full">
                  {pendingReceivedCount} 個待處理
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={handleRefresh}
              className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-alt rounded-lg transition-colors"
              title="重新整理"
              disabled={isLoading}
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => navigate('/groups')}
              className="flex items-center space-x-2 px-3 py-2 text-text-secondary hover:text-text-primary hover:bg-surface-alt rounded-lg transition-colors"
            >
              <Users className="w-4 h-4" />
              <span className="text-sm">我的團體</span>
            </button>
          </div>
        </div>

        {/* 標籤導航 */}
        <div className="flex items-center space-x-1 mt-4">
          <button
            onClick={() => {
              setActiveTab('received');
              setCurrentPage(1);
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'received'
                ? 'bg-morandi-sage text-white'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-alt'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>收到的邀請</span>
            {pendingReceivedCount > 0 && (
              <span className="px-2 py-1 bg-white/20 text-xs rounded-full">
                {pendingReceivedCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('sent');
              setCurrentPage(1);
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'sent'
                ? 'bg-morandi-sage text-white'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-alt'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>發送的邀請</span>
          </button>

          <button
            onClick={() => setActiveTab('join')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'join'
                ? 'bg-morandi-sage text-white'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-alt'
            }`}
          >
            <Link2 className="w-4 h-4" />
            <span>邀請碼加入</span>
          </button>
        </div>
      </header>

      {/* 主要內容 */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {activeTab === 'received' && (
            <InvitationList
              invitations={receivedInvitations}
              loading={receivedLoading}
              type="received"
              onAccept={handleAcceptInvitation}
              onDecline={handleDeclineInvitation}
              onRefresh={handleRefresh}
            />
          )}

          {activeTab === 'sent' && (
            <InvitationList
              invitations={sentInvitations}
              loading={sentLoading}
              type="sent"
              onAccept={handleAcceptInvitation}
              onDecline={handleDeclineInvitation}
              onCancel={handleCancelInvitation}
              onResend={handleResendInvitation}
              onRefresh={handleRefresh}
            />
          )}

          {activeTab === 'join' && (
            <div className="max-w-2xl mx-auto">
              <InviteCodeInput
                onJoinByCode={handleJoinByCode}
                loading={joinByCodeMutation.isPending}
              />
            </div>
          )}

          {/* 分頁 */}
          {((activeTab === 'received' && receivedPagination) || 
            (activeTab === 'sent' && sentPagination)) && (
            <div className="flex items-center justify-center space-x-2 mt-8">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-border rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-alt transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一頁
              </button>
              
              <span className="text-sm text-text-secondary">
                第 {currentPage} 頁，共 {
                  activeTab === 'received' 
                    ? receivedPagination?.pages 
                    : sentPagination?.pages
                } 頁
              </span>
              
              <button
                onClick={() => setCurrentPage(Math.min(
                  (activeTab === 'received' ? receivedPagination?.pages : sentPagination?.pages) || 1,
                  currentPage + 1
                ))}
                disabled={currentPage === (
                  activeTab === 'received' 
                    ? receivedPagination?.pages 
                    : sentPagination?.pages
                )}
                className="px-3 py-2 border border-border rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-alt transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一頁
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default InvitationsPage;