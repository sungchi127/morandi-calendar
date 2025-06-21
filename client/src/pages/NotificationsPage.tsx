import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, Filter, Settings, Trash2, 
  RefreshCw, Bell
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { notificationAPI } from '@/services/api';
import { Notification } from '@/types';
import NotificationList from '@/components/Notification/NotificationList';
import NotificationSettings from '@/components/Notification/NotificationSettings';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

type ViewMode = 'notifications' | 'settings';
type FilterType = 'all' | 'unread' | 'read' | 'archived';

const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  const [viewMode, setViewMode] = useState<ViewMode>('notifications');
  const [currentFilter, setCurrentFilter] = useState<FilterType>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // 獲取通知列表
  const { data: notificationsData, isLoading, error } = useQuery({
    queryKey: ['notifications', currentFilter, currentPage],
    queryFn: () => {
      const params: any = {
        page: currentPage,
        limit: 20
      };
      
      if (currentFilter !== 'all') {
        params.status = currentFilter;
      }
      
      return notificationAPI.getUserNotifications(params);
    },
    enabled: !!user && viewMode === 'notifications',
  });

  // 獲取未讀通知數量
  const { data: unreadCountData } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: notificationAPI.getUnreadCount,
    enabled: !!user,
    refetchInterval: 30000, // 每30秒刷新一次
  });

  // 獲取通知設定
  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ['notification-settings'],
    queryFn: notificationAPI.getNotificationSettings,
    enabled: !!user && viewMode === 'settings',
  });

  // 標記為已讀 mutation
  const markAsReadMutation = useMutation({
    mutationFn: notificationAPI.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '標記失敗');
    },
  });

  // 全部標記為已讀 mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: notificationAPI.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      toast.success('所有通知已標記為已讀');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '操作失敗');
    },
  });

  // 歸檔 mutation
  const archiveMutation = useMutation({
    mutationFn: notificationAPI.archiveNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('通知已歸檔');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '歸檔失敗');
    },
  });

  // 批次歸檔 mutation
  const batchArchiveMutation = useMutation({
    mutationFn: notificationAPI.batchArchive,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success(`已歸檔 ${response.data.updated} 個通知`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '批次歸檔失敗');
    },
  });

  // 刪除 mutation
  const deleteMutation = useMutation({
    mutationFn: notificationAPI.deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('通知已刪除');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '刪除失敗');
    },
  });

  // 批次刪除 mutation
  const batchDeleteMutation = useMutation({
    mutationFn: notificationAPI.batchDelete,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success(`已刪除 ${response.data.deleted} 個通知`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '批次刪除失敗');
    },
  });

  // 更新設定 mutation
  const updateSettingsMutation = useMutation({
    mutationFn: notificationAPI.updateNotificationSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] });
      toast.success('設定已更新');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '更新設定失敗');
    },
  });

  // 清理已讀通知 mutation
  const cleanupMutation = useMutation({
    mutationFn: () => notificationAPI.cleanupReadNotifications(),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success(`已清理 ${response.data.deleted} 個已讀通知`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '清理失敗');
    },
  });

  const notifications = notificationsData?.data.notifications || [];
  const pagination = notificationsData?.data.pagination;
  const unreadCount = unreadCountData?.data.count || 0;
  const settings = settingsData?.data.settings;

  const handleFilterChange = (filter: FilterType) => {
    setCurrentFilter(filter);
    setCurrentPage(1);
  };

  const handleNotificationClick = (notification: Notification) => {
    // 根據通知類型導航到相應頁面
    if (notification.data?.actionUrl) {
      const url = notification.data.actionUrl;
      if (url.includes('/groups/')) {
        navigate('/groups');
      } else if (url.includes('/calendar/')) {
        navigate('/calendar');
      }
    }
  };

  const handleCleanupOldNotifications = () => {
    if (window.confirm('確定要清理所有已讀通知嗎？此操作無法復原。')) {
      cleanupMutation.mutate();
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Bell className="w-16 h-16 text-error mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-text-primary mb-2">載入失敗</h2>
          <p className="text-text-secondary">無法載入通知資料，請稍後再試。</p>
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
              <Bell className="w-8 h-8 text-morandi-sage" />
              <h1 className="text-xl font-semibold text-text-primary">
                {viewMode === 'settings' ? '通知設定' : '通知中心'}
              </h1>
              {viewMode === 'notifications' && unreadCount > 0 && (
                <span className="px-2 py-1 bg-morandi-sage text-white text-xs font-medium rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {viewMode === 'notifications' && (
              <>
                <button
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['notifications'] })}
                  className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-alt rounded-lg transition-colors"
                  title="重新整理"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>

                <button
                  onClick={handleCleanupOldNotifications}
                  className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-alt rounded-lg transition-colors"
                  title="清理已讀通知"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </>
            )}

            <button
              onClick={() => setViewMode(viewMode === 'settings' ? 'notifications' : 'settings')}
              className="flex items-center space-x-2 px-3 py-2 text-text-secondary hover:text-text-primary hover:bg-surface-alt rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span className="text-sm">
                {viewMode === 'settings' ? '返回通知' : '設定'}
              </span>
            </button>
          </div>
        </div>

        {/* 篩選器 */}
        {viewMode === 'notifications' && (
          <div className="flex items-center space-x-4 mt-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-text-secondary" />
              <span className="text-sm text-text-secondary">篩選：</span>
            </div>
            
            {(['all', 'unread', 'read', 'archived'] as FilterType[]).map((filter) => (
              <button
                key={filter}
                onClick={() => handleFilterChange(filter)}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  currentFilter === filter
                    ? 'bg-morandi-sage text-white'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-alt'
                }`}
              >
                {filter === 'all' && '全部'}
                {filter === 'unread' && '未讀'}
                {filter === 'read' && '已讀'}
                {filter === 'archived' && '已歸檔'}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* 主要內容 */}
      <main className="container mx-auto px-6 py-8">
        {viewMode === 'notifications' ? (
          <div className="max-w-4xl mx-auto">
            <NotificationList
              notifications={notifications}
              loading={isLoading}
              onMarkAsRead={(id) => markAsReadMutation.mutate(id)}
              onArchive={(id) => archiveMutation.mutate(id)}
              onDelete={(id) => deleteMutation.mutate(id)}
              onMarkAllAsRead={() => markAllAsReadMutation.mutate([])}
              onBatchArchive={(ids) => batchArchiveMutation.mutate(ids)}
              onBatchDelete={(ids) => batchDeleteMutation.mutate(ids)}
              onNotificationClick={handleNotificationClick}
            />

            {/* 分頁 */}
            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-center space-x-2 mt-8">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-border rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-alt transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  上一頁
                </button>
                
                <span className="text-sm text-text-secondary">
                  第 {currentPage} 頁，共 {pagination.pages} 頁
                </span>
                
                <button
                  onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
                  disabled={currentPage === pagination.pages}
                  className="px-3 py-2 border border-border rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-alt transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一頁
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            {settingsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-morandi-sage"></div>
              </div>
            ) : settings ? (
              <NotificationSettings
                settings={settings}
                onSave={(newSettings) => updateSettingsMutation.mutate(newSettings)}
                loading={updateSettingsMutation.isPending}
              />
            ) : (
              <div className="text-center py-12">
                <Settings className="w-16 h-16 text-text-disabled mx-auto mb-4" />
                <p className="text-text-secondary">無法載入設定</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default NotificationsPage;