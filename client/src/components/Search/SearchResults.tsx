import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { Event } from '@/types';
import { getColorConfig } from '@/utils/colors';
import { formatDateTime } from '@/utils/date';

interface SearchResultsProps {
  events: Event[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  isLoading: boolean;
  onEventClick: (event: Event) => void;
  onPageChange?: (page: number) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  events,
  pagination,
  isLoading,
  onEventClick,
  onPageChange
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-morandi-sage border-t-transparent rounded-full animate-spin"></div>
          <span className="text-text-secondary">搜尋中...</span>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-16 h-16 text-text-muted mx-auto mb-4" />
        <h3 className="text-lg font-medium text-text-primary mb-2">沒有找到活動</h3>
        <p className="text-text-secondary">
          請嘗試調整搜尋條件或篩選設定
        </p>
      </div>
    );
  }

  const getCategoryText = (category: string) => {
    const categoryMap = {
      work: '工作',
      personal: '個人',
      friends: '朋友',
      family: '家庭',
      health: '健康',
      other: '其他'
    };
    return categoryMap[category as keyof typeof categoryMap] || category;
  };

  return (
    <div className="space-y-6">
      {/* 搜尋結果統計 */}
      {pagination && (
        <div className="flex items-center justify-between text-sm text-text-secondary">
          <span>
            找到 {pagination.total} 個活動
            {pagination.pages > 1 && (
              <span>，第 {pagination.page} 頁，共 {pagination.pages} 頁</span>
            )}
          </span>
        </div>
      )}

      {/* 活動列表 */}
      <div className="space-y-4">
        {events.map((event, index) => {
          const colorConfig = getColorConfig(event.color);
          
          return (
            <motion.div
              key={event._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onEventClick(event)}
              className="bg-surface border border-border rounded-lg p-4 hover:border-morandi-sage hover:shadow-sm transition-all cursor-pointer"
            >
              <div className="flex items-start space-x-4">
                {/* 顏色指示器 */}
                <div 
                  className={`w-1 h-16 rounded-full ${colorConfig.bg} flex-shrink-0`}
                ></div>

                {/* 活動資訊 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-text-primary truncate">
                        {event.title}
                      </h3>
                      {event.description && (
                        <p className="text-text-secondary text-sm mt-1 line-clamp-2">
                          {event.description}
                        </p>
                      )}
                    </div>

                    {/* 分類標籤 */}
                    <span className={`
                      px-2 py-1 text-xs rounded-md ml-2 flex-shrink-0
                      ${colorConfig.bgLight} ${colorConfig.text}
                    `}>
                      {getCategoryText(event.category)}
                    </span>
                  </div>

                  {/* 活動詳情 */}
                  <div className="mt-3 space-y-1">
                    {/* 時間 */}
                    <div className="flex items-center space-x-2 text-sm text-text-secondary">
                      <Clock className="w-4 h-4" />
                      <span>
                        {formatDateTime(event.startDate)} - {formatDateTime(event.endDate)}
                      </span>
                    </div>

                    {/* 地點 */}
                    {event.location && (
                      <div className="flex items-center space-x-2 text-sm text-text-secondary">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}

                    {/* 創建者 */}
                    <div className="flex items-center space-x-2 text-sm text-text-secondary">
                      <User className="w-4 h-4" />
                      <span>{event.creator.displayName}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 分頁控制 */}
      {pagination && pagination.pages > 1 && onPageChange && (
        <div className="flex items-center justify-center space-x-2 pt-6">
          <button
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="flex items-center space-x-1 px-3 py-2 text-sm text-text-secondary hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>上一頁</span>
          </button>

          <div className="flex space-x-1">
            {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
              let pageNum;
              if (pagination.pages <= 5) {
                pageNum = i + 1;
              } else if (pagination.page <= 3) {
                pageNum = i + 1;
              } else if (pagination.page >= pagination.pages - 2) {
                pageNum = pagination.pages - 4 + i;
              } else {
                pageNum = pagination.page - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`
                    w-8 h-8 text-sm rounded transition-colors
                    ${pagination.page === pageNum
                      ? 'bg-morandi-sage text-white'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-alt'
                    }
                  `}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.pages}
            className="flex items-center space-x-1 px-3 py-2 text-sm text-text-secondary hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>下一頁</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchResults;