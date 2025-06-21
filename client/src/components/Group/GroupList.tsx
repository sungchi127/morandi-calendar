import React from 'react';
import { Users, Calendar, Eye, EyeOff, Lock, MoreVertical } from 'lucide-react';
import { Group } from '@/types';

interface GroupListProps {
  groups: Group[];
  onGroupClick: (group: Group) => void;
  onGroupEdit?: (group: Group) => void;
  onGroupDelete?: (group: Group) => void;
  loading?: boolean;
  emptyMessage?: string;
}

const GroupList: React.FC<GroupListProps> = ({
  groups,
  onGroupClick,
  onGroupEdit,
  onGroupDelete,
  loading = false,
  emptyMessage = '目前沒有團體'
}) => {
  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return <Eye className="w-4 h-4 text-morandi-sage" />;
      case 'private':
        return <EyeOff className="w-4 h-4 text-morandi-grey" />;
      case 'invite_only':
        return <Lock className="w-4 h-4 text-morandi-peach" />;
      default:
        return <EyeOff className="w-4 h-4 text-morandi-grey" />;
    }
  };

  const getVisibilityText = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return '公開';
      case 'private':
        return '私人';
      case 'invite_only':
        return '邀請制';
      default:
        return '私人';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'owner':
        return '創建者';
      case 'admin':
        return '管理員';
      case 'member':
        return '成員';
      case 'viewer':
        return '觀察者';
      default:
        return '成員';
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-morandi-sage/20 text-morandi-sage border-morandi-sage/30';
      case 'admin':
        return 'bg-morandi-peach/20 text-morandi-peach border-morandi-peach/30';
      case 'member':
        return 'bg-morandi-blue/20 text-morandi-blue border-morandi-blue/30';
      case 'viewer':
        return 'bg-morandi-grey/20 text-morandi-grey border-morandi-grey/30';
      default:
        return 'bg-morandi-blue/20 text-morandi-blue border-morandi-blue/30';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="bg-surface border border-border rounded-lg p-4 animate-pulse">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="h-6 bg-surface-alt rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-surface-alt rounded w-1/2 mb-3"></div>
                <div className="flex items-center space-x-4">
                  <div className="h-4 bg-surface-alt rounded w-16"></div>
                  <div className="h-4 bg-surface-alt rounded w-20"></div>
                </div>
              </div>
              <div className="h-8 w-8 bg-surface-alt rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-16 h-16 text-text-disabled mx-auto mb-4" />
        <p className="text-text-secondary text-lg mb-2">{emptyMessage}</p>
        <p className="text-text-disabled text-sm">
          加入或創建團體來開始協作管理行程
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div
          key={group._id}
          className="bg-surface border border-border rounded-lg p-4 hover:bg-surface-alt transition-colors cursor-pointer group"
          onClick={() => onGroupClick(group)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-lg font-semibold text-text-primary truncate">
                  {group.name}
                </h3>
                <div className="flex items-center space-x-1">
                  {getVisibilityIcon(group.visibility)}
                  <span className="text-sm text-text-secondary">
                    {getVisibilityText(group.visibility)}
                  </span>
                </div>
              </div>
              
              {group.description && (
                <p className="text-text-secondary text-sm mb-3 line-clamp-2">
                  {group.description}
                </p>
              )}

              <div className="flex items-center space-x-4 text-sm text-text-secondary">
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{group.statistics.memberCount} 成員</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{group.statistics.eventCount} 活動</span>
                </div>
                {group.userRole && (
                  <span 
                    className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(group.userRole)}`}
                  >
                    {getRoleText(group.userRole)}
                  </span>
                )}
              </div>

              {group.tags && group.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {group.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-morandi-cream/20 text-morandi-cream text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                  {group.tags.length > 3 && (
                    <span className="px-2 py-1 bg-surface-alt text-text-disabled text-xs rounded-full">
                      +{group.tags.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 ml-4">
              {(onGroupEdit || onGroupDelete) && (
                <div className="relative group/menu">
                  <button
                    className="p-1 text-text-secondary hover:text-text-primary opacity-0 group-hover:opacity-100 transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      // 這裡可以實作下拉選單
                    }}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default GroupList;