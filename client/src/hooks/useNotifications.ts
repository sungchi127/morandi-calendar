import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

export const useNotifications = (params?: {
  page?: number;
  limit?: number;
  status?: 'unread' | 'read' | 'archived';
  type?: string;
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // 獲取通知列表
  const {
    data: notificationsData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['notifications', params],
    queryFn: () => notificationAPI.getUserNotifications(params),
    enabled: !!user,
  });

  // 獲取未讀數量
  const { data: unreadCountData } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: notificationAPI.getUnreadCount,
    enabled: !!user,
    refetchInterval: 30000, // 每30秒刷新
  });

  // 標記為已讀
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

  // 批次標記為已讀
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

  // 歸檔通知
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

  // 批次歸檔
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

  // 刪除通知
  const deleteMutation = useMutation({
    mutationFn: notificationAPI.deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      toast.success('通知已刪除');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '刪除失敗');
    },
  });

  // 批次刪除
  const batchDeleteMutation = useMutation({
    mutationFn: notificationAPI.batchDelete,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      toast.success(`已刪除 ${response.data.deleted} 個通知`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '批次刪除失敗');
    },
  });

  return {
    // 數據
    notifications: notificationsData?.data.notifications || [],
    pagination: notificationsData?.data.pagination,
    unreadCount: unreadCountData?.data.count || 0,
    
    // 狀態
    isLoading,
    error,
    
    // 操作
    refetch,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    archive: archiveMutation.mutate,
    batchArchive: batchArchiveMutation.mutate,
    deleteNotification: deleteMutation.mutate,
    batchDelete: batchDeleteMutation.mutate,
    
    // Mutation 狀態
    isMarkingAsRead: markAsReadMutation.isPending,
    isArchiving: archiveMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};

export const useNotificationSettings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // 獲取通知設定
  const {
    data: settingsData,
    isLoading,
    error
  } = useQuery({
    queryKey: ['notification-settings'],
    queryFn: notificationAPI.getNotificationSettings,
    enabled: !!user,
  });

  // 更新通知設定
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

  return {
    settings: settingsData?.data.settings,
    isLoading,
    error,
    updateSettings: updateSettingsMutation.mutate,
    isUpdating: updateSettingsMutation.isPending,
  };
};