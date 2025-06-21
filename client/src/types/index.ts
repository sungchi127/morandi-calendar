// 使用者相關類型
export interface User {
  _id: string;
  email: string;
  displayName: string;
  avatar?: string;
  preferences: {
    notifications: {
      email: boolean;
      browser: boolean;
      mobile: boolean;
    };
    theme: 'light' | 'dark' | 'morandi';
    defaultCalendarView: 'month' | 'week' | 'day';
    timezone: string;
  };
  isActive: boolean;
  lastLogin: Date;
  createdAt: Date;
  updatedAt: Date;
}

// 行程相關類型
export interface Event {
  _id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  isAllDay: boolean;
  color: MorandiColor;
  category: EventCategory;
  location?: string;
  creator: User;
  attendees: EventAttendee[];
  privacy: 'private' | 'shared' | 'public' | 'group_only';
  group?: Group; // 團體資訊，可選
  sharedWith: EventShare[];
  recurrence: EventRecurrence;
  reminders: ReminderType[];
  createdAt: Date;
  updatedAt: Date;
}

export type MorandiColor = 
  | 'morandi-sage'
  | 'morandi-rose'
  | 'morandi-lavender'
  | 'morandi-peach'
  | 'morandi-blue'
  | 'morandi-cream'
  | 'morandi-grey';

export type EventCategory = 
  | 'work'
  | 'personal'
  | 'friends'
  | 'family'
  | 'health'
  | 'other';

export interface EventAttendee {
  user: User;
  status: 'pending' | 'accepted' | 'declined';
  addedAt: Date;
}

export interface EventShare {
  user: User;
  permissions: {
    canView: boolean;
    canComment: boolean;
    canEdit: boolean;
  };
}

export interface EventRecurrence {
  type: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  endDate?: Date;
  occurrences?: number;
}

export interface RecurrenceRule {
  type: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  endDate?: string;
  occurrences?: number;
  endType: 'never' | 'date' | 'count';
}

export type ReminderType = 
  | '5min'
  | '15min'
  | '30min'
  | '1hour'
  | '1day'
  | '1week';

// 留言相關類型
export interface Comment {
  _id: string;
  event: string;
  author: User;
  content: string;
  images: CommentImage[];
  parentComment?: string;
  replies: Comment[];
  likes: CommentLike[];
  isEdited: boolean;
  editedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentImage {
  url: string;
  publicId: string;
  caption?: string;
}

export interface CommentLike {
  user: User;
  likedAt: Date;
}

// 日曆共享相關類型
export interface CalendarShare {
  _id: string;
  owner: User;
  sharedWith: User;
  permissions: CalendarPermissions;
  status: 'pending' | 'accepted' | 'declined';
  shareType: 'full_calendar' | 'specific_events';
  categories: EventCategory[];
  note?: string;
  expiresAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CalendarPermissions {
  canViewEvents: boolean;
  canCreateEvents: boolean;
  canEditEvents: boolean;
  canDeleteEvents: boolean;
  canComment: boolean;
  canInviteOthers: boolean;
}

// API 響應類型
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

// 認證相關類型
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// 表單相關類型
export interface CreateEventForm {
  title: string;
  description?: string;
  startDate: string;
  startTime?: string;
  endDate: string;
  endTime?: string;
  isAllDay: boolean;
  color: MorandiColor;
  category: EventCategory;
  location?: string;
  privacy: 'private' | 'shared' | 'public' | 'group_only';
  group?: string; // 團體ID，可選
  inviteUsers?: string[];
  reminders: ReminderType[];
  recurrence?: RecurrenceRule;
}

export interface EditEventForm extends CreateEventForm {
  eventId: string;
}

// 日曆視圖相關類型
export type CalendarView = 'month' | 'week' | 'day';

export interface CalendarDate {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  events: Event[];
}

export interface CalendarViewProps {
  currentDate: Date;
  events: Event[];
  onDateSelect: (date: Date) => void;
  onEventClick: (event: Event) => void;
  onEventCreate: (date: Date) => void;
}

// 搜尋相關類型
export interface SearchFilters {
  query?: string;
  categories?: EventCategory[];
  colors?: MorandiColor[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  creators?: string[];
}

export interface SearchResult {
  events: Event[];
  totalCount: number;
}

// 團體相關類型
export interface Group {
  _id: string;
  name: string;
  description?: string;
  avatar?: string;
  visibility: 'public' | 'private' | 'invite_only';
  inviteCode?: string;
  settings: GroupSettings;
  statistics: GroupStatistics;
  creator: User;
  isActive: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  // 虛擬欄位
  userRole?: GroupRole;
  isMember?: boolean;
  joinedAt?: Date;
  members?: GroupMember[];
  events?: Event[];
}

export interface GroupSettings {
  allowMembersCreateEvents: boolean;
  requireEventApproval: boolean;
  allowMembersInvite: boolean;
  defaultEventPrivacy: 'public' | 'private' | 'group_only';
}

export interface GroupStatistics {
  memberCount: number;
  eventCount: number;
}

export type GroupRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface GroupMember {
  _id: string;
  group: string;
  user: User;
  role: GroupRole;
  status: 'active' | 'inactive' | 'pending';
  joinedAt: Date;
  lastActiveAt?: Date;
  permissions: GroupMemberPermissions;
}

export interface GroupMemberPermissions {
  canCreateEvents: boolean;
  canEditEvents: boolean;
  canDeleteEvents: boolean;
  canInviteMembers: boolean;
  canRemoveMembers: boolean;
  canViewPrivateEvents: boolean;
}

export interface GroupInvitation {
  _id: string;
  group: Group;
  inviter: User;
  invitee?: User;
  email?: string;
  type: 'direct' | 'email';
  role: GroupRole;
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// 團體表單類型
export interface CreateGroupForm {
  name: string;
  description?: string;
  visibility: 'public' | 'private' | 'invite_only';
  settings?: Partial<GroupSettings>;
  tags?: string[];
}

export interface EditGroupForm extends CreateGroupForm {
  groupId: string;
}

export interface InviteMembersForm {
  invitations: {
    email?: string;
    userId?: string;
    role: GroupRole;
    message?: string;
  }[];
}

// 通知相關類型
export interface Notification {
  _id: string;
  recipient: User;
  sender: User;
  type: NotificationType;
  title: string;
  message: string;
  data?: NotificationData;
  status: 'unread' | 'read' | 'archived';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  readAt?: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type NotificationType = 
  | 'group_invitation'
  | 'group_join_request'
  | 'group_member_added'
  | 'group_member_removed'
  | 'group_role_changed'
  | 'event_invitation'
  | 'event_updated'
  | 'event_cancelled'
  | 'event_reminder'
  | 'event_approval_required'
  | 'event_approved'
  | 'event_rejected'
  | 'comment_added'
  | 'mention';

export interface NotificationData {
  groupId?: string;
  eventId?: string;
  invitationId?: string;
  commentId?: string;
  actionUrl?: string;
  metadata?: any;
}

export interface NotificationSettings {
  _id: string;
  user: string;
  email: {
    enabled: boolean;
    groupInvitations: boolean;
    eventReminders: boolean;
    eventUpdates: boolean;
    comments: boolean;
    mentions: boolean;
  };
  browser: {
    enabled: boolean;
    groupInvitations: boolean;
    eventReminders: boolean;
    eventUpdates: boolean;
    comments: boolean;
    mentions: boolean;
  };
  mobile: {
    enabled: boolean;
    groupInvitations: boolean;
    eventReminders: boolean;
    eventUpdates: boolean;
    comments: boolean;
    mentions: boolean;
  };
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
    timezone: string;
  };
  updatedAt: Date;
}

// 邀請相關類型（擴展現有的 GroupInvitation）
export interface Invitation {
  _id: string;
  group: Group;
  inviter: User;
  invitee?: User;
  email?: string;
  type: 'direct' | 'email' | 'invite_code';
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';
  role: GroupRole;
  message?: string;
  token: string;
  expiresAt: Date;
  respondedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// 通知分頁響應
export interface NotificationPaginatedResponse {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  unreadCount: number;
}

// 邀請分頁響應  
export interface InvitationPaginatedResponse {
  invitations: Invitation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}