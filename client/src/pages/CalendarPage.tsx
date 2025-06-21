import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Settings, LogOut, User, Plus, Search, Users, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { eventAPI, notificationAPI } from '@/services/api';
import MonthView from '@/components/Calendar/MonthView';
import WeekView from '@/components/Calendar/WeekView';
import DayView from '@/components/Calendar/DayView';
import ViewSwitcher, { CalendarViewType } from '@/components/Calendar/ViewSwitcher';
import EventModal from '@/components/Event/EventModal';
import EventDetailModal from '@/components/Event/EventDetailModal';
import EventEditModal from '@/components/Event/EventEditModal';
import SearchPage from '@/pages/SearchPage';
import NotificationBadge from '@/components/Notification/NotificationBadge';
import NotificationDropdown from '@/components/Notification/NotificationDropdown';
import { Event, CreateEventForm } from '@/types';
import { combineDateTime, formatDateForInput } from '@/utils/date';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const CalendarPage: React.FC = () => {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isEventDetailModalOpen, setIsEventDetailModalOpen] = useState(false);
  const [isEventEditModalOpen, setIsEventEditModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showSearchPage, setShowSearchPage] = useState(false);
  const [currentView, setCurrentView] = useState<CalendarViewType>('month');
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);

  const { data: eventsData, isLoading, error } = useQuery({
    queryKey: ['events', currentDate.getFullYear(), currentDate.getMonth() + 1, currentView],
    queryFn: () => {
      if (currentView === 'month') {
        return eventAPI.getEvents({
          year: currentDate.getFullYear(),
          month: currentDate.getMonth() + 1,
        });
      } else {
        // 週視圖和日視圖需要更大的日期範圍
        const startDate = new Date(currentDate);
        const endDate = new Date(currentDate);
        
        if (currentView === 'week') {
          startDate.setDate(startDate.getDate() - startDate.getDay()); // 本週開始
          endDate.setDate(startDate.getDate() + 6); // 本週結束
        } else {
          // 日視圖只看當天
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
        }
        
        return eventAPI.getEvents({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        });
      }
    },
    enabled: !!user,
  });

  const events = eventsData?.data.events || [];

  // 獲取未讀通知數量
  const { data: unreadCountData } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: notificationAPI.getUnreadCount,
    enabled: !!user,
    refetchInterval: 30000, // 每30秒刷新一次
  });

  // 獲取最新通知（用於下拉列表）
  const { data: recentNotificationsData } = useQuery({
    queryKey: ['recent-notifications'],
    queryFn: () => notificationAPI.getUserNotifications({ limit: 5 }),
    enabled: !!user && isNotificationDropdownOpen,
  });

  // 創建活動的 mutation
  const createEventMutation = useMutation({
    mutationFn: eventAPI.createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('活動創建成功！');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '創建活動失敗');
    },
  });

  // 更新活動的 mutation
  const updateEventMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateEventForm> }) => 
      eventAPI.updateEvent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('活動更新成功！');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '更新活動失敗');
    },
  });

  // 刪除活動的 mutation
  const deleteEventMutation = useMutation({
    mutationFn: eventAPI.deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('活動刪除成功！');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '刪除活動失敗');
    },
  });

  // 通知相關 mutations
  const markAsReadMutation = useMutation({
    mutationFn: notificationAPI.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['recent-notifications'] });
    },
  });

  const archiveNotificationMutation = useMutation({
    mutationFn: notificationAPI.archiveNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recent-notifications'] });
      toast.success('通知已歸檔');
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: notificationAPI.deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['recent-notifications'] });
      toast.success('通知已刪除');
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: notificationAPI.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['recent-notifications'] });
      toast.success('所有通知已標記為已讀');
    },
  });

  const handleDateSelect = (date: Date) => {
    console.log('Selected date:', date, 'formatted:', formatDateForInput ? formatDateForInput(date) : date.toISOString());
    setSelectedDate(date);
    setIsEventModalOpen(true);
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setIsEventDetailModalOpen(true);
  };

  const handleEventCreate = (date: Date) => {
    setSelectedDate(date);
    setIsEventModalOpen(true);
  };

  const handleEventSubmit = async (formData: CreateEventForm) => {
    try {
      // 組合日期和時間
      const startDate = formData.isAllDay 
        ? new Date(formData.startDate + 'T00:00:00')
        : combineDateTime(formData.startDate, formData.startTime);
      
      const endDate = formData.isAllDay 
        ? new Date(formData.endDate + 'T23:59:59')
        : combineDateTime(formData.endDate, formData.endTime);

      // 處理重複設定
      let recurrenceData = { type: 'none', interval: 1 };
      if (formData.recurrence && formData.recurrence.type !== 'none') {
        recurrenceData = {
          type: formData.recurrence.type,
          interval: formData.recurrence.interval,
          ...(formData.recurrence.endType === 'date' && formData.recurrence.endDate 
            ? { endDate: new Date(formData.recurrence.endDate).toISOString() } 
            : {}),
          ...(formData.recurrence.endType === 'count' && formData.recurrence.occurrences 
            ? { occurrences: formData.recurrence.occurrences } 
            : {})
        };
      }

      const eventData = {
        title: formData.title,
        description: formData.description,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        isAllDay: formData.isAllDay,
        color: formData.color,
        category: formData.category,
        location: formData.location,
        privacy: formData.privacy,
        reminders: formData.reminders || [],
        recurrence: recurrenceData,
        ...(formData.group && { group: formData.group }), // 只在有團體時添加 group 欄位
      };

      console.log('Creating event with recurrence:', eventData);
      await createEventMutation.mutateAsync(eventData as any);
    } catch (error) {
      throw error;
    }
  };

  const handleEventEdit = (event: Event) => {
    setSelectedEvent(event);
    setIsEventDetailModalOpen(false);
    setIsEventEditModalOpen(true);
  };

  const handleEventUpdate = async (eventId: string, formData: Partial<CreateEventForm>) => {
    try {
      // 組合日期和時間，並移除不需要的字段
      const updateData: any = {
        title: formData.title,
        description: formData.description,
        isAllDay: formData.isAllDay,
        color: formData.color,
        category: formData.category,
        location: formData.location,
        privacy: formData.privacy,
        reminders: formData.reminders || [],
        ...(formData.group && { group: formData.group }), // 只在有團體時添加 group 欄位
      };
      
      if (formData.startDate) {
        const startDate = formData.isAllDay 
          ? new Date(formData.startDate + 'T00:00:00')
          : combineDateTime(formData.startDate, formData.startTime || '09:00');
        updateData.startDate = startDate.toISOString();
      }
      
      if (formData.endDate) {
        const endDate = formData.isAllDay 
          ? new Date(formData.endDate + 'T23:59:59')
          : combineDateTime(formData.endDate, formData.endTime || '10:00');
        updateData.endDate = endDate.toISOString();
      }

      // 不傳送 startTime 和 endTime 字段
      console.log('Update data being sent:', updateData);

      await updateEventMutation.mutateAsync({ id: eventId, data: updateData });
    } catch (error) {
      throw error;
    }
  };

  const handleEventDelete = async (eventId: string) => {
    try {
      await deleteEventMutation.mutateAsync(eventId);
    } catch (error) {
      throw error;
    }
  };

  const handleNavigate = (date: Date) => {
    setCurrentDate(date);
  };

  const isOwner = (event: Event) => {
    const result = event.creator._id === user?._id;
    console.log('isOwner check:', {
      eventCreatorId: event.creator._id,
      currentUserId: user?._id,
      isOwner: result
    });
    return result;
  };

  const unreadCount = unreadCountData?.data.count || 0;
  const recentNotifications = recentNotificationsData?.data.notifications || [];

  if (error) {
    toast.error('載入活動失敗');
  }

  if (showSearchPage) {
    return (
      <SearchPage
        onBack={() => setShowSearchPage(false)}
        onEventEdit={handleEventEdit}
        onEventDelete={handleEventDelete}
        isOwner={isOwner}
      />
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Navigation */}
      <header className="bg-surface border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-8 h-8 text-morandi-sage" />
              <h1 className="text-xl font-semibold text-text-primary">
                莫蘭迪日曆
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <ViewSwitcher 
              currentView={currentView} 
              onViewChange={setCurrentView} 
            />
            
            <button
              onClick={() => setShowSearchPage(true)}
              className="flex items-center space-x-2 px-4 py-2 border border-border text-text-secondary hover:text-text-primary hover:bg-surface-alt rounded-lg transition-colors"
            >
              <Search className="w-4 h-4" />
              <span className="text-sm font-medium">搜尋</span>
            </button>
            
            <button
              onClick={() => navigate('/groups')}
              className="flex items-center space-x-2 px-4 py-2 border border-border text-text-secondary hover:text-text-primary hover:bg-surface-alt rounded-lg transition-colors"
            >
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">團體</span>
            </button>
            
            <button
              onClick={() => navigate('/invitations')}
              className="flex items-center space-x-2 px-4 py-2 border border-border text-text-secondary hover:text-text-primary hover:bg-surface-alt rounded-lg transition-colors"
            >
              <Mail className="w-4 h-4" />
              <span className="text-sm font-medium">邀請</span>
            </button>
            
            <button
              onClick={() => {
                setSelectedDate(null);
                setIsEventModalOpen(true);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-morandi-sage text-white rounded-lg hover:bg-morandi-sage-dark transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">新增活動</span>
            </button>

            {/* 通知 */}
            <div className="relative">
              <NotificationBadge
                count={unreadCount}
                onClick={() => setIsNotificationDropdownOpen(!isNotificationDropdownOpen)}
              />
              <NotificationDropdown
                isOpen={isNotificationDropdownOpen}
                onClose={() => setIsNotificationDropdownOpen(false)}
                notifications={recentNotifications}
                unreadCount={unreadCount}
                onMarkAsRead={(id) => markAsReadMutation.mutate(id)}
                onArchive={(id) => archiveNotificationMutation.mutate(id)}
                onDelete={(id) => deleteNotificationMutation.mutate(id)}
                onMarkAllAsRead={() => markAllAsReadMutation.mutate([])}
                onViewAll={() => navigate('/notifications')}
                onSettings={() => navigate('/notifications')}
              />
            </div>
            
            <div className="flex items-center space-x-2 text-text-secondary">
              <User className="w-4 h-4" />
              <span className="text-sm">{user?.displayName}</span>
            </div>
            
            <button
              onClick={() => toast.success('設定功能即將推出！')}
              className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-alt rounded-lg transition-colors"
              title="設定"
            >
              <Settings className="w-5 h-5" />
            </button>
            
            <button
              onClick={logout}
              className="p-2 text-text-secondary hover:text-error hover:bg-error/10 rounded-lg transition-colors"
              title="登出"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-morandi-sage mx-auto mb-4"></div>
              <p className="text-text-secondary">載入中...</p>
            </div>
          </div>
        ) : (
          <>
            {currentView === 'month' && (
              <MonthView
                currentDate={currentDate}
                events={events}
                onDateSelect={handleDateSelect}
                onEventClick={handleEventClick}
                onEventCreate={handleEventCreate}
                onNavigate={handleNavigate}
              />
            )}
            {currentView === 'week' && (
              <WeekView
                currentDate={currentDate}
                events={events}
                onDateSelect={handleDateSelect}
                onEventClick={handleEventClick}
                onEventCreate={handleEventCreate}
                onNavigate={handleNavigate}
              />
            )}
            {currentView === 'day' && (
              <DayView
                currentDate={currentDate}
                events={events}
                onDateSelect={handleDateSelect}
                onEventClick={handleEventClick}
                onEventCreate={handleEventCreate}
                onNavigate={handleNavigate}
              />
            )}
          </>
        )}
      </main>

      {/* Event Modals */}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => {
          setIsEventModalOpen(false);
          setSelectedDate(null);
        }}
        onSubmit={handleEventSubmit}
        initialDate={selectedDate || undefined}
      />

      <EventDetailModal
        event={selectedEvent}
        isOpen={isEventDetailModalOpen}
        onClose={() => {
          setIsEventDetailModalOpen(false);
          setSelectedEvent(null);
        }}
        onEdit={handleEventEdit}
        onDelete={handleEventDelete}
        isOwner={selectedEvent ? isOwner(selectedEvent) : false}
      />

      <EventEditModal
        event={selectedEvent}
        isOpen={isEventEditModalOpen}
        onClose={() => {
          setIsEventEditModalOpen(false);
          setSelectedEvent(null);
        }}
        onSubmit={handleEventUpdate}
      />
    </div>
  );
};

export default CalendarPage;