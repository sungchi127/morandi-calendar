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
  privacy: 'private' | 'shared' | 'public';
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
  privacy: 'private' | 'shared' | 'public';
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