import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { eventAPI } from '@/services/api';
import { Event } from '@/types';
import SearchBar from '@/components/Search/SearchBar';
import SearchResults from '@/components/Search/SearchResults';
import EventDetailModal from '@/components/Event/EventDetailModal';

interface SearchFilters {
  query: string;
  category: string;
  color: string;
  startDate: string;
  endDate: string;
}

interface SearchPageProps {
  onBack: () => void;
  onEventEdit: (event: Event) => void;
  onEventDelete: (eventId: string) => void;
  isOwner: (event: Event) => boolean;
}

const SearchPage: React.FC<SearchPageProps> = ({
  onBack,
  onEventEdit,
  onEventDelete,
  isOwner
}) => {
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query: '',
    category: 'all',
    color: 'all',
    startDate: '',
    endDate: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEventDetailModalOpen, setIsEventDetailModalOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // 搜尋查詢
  const { data: searchData, isLoading, refetch } = useQuery({
    queryKey: ['searchEvents', searchFilters, currentPage],
    queryFn: () => {
      const params: any = {
        page: currentPage,
        limit: 10
      };

      if (searchFilters.query.trim()) {
        params.q = searchFilters.query.trim();
      }
      if (searchFilters.category !== 'all') {
        params.category = searchFilters.category;
      }
      if (searchFilters.color !== 'all') {
        params.color = searchFilters.color;
      }
      if (searchFilters.startDate) {
        params.startDate = searchFilters.startDate;
      }
      if (searchFilters.endDate) {
        params.endDate = searchFilters.endDate;
      }

      return eventAPI.searchEvents(params);
    },
    enabled: hasSearched
  });

  const handleSearch = (filters: SearchFilters) => {
    setSearchFilters(filters);
    setCurrentPage(1);
    setHasSearched(true);
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setIsEventDetailModalOpen(true);
  };

  const handleEventEdit = (event: Event) => {
    setIsEventDetailModalOpen(false);
    onEventEdit(event);
  };

  const handleEventDelete = async (eventId: string) => {
    await onEventDelete(eventId);
    setIsEventDetailModalOpen(false);
    refetch(); // 重新搜尋以更新結果
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="bg-surface border-b border-border px-6 py-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-alt rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-semibold text-text-primary">
            搜尋活動
          </h1>
        </div>
      </header>

      {/* Search Bar */}
      <div className="bg-surface border-b border-border px-6 py-4">
        <SearchBar onSearch={handleSearch} isLoading={isLoading} />
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-6 py-6">
        {!hasSearched ? (
          // 初始狀態
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-24 h-24 bg-morandi-sage-light rounded-full flex items-center justify-center mb-6">
              <ArrowLeft className="w-8 h-8 text-morandi-sage rotate-45" />
            </div>
            <h2 className="text-2xl font-semibold text-text-primary mb-2">
              搜尋你的活動
            </h2>
            <p className="text-text-secondary max-w-md">
              使用上方的搜尋列查找活動，支持文字搜尋、分類篩選、顏色篩選和日期範圍搜尋
            </p>
          </div>
        ) : (
          // 搜尋結果
          <SearchResults
            events={searchData?.data.events || []}
            pagination={searchData?.data.pagination}
            isLoading={isLoading}
            onEventClick={handleEventClick}
            onPageChange={handlePageChange}
          />
        )}
      </main>

      {/* Event Detail Modal */}
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
    </div>
  );
};

export default SearchPage;