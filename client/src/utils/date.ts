import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isToday, 
  isSameDay as dateFnsIsSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  parseISO,
  formatISO,
  startOfDay,
  endOfDay
} from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { CalendarDate } from '@/types';

export const formatDate = (date: Date | string, formatStr: string = 'yyyy-MM-dd') => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr, { locale: zhTW });
};

export const formatTime = (date: Date | string) => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'HH:mm', { locale: zhTW });
};

export const formatDateTime = (date: Date | string) => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'yyyy年MM月dd日 HH:mm', { locale: zhTW });
};

export const formatRelativeDate = (date: Date | string) => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const now = new Date();
  
  if (dateFnsIsSameDay(dateObj, now)) {
    return '今天';
  }
  
  if (dateFnsIsSameDay(dateObj, addDays(now, 1))) {
    return '明天';
  }
  
  if (dateFnsIsSameDay(dateObj, subDays(now, 1))) {
    return '昨天';
  }
  
  return formatDate(dateObj, 'MM月dd日');
};

export const getMonthCalendarDates = (currentDate: Date): CalendarDate[] => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  
  const dates = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });
  
  return dates.map(date => ({
    date,
    isCurrentMonth: isSameMonth(date, currentDate),
    isToday: isToday(date),
    isSelected: false,
    events: [],
  }));
};

export const getWeekCalendarDates = (currentDate: Date): CalendarDate[] => {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  
  const dates = eachDayOfInterval({
    start: weekStart,
    end: weekEnd,
  });
  
  return dates.map(date => ({
    date,
    isCurrentMonth: true,
    isToday: isToday(date),
    isSelected: dateFnsIsSameDay(date, currentDate),
    events: [],
  }));
};

export const getDayCalendarDate = (currentDate: Date): CalendarDate => ({
  date: currentDate,
  isCurrentMonth: true,
  isToday: isToday(currentDate),
  isSelected: true,
  events: [],
});

export const navigateDate = (currentDate: Date, direction: 'prev' | 'next', view: 'month' | 'week' | 'day') => {
  switch (view) {
    case 'month':
      return direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1);
    case 'week':
      return direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1);
    case 'day':
      return direction === 'next' ? addDays(currentDate, 1) : subDays(currentDate, 1);
    default:
      return currentDate;
  }
};

export const getDateRangeText = (currentDate: Date, view: 'month' | 'week' | 'day') => {
  switch (view) {
    case 'month':
      return formatDate(currentDate, 'yyyy年MM月');
    case 'week': {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
      return `${formatDate(weekStart, 'MM月dd日')} - ${formatDate(weekEnd, 'MM月dd日')}`;
    }
    case 'day':
      return formatDate(currentDate, 'yyyy年MM月dd日 EEEE');
    default:
      return '';
  }
};

export const isDateInRange = (date: Date, start: Date, end: Date) => {
  const dateTime = date.getTime();
  return dateTime >= start.getTime() && dateTime <= end.getTime();
};

export const getWeekDateRange = (date: Date): Date[] => {
  const startOfWeekDate = startOfWeek(date, { weekStartsOn: 0 }); // 週日開始
  return Array.from({ length: 7 }, (_, i) => addDays(startOfWeekDate, i));
};

export const isSameDay = (date1: Date | string, date2: Date | string): boolean => {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  return formatDate(d1, 'yyyy-MM-dd') === formatDate(d2, 'yyyy-MM-dd');
};

// 重新導出 isToday 函數
export { isToday };

export const getEventDuration = (startDate: Date | string, endDate: Date | string) => {
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
  
  const diffMs = end.getTime() - start.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays >= 1) {
    return `${diffDays}天`;
  } else if (diffHours >= 1) {
    return `${diffHours}小時`;
  } else {
    const diffMinutes = Math.round(diffMs / (1000 * 60));
    return `${diffMinutes}分鐘`;
  }
};

export const combineDateTime = (date: string, time?: string) => {
  if (!time) {
    return parseISO(date);
  }
  
  const [hours, minutes] = time.split(':').map(Number);
  const dateObj = parseISO(date);
  dateObj.setHours(hours, minutes, 0, 0);
  
  return dateObj;
};

export const separateDateTime = (dateTime: Date | string) => {
  const dateObj = typeof dateTime === 'string' ? parseISO(dateTime) : dateTime;
  
  return {
    date: formatDate(dateObj, 'yyyy-MM-dd'),
    time: formatTime(dateObj),
  };
};

export const isAllDayEvent = (startDate: Date | string, endDate: Date | string) => {
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
  
  const startOfDayStart = startOfDay(start);
  const endOfDayEnd = endOfDay(end);
  
  return start.getTime() === startOfDayStart.getTime() && 
         end.getTime() === endOfDayEnd.getTime();
};

export const getWeekdays = () => {
  return ['日', '一', '二', '三', '四', '五', '六'];
};

export const getTodayDateString = () => {
  return formatISO(new Date(), { representation: 'date' });
};

export const formatDateForInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};