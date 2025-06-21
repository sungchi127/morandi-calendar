import axios from 'axios';
import { AuthResponse, LoginRequest, RegisterRequest, User, Event, CreateEventForm, ApiResponse, Comment, Group, CreateGroupForm, EditGroupForm, InviteMembersForm, GroupMember, Notification, NotificationPaginatedResponse, NotificationSettings, Invitation, InvitationPaginatedResponse } from '@/types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://172.20.213.111:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  console.log('API Request:', {
    url: config.url,
    method: config.method,
    hasToken: !!token,
    token: token ? token.substring(0, 20) + '...' : null
  });
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data: RegisterRequest): Promise<ApiResponse<AuthResponse>> => 
    api.post('/auth/register', data).then(res => res.data),
  
  login: (data: LoginRequest): Promise<ApiResponse<AuthResponse>> => 
    api.post('/auth/login', data).then(res => res.data),
  
  getProfile: (): Promise<ApiResponse<{ user: User }>> => 
    api.get('/auth/profile').then(res => res.data),
  
  updateProfile: (data: Partial<User>): Promise<ApiResponse<{ user: User }>> => 
    api.put('/auth/profile', data).then(res => res.data),
};

export const eventAPI = {
  getEvents: (params?: { year?: number; month?: number; startDate?: string; endDate?: string }): Promise<ApiResponse<{ events: Event[] }>> => 
    api.get('/events', { params }).then(res => res.data),
  
  getEvent: (id: string): Promise<ApiResponse<{ event: Event }>> => 
    api.get(`/events/${id}`).then(res => res.data),
  
  createEvent: (data: CreateEventForm): Promise<ApiResponse<{ event: Event }>> => 
    api.post('/events', data).then(res => res.data),
  
  updateEvent: (id: string, data: Partial<CreateEventForm>): Promise<ApiResponse<{ event: Event }>> => 
    api.put(`/events/${id}`, data).then(res => res.data),
  
  deleteEvent: (id: string): Promise<ApiResponse<void>> => 
    api.delete(`/events/${id}`).then(res => res.data),

  searchEvents: (params: {
    q?: string;
    category?: string;
    color?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    page?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ApiResponse<{
    events: Event[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
    query: any;
  }>> => 
    api.get('/events/search', { params }).then(res => res.data),
};

export const commentAPI = {
  getComments: (eventId: string, params?: { page?: number; limit?: number }): Promise<ApiResponse<{ 
    comments: Comment[]; 
    pagination: { total: number; page: number; pages: number } 
  }>> => 
    api.get(`/comments/event/${eventId}`, { params }).then(res => res.data),
  
  createComment: (eventId: string, data: { content: string; images?: any[]; parentComment?: string }): Promise<ApiResponse<{ comment: Comment }>> => 
    api.post(`/comments/event/${eventId}`, data).then(res => res.data),
  
  updateComment: (commentId: string, data: { content: string; images?: any[] }): Promise<ApiResponse<{ comment: Comment }>> => 
    api.put(`/comments/${commentId}`, data).then(res => res.data),
  
  deleteComment: (commentId: string): Promise<ApiResponse<void>> => 
    api.delete(`/comments/${commentId}`).then(res => res.data),
  
  toggleLike: (commentId: string): Promise<ApiResponse<{ likesCount: number; isLiked: boolean }>> => 
    api.post(`/comments/${commentId}/like`).then(res => res.data),
};

export const groupAPI = {
  // 獲取用戶的團體列表
  getUserGroups: (params?: { page?: number; limit?: number; role?: string }): Promise<ApiResponse<{
    groups: Group[];
    pagination: { page: number; limit: number; total: number };
  }>> => 
    api.get('/groups', { params }).then(res => res.data),

  // 創建新團體
  createGroup: (data: CreateGroupForm): Promise<ApiResponse<{ group: Group }>> => 
    api.post('/groups', data).then(res => res.data),

  // 獲取團體詳情
  getGroupDetail: (groupId: string): Promise<ApiResponse<{ group: Group }>> => 
    api.get(`/groups/${groupId}`).then(res => res.data),

  // 更新團體資訊
  updateGroup: (groupId: string, data: Partial<EditGroupForm>): Promise<ApiResponse<{ group: Group }>> => 
    api.put(`/groups/${groupId}`, data).then(res => res.data),

  // 刪除團體
  deleteGroup: (groupId: string): Promise<ApiResponse<void>> => 
    api.delete(`/groups/${groupId}`).then(res => res.data),

  // 搜尋公開團體
  searchPublicGroups: (params: { query: string; page?: number; limit?: number }): Promise<ApiResponse<{
    groups: Group[];
    pagination: { page: number; limit: number; total: number };
  }>> => 
    api.get('/groups/search', { params }).then(res => res.data),

  // 邀請成員
  inviteMembers: (groupId: string, data: InviteMembersForm): Promise<ApiResponse<{
    sent: number;
    failed: number;
    results: any[];
    errors: any[];
  }>> => 
    api.post(`/groups/${groupId}/invite`, data).then(res => res.data),

  // 移除成員
  removeMember: (groupId: string, memberId: string): Promise<ApiResponse<void>> => 
    api.delete(`/groups/${groupId}/members/${memberId}`).then(res => res.data),

  // 更新成員角色
  updateMemberRole: (groupId: string, memberId: string, data: { role: string }): Promise<ApiResponse<{ member: GroupMember }>> => 
    api.put(`/groups/${groupId}/members/${memberId}/role`, data).then(res => res.data),

  // 離開團體
  leaveGroup: (groupId: string): Promise<ApiResponse<void>> => 
    api.post(`/groups/${groupId}/leave`).then(res => res.data),

  // 獲取團體活動
  getGroupEvents: (groupId: string, params?: { page?: number; limit?: number }): Promise<ApiResponse<{
    events: Event[];
    pagination: { page: number; limit: number; total: number };
  }>> => 
    api.get(`/groups/${groupId}/events`, { params }).then(res => res.data),

  // 創建團體活動
  createGroupEvent: (groupId: string, data: CreateEventForm): Promise<ApiResponse<{ event: Event }>> => 
    api.post(`/groups/${groupId}/events`, data).then(res => res.data),

  // 審核團體活動
  approveGroupEvent: (groupId: string, eventId: string, data: { approved: boolean; note?: string }): Promise<ApiResponse<{ event: Event }>> => 
    api.put(`/groups/${groupId}/events/${eventId}/approve`, data).then(res => res.data),

  // 加入團體活動
  joinGroupEvent: (groupId: string, eventId: string): Promise<ApiResponse<void>> => 
    api.post(`/groups/${groupId}/events/${eventId}/join`).then(res => res.data),

  // 離開團體活動
  leaveGroupEvent: (groupId: string, eventId: string): Promise<ApiResponse<void>> => 
    api.post(`/groups/${groupId}/events/${eventId}/leave`).then(res => res.data),
};

// 通知 API
export const notificationAPI = {
  // 獲取用戶通知列表
  getUserNotifications: (params?: { 
    page?: number; 
    limit?: number; 
    status?: 'unread' | 'read' | 'archived';
    type?: string;
  }): Promise<ApiResponse<NotificationPaginatedResponse>> => 
    api.get('/notifications', { params }).then(res => res.data),

  // 獲取未讀通知數量
  getUnreadCount: (): Promise<ApiResponse<{ count: number }>> => 
    api.get('/notifications/unread-count').then(res => res.data),

  // 標記通知為已讀
  markAsRead: (notificationId: string): Promise<ApiResponse<{ notification: Notification }>> => 
    api.put(`/notifications/${notificationId}/read`).then(res => res.data),

  // 批次標記為已讀
  markAllAsRead: (notificationIds?: string[]): Promise<ApiResponse<{ updated: number }>> => 
    api.put('/notifications/mark-all-read', { notificationIds }).then(res => res.data),

  // 歸檔通知
  archiveNotification: (notificationId: string): Promise<ApiResponse<{ notification: Notification }>> => 
    api.put(`/notifications/${notificationId}/archive`).then(res => res.data),

  // 批次歸檔
  batchArchive: (notificationIds: string[]): Promise<ApiResponse<{ updated: number }>> => 
    api.put('/notifications/batch-archive', { notificationIds }).then(res => res.data),

  // 刪除通知
  deleteNotification: (notificationId: string): Promise<ApiResponse<void>> => 
    api.delete(`/notifications/${notificationId}`).then(res => res.data),

  // 批次刪除
  batchDelete: (notificationIds: string[]): Promise<ApiResponse<{ deleted: number }>> => 
    api.delete('/notifications/batch-delete', { data: { notificationIds } }).then(res => res.data),

  // 清理已讀通知
  cleanupReadNotifications: (olderThan?: string): Promise<ApiResponse<{ deleted: number }>> => 
    api.delete('/notifications/cleanup-read', { 
      data: olderThan ? { olderThan } : undefined 
    }).then(res => res.data),

  // 獲取通知設定
  getNotificationSettings: (): Promise<ApiResponse<{ settings: NotificationSettings }>> => 
    api.get('/notifications/settings').then(res => res.data),

  // 更新通知設定
  updateNotificationSettings: (settings: Partial<NotificationSettings>): Promise<ApiResponse<{ settings: NotificationSettings }>> => 
    api.put('/notifications/settings', settings).then(res => res.data),

  // 發送測試通知
  sendTestNotification: (type: string): Promise<ApiResponse<{ notification: Notification }>> => 
    api.post('/notifications/test', { type }).then(res => res.data),
};

// 邀請 API
export const invitationAPI = {
  // 獲取用戶邀請列表
  getUserInvitations: (params?: { 
    page?: number; 
    limit?: number; 
    status?: 'pending' | 'accepted' | 'declined' | 'expired';
    type?: 'sent' | 'received';
  }): Promise<ApiResponse<InvitationPaginatedResponse>> => 
    api.get('/invitations', { params }).then(res => res.data),

  // 通過 token 獲取邀請詳情
  getInvitationByToken: (token: string): Promise<ApiResponse<{ invitation: Invitation }>> => 
    api.get(`/invitations/token/${token}`).then(res => res.data),

  // 接受邀請
  acceptInvitation: (invitationId: string): Promise<ApiResponse<{ invitation: Invitation; membership: any }>> => 
    api.post(`/invitations/${invitationId}/accept`).then(res => res.data),

  // 拒絕邀請
  declineInvitation: (invitationId: string, reason?: string): Promise<ApiResponse<{ invitation: Invitation }>> => 
    api.post(`/invitations/${invitationId}/decline`, { reason }).then(res => res.data),

  // 通過 token 接受邀請
  acceptInvitationByToken: (token: string): Promise<ApiResponse<{ invitation: Invitation; membership: any }>> => 
    api.post(`/invitations/token/${token}/accept`).then(res => res.data),

  // 通過邀請碼加入團體
  joinByInviteCode: (inviteCode: string): Promise<ApiResponse<{ group: Group; membership: any }>> => 
    api.post('/invitations/join-by-code', { inviteCode }).then(res => res.data),

  // 取消邀請
  cancelInvitation: (invitationId: string): Promise<ApiResponse<void>> => 
    api.delete(`/invitations/${invitationId}`).then(res => res.data),

  // 重新發送邀請
  resendInvitation: (invitationId: string): Promise<ApiResponse<{ invitation: Invitation }>> => 
    api.post(`/invitations/${invitationId}/resend`).then(res => res.data),

  // 生成新的邀請碼
  generateNewInviteCode: (groupId: string): Promise<ApiResponse<{ inviteCode: string; group: Group }>> => 
    api.post(`/invitations/groups/${groupId}/generate-code`).then(res => res.data),
};

export default api;