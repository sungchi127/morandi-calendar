import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Users } from 'lucide-react';
import { Event } from '@/types';
import { formatDate, getMonthCalendarDates, navigateDate, getDateRangeText, getWeekdays } from '@/utils/date';
import { getColorConfig } from '@/utils/colors';
import { motion, AnimatePresence } from 'framer-motion';

interface MonthViewProps {
  currentDate: Date;
  events: Event[];
  onDateSelect: (date: Date) => void;
  onEventClick: (event: Event) => void;
  onEventCreate: (date: Date) => void;
  onNavigate: (date: Date) => void;
}

const MonthView: React.FC<MonthViewProps> = ({
  currentDate,
  events,
  onDateSelect,
  onEventClick,
  onEventCreate,
  onNavigate,
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const calendarDates = getMonthCalendarDates(currentDate);
  const weekdays = getWeekdays();

  // 點擊外部關閉日期選擇器
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    };

    if (showDatePicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDatePicker]);

  const getEventsForDate = (date: Date): Event[] => {
    return events.filter(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      const dateStart = new Date(date);
      dateStart.setHours(0, 0, 0, 0);
      const dateEnd = new Date(date);
      dateEnd.setHours(23, 59, 59, 999);
      
      return (
        (eventStart >= dateStart && eventStart <= dateEnd) ||
        (eventEnd >= dateStart && eventEnd <= dateEnd) ||
        (eventStart <= dateStart && eventEnd >= dateEnd)
      );
    });
  };

  const handlePrevMonth = () => {
    onNavigate(navigateDate(currentDate, 'prev', 'month'));
  };

  const handleNextMonth = () => {
    onNavigate(navigateDate(currentDate, 'next', 'month'));
  };

  const handleToday = () => {
    onNavigate(new Date());
  };

  const handleDatePickerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = new Date(event.target.value);
    onNavigate(selectedDate);
    setShowDatePicker(false);
  };

  const getCurrentDateString = () => {
    const today = new Date();
    return formatDate(today, 'yyyy年MM月dd日 (EEEE)');
  };

  const getYearMonthValue = () => {
    return formatDate(currentDate, 'yyyy-MM');
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-4">
            <div className="relative" ref={datePickerRef}>
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="flex items-center space-x-2 text-2xl font-semibold text-text-primary hover:text-morandi-sage transition-colors"
              >
                <span>{getDateRangeText(currentDate, 'month')}</span>
                <CalendarIcon className="w-5 h-5" />
              </button>
              
              {/* Date Picker Dropdown */}
              {showDatePicker && (
                <div className="absolute top-full left-0 mt-2 bg-surface border border-border rounded-lg shadow-lg z-10 p-3 min-w-[200px]">
                  <div className="text-sm text-text-secondary mb-2">選擇年月</div>
                  <input
                    type="month"
                    value={getYearMonthValue()}
                    onChange={handleDatePickerChange}
                    className="w-full p-2 border border-border rounded text-text-primary bg-surface focus:outline-none focus:ring-2 focus:ring-morandi-sage"
                  />
                </div>
              )}
            </div>
            
            <button
              onClick={handleToday}
              className="px-3 py-1 text-sm text-morandi-sage-dark bg-morandi-sage-light rounded-md hover:bg-morandi-sage hover:text-white transition-colors"
            >
              今天
            </button>
          </div>
          
          {/* Current Date Display */}
          <div className="text-sm text-text-secondary">
            今天：{getCurrentDateString()}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-alt rounded-lg transition-colors"
            title="上個月"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-alt rounded-lg transition-colors"
            title="下個月"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 p-6">
        <div className="h-full border border-border rounded-lg overflow-hidden bg-surface">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 border-b border-border">
            {weekdays.map((day) => (
              <div
                key={day}
                className="p-3 text-center text-sm font-medium text-text-secondary bg-surface-alt"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Dates */}
          <div className="grid grid-cols-7" style={{ gridAutoRows: '1fr' }}>
            <AnimatePresence mode="wait">
              {calendarDates.map((calendarDate, index) => {
                const dateEvents = getEventsForDate(calendarDate.date);
                const isToday = calendarDate.isToday;
                const isCurrentMonth = calendarDate.isCurrentMonth;

                return (
                  <motion.div
                    key={`${formatDate(calendarDate.date)}-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2, delay: index * 0.01 }}
                    className={`
                      min-h-[120px] p-2 border-r border-b border-border cursor-pointer group
                      hover:bg-morandi-cream-light transition-colors
                      ${!isCurrentMonth ? 'bg-surface-alt' : 'bg-surface'}
                    `}
                    onClick={() => onDateSelect(calendarDate.date)}
                  >
                    {/* Date Number */}
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`
                          text-sm font-medium
                          ${isToday 
                            ? 'w-6 h-6 bg-morandi-sage text-white rounded-full flex items-center justify-center' 
                            : isCurrentMonth 
                              ? 'text-text-primary' 
                              : 'text-text-muted'
                          }
                        `}
                      >
                        {calendarDate.date.getDate()}
                      </span>
                      
                      {isCurrentMonth && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventCreate(calendarDate.date);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-morandi-sage hover:bg-morandi-sage-light rounded transition-all"
                          title={`新增活動 - ${formatDate(calendarDate.date, 'MM月dd日')}`}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Events */}
                    <div className="space-y-1">
                      {dateEvents.slice(0, 3).map((event) => {
                        const colorConfig = getColorConfig(event.color);
                        const isGroupEvent = event.group && event.privacy === 'group_only';
                        
                        return (
                          <motion.div
                            key={event._id}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ scale: 1.02 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onEventClick(event);
                            }}
                            className={`
                              px-2 py-1 text-xs rounded cursor-pointer 
                              ${colorConfig.bg}
                              hover:shadow-sm transition-all
                              truncate flex items-center space-x-1
                              ${isGroupEvent ? 'border-l-2 border-morandi-sage' : ''}
                            `}
                            style={{ color: '#1f2937' }}
                            title={isGroupEvent ? `[團體] ${event.title}` : event.title}
                          >
                            {isGroupEvent && (
                              <Users className="w-3 h-3 text-morandi-sage flex-shrink-0" />
                            )}
                            <span className="truncate">{event.title}</span>
                          </motion.div>
                        );
                      })}
                      
                      {dateEvents.length > 3 && (
                        <div className="text-xs text-text-muted px-2">
                          +{dateEvents.length - 3} 更多
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthView;