import React from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Event } from '@/types';
import { 
  formatDate, 
  navigateDate, 
  getWeekDateRange, 
  getWeekdays,
  isSameDay,
  isToday 
} from '@/utils/date';
import { getColorConfig } from '@/utils/colors';
import { motion } from 'framer-motion';

interface WeekViewProps {
  currentDate: Date;
  events: Event[];
  onDateSelect: (date: Date) => void;
  onEventClick: (event: Event) => void;
  onEventCreate: (date: Date) => void;
  onNavigate: (date: Date) => void;
}

const WeekView: React.FC<WeekViewProps> = ({
  currentDate,
  events,
  onDateSelect,
  onEventClick,
  onEventCreate,
  onNavigate,
}) => {
  const weekDates = getWeekDateRange(currentDate);
  const weekdays = getWeekdays();
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getEventsForDateTime = (date: Date, hour: number): Event[] => {
    return events.filter(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      
      // 檢查是否在同一天
      if (!isSameDay(eventStart, date)) {
        return false;
      }
      
      const eventStartHour = eventStart.getHours();
      const eventEndHour = eventEnd.getHours();
      
      // 全天活動顯示在第一個時段
      if (event.isAllDay && hour === 0) {
        return true;
      }
      
      // 檢查時間是否在事件時間範圍內
      return !event.isAllDay && hour >= eventStartHour && hour < eventEndHour;
    });
  };

  const handlePrevWeek = () => {
    onNavigate(navigateDate(currentDate, 'prev', 'week'));
  };

  const handleNextWeek = () => {
    onNavigate(navigateDate(currentDate, 'next', 'week'));
  };

  const handleToday = () => {
    onNavigate(new Date());
  };

  const getWeekRangeText = () => {
    const startDate = weekDates[0];
    const endDate = weekDates[6];
    
    if (startDate.getMonth() === endDate.getMonth()) {
      return `${startDate.getFullYear()}年${startDate.getMonth() + 1}月${startDate.getDate()}-${endDate.getDate()}日`;
    } else {
      return `${formatDate(startDate, 'yyyy年MM月dd日')} - ${formatDate(endDate, 'yyyy年MM月dd日')}`;
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-semibold text-text-primary">
            {getWeekRangeText()}
          </h1>
          <button
            onClick={handleToday}
            className="px-3 py-1 text-sm text-morandi-sage-dark bg-morandi-sage-light rounded-md hover:bg-morandi-sage transition-colors"
          >
            本週
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrevWeek}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-alt rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNextWeek}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-alt rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Week Grid */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-full">
          {/* Week Header */}
          <div className="sticky top-0 bg-surface border-b border-border z-10">
            <div className="grid grid-cols-8 divide-x divide-border">
              {/* Time column header */}
              <div className="p-3 text-center text-sm font-medium text-text-secondary bg-surface-alt">
                時間
              </div>
              
              {/* Date headers */}
              {weekDates.map((date, index) => {
                const isCurrentDay = isToday(date);
                return (
                  <div 
                    key={date.toISOString()}
                    className="p-3 text-center bg-surface-alt"
                  >
                    <div className="text-sm font-medium text-text-secondary">
                      {weekdays[index]}
                    </div>
                    <div className={`
                      text-lg font-semibold mt-1
                      ${isCurrentDay 
                        ? 'w-8 h-8 bg-morandi-sage text-white rounded-full flex items-center justify-center mx-auto' 
                        : 'text-text-primary'
                      }
                    `}>
                      {date.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Time slots */}
          <div className="divide-y divide-border">
            {hours.map((hour) => (
              <div key={hour} className="grid grid-cols-8 divide-x divide-border min-h-[60px]">
                {/* Time label */}
                <div className="p-2 text-xs text-text-secondary bg-surface-alt flex items-start justify-center">
                  {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                </div>
                
                {/* Day columns */}
                {weekDates.map((date) => {
                  const dayEvents = getEventsForDateTime(date, hour);
                  
                  return (
                    <div 
                      key={`${date.toISOString()}-${hour}`}
                      className="relative p-1 hover:bg-morandi-cream-light transition-colors cursor-pointer group"
                      onClick={() => {
                        const selectedDateTime = new Date(date);
                        selectedDateTime.setHours(hour, 0, 0, 0);
                        onDateSelect(selectedDateTime);
                      }}
                    >
                      {/* Add event button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const selectedDateTime = new Date(date);
                          selectedDateTime.setHours(hour, 0, 0, 0);
                          onEventCreate(selectedDateTime);
                        }}
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-morandi-sage hover:bg-morandi-sage-light rounded transition-all z-10"
                        title={`新增活動 - ${formatDate(date, 'MM月dd日')} ${hour}:00`}
                      >
                        <Plus className="w-3 h-3" />
                      </button>

                      {/* Events */}
                      <div className="space-y-1 relative z-0">
                        {dayEvents.map((event) => {
                          const colorConfig = getColorConfig(event.color);
                          const eventStart = new Date(event.startDate);
                          const eventEnd = new Date(event.endDate);
                          
                          // 計算事件高度（基於持續時間）
                          let height = '100%';
                          if (!event.isAllDay && isSameDay(eventStart, eventEnd)) {
                            const duration = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60 * 60);
                            height = `${Math.max(duration * 60, 20)}px`;
                          }
                          
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
                                text-xs rounded cursor-pointer p-1 overflow-hidden
                                ${colorConfig.bg} border-l-2 border-opacity-70
                              `}
                              style={{ 
                                color: '#1f2937',
                                height,
                                borderLeftColor: colorConfig.primary 
                              }}
                              title={`${event.title}${event.location ? ` - ${event.location}` : ''}`}
                            >
                              <div className="font-medium truncate">
                                {event.title}
                              </div>
                              {event.location && (
                                <div className="text-xs opacity-75 truncate">
                                  {event.location}
                                </div>
                              )}
                              {event.isAllDay && (
                                <div className="text-xs opacity-75">
                                  全天
                                </div>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeekView;