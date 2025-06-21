import React from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Event } from '@/types';
import { 
  formatDate, 
  navigateDate, 
  isSameDay,
  isToday,
  formatTime 
} from '@/utils/date';
import { getColorConfig } from '@/utils/colors';
import { motion } from 'framer-motion';

interface DayViewProps {
  currentDate: Date;
  events: Event[];
  onDateSelect: (date: Date) => void;
  onEventClick: (event: Event) => void;
  onEventCreate: (date: Date) => void;
  onNavigate: (date: Date) => void;
}

const DayView: React.FC<DayViewProps> = ({
  currentDate,
  events,
  onDateSelect,
  onEventClick,
  onEventCreate,
  onNavigate,
}) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getEventsForHour = (hour: number): Event[] => {
    return events.filter(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      
      // 檢查是否在同一天
      if (!isSameDay(eventStart, currentDate)) {
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

  const getAllDayEvents = (): Event[] => {
    return events.filter(event => 
      event.isAllDay && isSameDay(new Date(event.startDate), currentDate)
    );
  };

  const handlePrevDay = () => {
    onNavigate(navigateDate(currentDate, 'prev', 'day'));
  };

  const handleNextDay = () => {
    onNavigate(navigateDate(currentDate, 'next', 'day'));
  };

  const handleToday = () => {
    onNavigate(new Date());
  };

  const getCurrentDayText = () => {
    const today = new Date();
    if (isSameDay(currentDate, today)) {
      return `今天 - ${formatDate(currentDate, 'yyyy年MM月dd日 EEEE')}`;
    }
    return formatDate(currentDate, 'yyyy年MM月dd日 EEEE');
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-semibold text-text-primary">
            {getCurrentDayText()}
          </h1>
          <button
            onClick={handleToday}
            className="px-3 py-1 text-sm text-morandi-sage-dark bg-morandi-sage-light rounded-md hover:bg-morandi-sage transition-colors"
          >
            今天
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrevDay}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-alt rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNextDay}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-alt rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* All Day Events Section */}
      {getAllDayEvents().length > 0 && (
        <div className="bg-surface border-b border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-2">全天活動</h3>
          <div className="space-y-2">
            {getAllDayEvents().map((event) => {
              const colorConfig = getColorConfig(event.color);
              return (
                <motion.div
                  key={event._id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => onEventClick(event)}
                  className={`
                    p-3 rounded-lg cursor-pointer border-l-4 transition-all hover:shadow-sm
                    ${colorConfig.bg}
                  `}
                  style={{ 
                    color: '#1f2937',
                    borderLeftColor: colorConfig.primary 
                  }}
                >
                  <div className="font-medium">{event.title}</div>
                  {event.description && (
                    <div className="text-sm opacity-75 mt-1">{event.description}</div>
                  )}
                  {event.location && (
                    <div className="text-sm opacity-75 mt-1">📍 {event.location}</div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Day Schedule */}
      <div className="flex-1 overflow-auto">
        <div className="divide-y divide-border">
          {hours.map((hour) => {
            const hourEvents = getEventsForHour(hour);
            const isCurrentHour = isToday(currentDate) && new Date().getHours() === hour;
            
            return (
              <div key={hour} className={`
                flex min-h-[80px] border-border relative
                ${isCurrentHour ? 'bg-morandi-cream-light' : ''}
              `}>
                {/* Time label */}
                <div className="w-20 p-3 text-sm text-text-secondary bg-surface-alt border-r border-border flex-shrink-0">
                  <div className={`${isCurrentHour ? 'text-morandi-sage font-medium' : ''}`}>
                    {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                  </div>
                </div>
                
                {/* Event area */}
                <div className="flex-1 relative">
                  <div 
                    className="h-full w-full hover:bg-morandi-cream-light transition-colors cursor-pointer group p-2"
                    onClick={() => {
                      const selectedDateTime = new Date(currentDate);
                      selectedDateTime.setHours(hour, 0, 0, 0);
                      onDateSelect(selectedDateTime);
                    }}
                  >
                    {/* Add event button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const selectedDateTime = new Date(currentDate);
                        selectedDateTime.setHours(hour, 0, 0, 0);
                        onEventCreate(selectedDateTime);
                      }}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-2 text-text-muted hover:text-morandi-sage hover:bg-morandi-sage-light rounded transition-all z-10"
                      title={`新增活動 - ${hour}:00`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>

                    {/* Current time indicator */}
                    {isCurrentHour && isToday(currentDate) && (
                      <div 
                        className="absolute left-0 right-0 border-t-2 border-morandi-rose z-20"
                        style={{
                          top: `${(new Date().getMinutes() / 60) * 100}%`
                        }}
                      >
                        <div className="w-3 h-3 bg-morandi-rose rounded-full -mt-1.5 -ml-1.5"></div>
                      </div>
                    )}

                    {/* Events */}
                    <div className="space-y-2 relative z-0">
                      {hourEvents.map((event) => {
                        const colorConfig = getColorConfig(event.color);
                        const eventStart = new Date(event.startDate);
                        const eventEnd = new Date(event.endDate);
                        
                        // 計算事件的位置和高度
                        const startMinutes = eventStart.getMinutes();
                        const duration = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60);
                        const height = Math.max((duration / 60) * 80, 30); // 最小30px高度
                        const top = (startMinutes / 60) * 80;
                        
                        return (
                          <motion.div
                            key={event._id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ scale: 1.02 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onEventClick(event);
                            }}
                            className={`
                              absolute left-0 right-2 p-2 rounded cursor-pointer border-l-4 shadow-sm
                              ${colorConfig.bg}
                            `}
                            style={{ 
                              color: '#1f2937',
                              height: `${height}px`,
                              top: `${top}px`,
                              borderLeftColor: colorConfig.primary 
                            }}
                          >
                            <div className="font-medium text-sm truncate">
                              {event.title}
                            </div>
                            <div className="text-xs opacity-75">
                              {formatTime(eventStart)} - {formatTime(eventEnd)}
                            </div>
                            {event.location && (
                              <div className="text-xs opacity-75 truncate">
                                📍 {event.location}
                              </div>
                            )}
                            {event.description && duration >= 60 && (
                              <div className="text-xs opacity-75 mt-1 line-clamp-2">
                                {event.description}
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DayView;