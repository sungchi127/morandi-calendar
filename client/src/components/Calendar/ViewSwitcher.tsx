import React from 'react';
import { Calendar, Grid3X3, List } from 'lucide-react';

export type CalendarViewType = 'month' | 'week' | 'day';

interface ViewSwitcherProps {
  currentView: CalendarViewType;
  onViewChange: (view: CalendarViewType) => void;
}

const ViewSwitcher: React.FC<ViewSwitcherProps> = ({
  currentView,
  onViewChange,
}) => {
  const views = [
    {
      id: 'month' as CalendarViewType,
      label: '月',
      icon: Calendar,
      description: '月視圖'
    },
    {
      id: 'week' as CalendarViewType,
      label: '週',
      icon: Grid3X3,
      description: '週視圖'
    },
    {
      id: 'day' as CalendarViewType,
      label: '日',
      icon: List,
      description: '日視圖'
    }
  ];

  return (
    <div className="flex items-center bg-surface-alt rounded-lg p-1">
      {views.map((view) => {
        const Icon = view.icon;
        const isActive = currentView === view.id;
        
        return (
          <button
            key={view.id}
            onClick={() => onViewChange(view.id)}
            className={`
              flex items-center space-x-2 px-3 py-2 rounded transition-all text-sm font-medium
              ${isActive
                ? 'bg-morandi-sage text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface'
              }
            `}
            title={view.description}
          >
            <Icon className="w-4 h-4" />
            <span>{view.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ViewSwitcher;