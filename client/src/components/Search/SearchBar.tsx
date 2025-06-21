import React, { useState, useRef, useEffect } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getColorOptions } from '@/utils/colors';
import { EventCategory, MorandiColor } from '@/types';

interface SearchFilters {
  query: string;
  category: EventCategory | 'all';
  color: MorandiColor | 'all';
  startDate: string;
  endDate: string;
}

interface SearchBarProps {
  onSearch: (filters: SearchFilters) => void;
  isLoading?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading = false }) => {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    category: 'all',
    color: 'all',
    startDate: '',
    endDate: ''
  });
  
  const filterRef = useRef<HTMLDivElement>(null);

  const categories = [
    { value: 'all', label: '全部分類' },
    { value: 'work', label: '工作' },
    { value: 'personal', label: '個人' },
    { value: 'friends', label: '朋友' },
    { value: 'family', label: '家庭' },
    { value: 'health', label: '健康' },
    { value: 'other', label: '其他' }
  ];

  const colors = [
    { value: 'all', label: '全部顏色', color: '#666' },
    ...getColorOptions()
  ];

  // 點擊外部關閉篩選器
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    };

    if (showFilters) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilters]);

  const handleSearch = () => {
    const searchFilters = {
      ...filters,
      query: query.trim()
    };
    onSearch(searchFilters);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearFilters = () => {
    const clearedFilters = {
      query: '',
      category: 'all' as const,
      color: 'all' as const,
      startDate: '',
      endDate: ''
    };
    setQuery('');
    setFilters(clearedFilters);
    onSearch(clearedFilters);
  };

  const hasActiveFilters = filters.category !== 'all' || 
                          filters.color !== 'all' || 
                          filters.startDate || 
                          filters.endDate ||
                          query.trim();

  return (
    <div className="relative" ref={filterRef}>
      {/* 搜尋輸入框 */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-text-secondary" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="搜尋活動標題、描述或地點..."
            className="block w-full pl-10 pr-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-morandi-sage focus:border-transparent bg-surface text-text-primary placeholder-text-secondary"
          />
        </div>

        {/* 篩選按鈕 */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`
            flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors
            ${hasActiveFilters 
              ? 'border-morandi-sage bg-morandi-sage text-white' 
              : 'border-border bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-alt'
            }
          `}
        >
          <Filter className="w-4 h-4" />
          <span className="text-sm">篩選</span>
          {hasActiveFilters && (
            <div className="w-2 h-2 bg-white rounded-full"></div>
          )}
        </button>

        {/* 搜尋按鈕 */}
        <button
          onClick={handleSearch}
          disabled={isLoading}
          className="px-4 py-2 bg-morandi-sage text-white rounded-lg hover:bg-morandi-sage-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            '搜尋'
          )}
        </button>

        {/* 清除按鈕 */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="p-2 text-text-secondary hover:text-error hover:bg-error/10 rounded-lg transition-colors"
            title="清除篩選"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 篩選面板 */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border rounded-lg shadow-lg z-20 p-4"
          >
            <div className="space-y-4">
              {/* 分類篩選 */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  分類
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value as EventCategory | 'all' })}
                  className="w-full p-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-morandi-sage bg-surface text-text-primary"
                >
                  {categories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 顏色篩選 */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  顏色
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {colors.map((colorOption) => (
                    <button
                      key={colorOption.value}
                      onClick={() => setFilters({ ...filters, color: colorOption.value as MorandiColor | 'all' })}
                      className={`
                        flex items-center space-x-2 p-2 rounded border transition-colors text-sm
                        ${filters.color === colorOption.value
                          ? 'border-morandi-sage bg-morandi-sage-light'
                          : 'border-border hover:bg-surface-alt'
                        }
                      `}
                    >
                      <div 
                        className="w-4 h-4 rounded-full border border-border"
                        style={{ backgroundColor: colorOption.color }}
                      ></div>
                      <span className="text-text-primary truncate">
                        {colorOption.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 日期範圍 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    開始日期
                  </label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                    className="w-full p-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-morandi-sage bg-surface text-text-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    結束日期
                  </label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                    className="w-full p-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-morandi-sage bg-surface text-text-primary"
                  />
                </div>
              </div>

              {/* 篩選操作按鈕 */}
              <div className="flex justify-end space-x-2 pt-2 border-t border-border">
                <button
                  onClick={clearFilters}
                  className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
                >
                  清除
                </button>
                <button
                  onClick={() => {
                    handleSearch();
                    setShowFilters(false);
                  }}
                  className="px-4 py-1.5 text-sm bg-morandi-sage text-white rounded hover:bg-morandi-sage-dark transition-colors"
                >
                  套用篩選
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchBar;