import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invitationAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

export const useInvitations = (params?: {
  page?: number;
  limit?: number;
  status?: 'pending' | 'accepted' | 'declined' | 'expired';
  type?: 'sent' | 'received';
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // 獲取邀請列表
  const {
    data: invitationsData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['invitations', params],
    queryFn: () => invitationAPI.getUserInvitations(params),
    enabled: !!user,
  });

  // 接受邀請
  const acceptMutation = useMutation({
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

  // 拒絕邀請
  const declineMutation = useMutation({
    mutationFn: (params: { invitationId: string; reason?: string }) => 
      invitationAPI.declineInvitation(params.invitationId, params.reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      toast.success('已拒絕邀請');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '拒絕邀請失敗');
    },
  });

  // 取消邀請
  const cancelMutation = useMutation({
    mutationFn: invitationAPI.cancelInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      toast.success('邀請已取消');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '取消邀請失敗');
    },
  });

  // 重新發送邀請
  const resendMutation = useMutation({
    mutationFn: invitationAPI.resendInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      toast.success('邀請已重新發送');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '重新發送失敗');
    },
  });

  return {
    // 數據
    invitations: invitationsData?.data.invitations || [],
    pagination: invitationsData?.data.pagination,
    
    // 狀態
    isLoading,
    error,
    
    // 操作
    refetch,
    accept: acceptMutation.mutate,
    decline: (invitationId: string, reason?: string) => 
      declineMutation.mutate({ invitationId, reason }),
    cancel: cancelMutation.mutate,
    resend: resendMutation.mutate,
    
    // Mutation 狀態
    isAccepting: acceptMutation.isPending,
    isDeclining: declineMutation.isPending,
    isCancelling: cancelMutation.isPending,
    isResending: resendMutation.isPending,
  };
};

export const useInviteCode = () => {
  const queryClient = useQueryClient();

  // 通過邀請碼加入團體
  const joinByCodeMutation = useMutation({
    mutationFn: invitationAPI.joinByInviteCode,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['user-groups'] });
      toast.success(`成功加入團體「${response.data.group.name}」！`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '加入團體失敗');
    },
  });

  // 生成新的邀請碼
  const generateCodeMutation = useMutation({
    mutationFn: invitationAPI.generateNewInviteCode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-groups'] });
      toast.success('邀請碼已更新');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '生成邀請碼失敗');
    },
  });

  return {
    joinByCode: joinByCodeMutation.mutate,
    generateCode: generateCodeMutation.mutate,
    isJoining: joinByCodeMutation.isPending,
    isGenerating: generateCodeMutation.isPending,
  };
};

export const useInvitationByToken = (token: string | null) => {
  const queryClient = useQueryClient();

  // 通過 token 獲取邀請詳情
  const {
    data: invitationData,
    isLoading,
    error
  } = useQuery({
    queryKey: ['invitation-by-token', token],
    queryFn: () => token ? invitationAPI.getInvitationByToken(token) : null,
    enabled: !!token,
  });

  // 通過 token 接受邀請
  const acceptByTokenMutation = useMutation({
    mutationFn: invitationAPI.acceptInvitationByToken,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['user-groups'] });
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      toast.success(`成功加入團體「${response.data.invitation.group.name}」！`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '接受邀請失敗');
    },
  });

  return {
    invitation: invitationData?.data.invitation,
    isLoading,
    error,
    acceptByToken: acceptByTokenMutation.mutate,
    isAccepting: acceptByTokenMutation.isPending,
  };
};