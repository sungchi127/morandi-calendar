import React, { useState } from 'react';
import { 
  Users, Calendar, Edit, Trash2, UserPlus, Copy, 
  Crown, Shield, User, MoreVertical, ExternalLink, LogOut
} from 'lucide-react';
import { Group } from '@/types';
import toast from 'react-hot-toast';

interface GroupDetailProps {
  group: Group;
  onEdit?: () => void;
  onDelete?: () => void;
  onInviteMembers?: () => void;
  onLeaveGroup?: () => void;
  onMemberRoleUpdate?: (memberId: string, role: string) => void;
  onMemberRemove?: (memberId: string) => void;
}

const GroupDetail: React.FC<GroupDetailProps> = ({
  group,
  onEdit,
  onDelete,
  onInviteMembers,
  onLeaveGroup,
  onMemberRoleUpdate,
  onMemberRemove,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'members' | 'events'>('info');
  const [showMemberMenu, setShowMemberMenu] = useState<string | null>(null);

  const copyInviteCode = () => {
    if (group.inviteCode) {
      navigator.clipboard.writeText(group.inviteCode);
      toast.success('邀請碼已複製到剪貼簿');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-morandi-sage" />;
      case 'admin':
        return <Shield className="w-4 h-4 text-morandi-peach" />;
      default:
        return <User className="w-4 h-4 text-morandi-blue" />;
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

  const canManageMembers = group.userRole === 'owner' || group.userRole === 'admin';
  const canEditGroup = group.userRole === 'owner' || group.userRole === 'admin';
  const canDeleteGroup = group.userRole === 'owner';
  const canLeaveGroup = group.userRole !== 'owner';

  const handleMemberAction = (memberId: string, action: 'changeRole' | 'remove', newRole?: string) => {
    if (action === 'changeRole' && newRole && onMemberRoleUpdate) {
      onMemberRoleUpdate(memberId, newRole);
    } else if (action === 'remove' && onMemberRemove) {
      onMemberRemove(memberId);
    }
    setShowMemberMenu(null);
  };

  return (
    <div className="bg-surface rounded-lg shadow-sm">
      {/* 標題區域 */}
      <div className="p-6 border-b border-border">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-2xl font-bold text-text-primary">{group.name}</h1>
              <span className="px-2 py-1 bg-morandi-sage/20 text-morandi-sage text-sm rounded-full">
                {group.visibility === 'public' ? '公開' : group.visibility === 'private' ? '私人' : '邀請制'}
              </span>
              {group.userRole && (
                <span className="px-2 py-1 bg-morandi-blue/20 text-morandi-blue text-sm rounded-full flex items-center space-x-1">
                  {getRoleIcon(group.userRole)}
                  <span>{getRoleText(group.userRole)}</span>
                </span>
              )}
            </div>
            
            {group.description && (
              <p className="text-text-secondary mb-4">{group.description}</p>
            )}

            <div className="flex items-center space-x-6 text-sm text-text-secondary">
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>{group.statistics.memberCount} 成員</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>{group.statistics.eventCount} 活動</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>創建於 {new Date(group.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {group.tags && group.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {group.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-morandi-cream/20 text-morandi-cream text-sm rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2 ml-4">
            {canEditGroup && onEdit && (
              <button
                onClick={onEdit}
                className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-alt rounded-lg transition-colors"
                title="編輯團體"
              >
                <Edit className="w-5 h-5" />
              </button>
            )}
            
            {canManageMembers && onInviteMembers && (
              <button
                onClick={onInviteMembers}
                className="flex items-center space-x-2 px-3 py-2 bg-morandi-sage text-white rounded-lg hover:bg-morandi-sage-dark transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>邀請成員</span>
              </button>
            )}

            <div className="relative">
              <button
                className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-alt rounded-lg transition-colors"
                onClick={() => setShowMemberMenu(showMemberMenu ? null : 'group-menu')}
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              
              {showMemberMenu === 'group-menu' && (
                <div className="absolute right-0 top-10 bg-surface border border-border rounded-lg shadow-lg py-1 z-10 min-w-[160px]">
                  {canLeaveGroup && onLeaveGroup && (
                    <button
                      onClick={() => {
                        onLeaveGroup();
                        setShowMemberMenu(null);
                      }}
                      className="w-full px-4 py-2 text-left text-text-secondary hover:text-error hover:bg-error/10 transition-colors flex items-center space-x-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>離開團體</span>
                    </button>
                  )}
                  
                  {canDeleteGroup && onDelete && (
                    <button
                      onClick={() => {
                        onDelete();
                        setShowMemberMenu(null);
                      }}
                      className="w-full px-4 py-2 text-left text-error hover:bg-error/10 transition-colors flex items-center space-x-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>刪除團體</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 邀請碼 */}
        {group.visibility === 'invite_only' && group.inviteCode && (
          <div className="mt-4 p-3 bg-morandi-peach/10 border border-morandi-peach/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-text-primary">邀請碼</div>
                <div className="text-morandi-peach font-mono text-lg">{group.inviteCode}</div>
              </div>
              <button
                onClick={copyInviteCode}
                className="p-2 text-morandi-peach hover:bg-morandi-peach/10 rounded-lg transition-colors"
                title="複製邀請碼"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 分頁導航 */}
      <div className="border-b border-border">
        <nav className="flex space-x-8 px-6">
          {['info', 'members', 'events'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab
                  ? 'border-morandi-sage text-morandi-sage'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
              }`}
            >
              {tab === 'info' && '團體資訊'}
              {tab === 'members' && '成員管理'}
              {tab === 'events' && '團體活動'}
            </button>
          ))}
        </nav>
      </div>

      {/* 分頁內容 */}
      <div className="p-6">
        {activeTab === 'info' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-4">團體設定</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-background border border-border rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-text-primary">允許成員創建活動</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      group.settings.allowMembersCreateEvents 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {group.settings.allowMembersCreateEvents ? '允許' : '禁止'}
                    </span>
                  </div>
                </div>
                
                <div className="p-4 bg-background border border-border rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-text-primary">活動需要審核</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      group.settings.requireEventApproval 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {group.settings.requireEventApproval ? '需要' : '不需要'}
                    </span>
                  </div>
                </div>
                
                <div className="p-4 bg-background border border-border rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-text-primary">允許成員邀請他人</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      group.settings.allowMembersInvite 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {group.settings.allowMembersInvite ? '允許' : '禁止'}
                    </span>
                  </div>
                </div>
                
                <div className="p-4 bg-background border border-border rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-text-primary">預設活動隱私</span>
                    <span className="px-2 py-1 bg-morandi-blue/20 text-morandi-blue text-xs rounded-full">
                      {group.settings.defaultEventPrivacy === 'group_only' ? '僅團體' : 
                       group.settings.defaultEventPrivacy === 'public' ? '公開' : '私人'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-text-primary">成員列表</h3>
              <span className="text-text-secondary">{group.members?.length || 0} 名成員</span>
            </div>
            
            <div className="space-y-3">
              {group.members?.map((member) => (
                <div
                  key={member._id}
                  className="flex items-center justify-between p-4 bg-background border border-border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-morandi-sage/20 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-morandi-sage" />
                    </div>
                    <div>
                      <div className="font-medium text-text-primary">{member.user.displayName}</div>
                      <div className="text-sm text-text-secondary">{member.user.email}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center space-x-1 px-2 py-1 bg-morandi-blue/20 text-morandi-blue text-sm rounded-full">
                      {getRoleIcon(member.role)}
                      <span>{getRoleText(member.role)}</span>
                    </span>
                    
                    {canManageMembers && member.role !== 'owner' && (
                      <div className="relative">
                        <button
                          onClick={() => setShowMemberMenu(showMemberMenu === member._id ? null : member._id)}
                          className="p-1 text-text-secondary hover:text-text-primary rounded"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        {showMemberMenu === member._id && (
                          <div className="absolute right-0 top-6 bg-surface border border-border rounded-lg shadow-lg py-1 z-10 min-w-[140px]">
                            <button
                              onClick={() => handleMemberAction(member._id, 'changeRole', 'admin')}
                              className="w-full px-4 py-2 text-left text-text-secondary hover:text-text-primary hover:bg-surface-alt transition-colors"
                            >
                              設為管理員
                            </button>
                            <button
                              onClick={() => handleMemberAction(member._id, 'changeRole', 'member')}
                              className="w-full px-4 py-2 text-left text-text-secondary hover:text-text-primary hover:bg-surface-alt transition-colors"
                            >
                              設為成員
                            </button>
                            <button
                              onClick={() => handleMemberAction(member._id, 'remove')}
                              className="w-full px-4 py-2 text-left text-error hover:bg-error/10 transition-colors"
                            >
                              移除成員
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {(!group.members || group.members.length === 0) && (
                <div className="text-center py-8 text-text-secondary">
                  尚無成員資料
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-text-primary">團體活動</h3>
              <button className="flex items-center space-x-2 px-4 py-2 bg-morandi-sage text-white rounded-lg hover:bg-morandi-sage-dark transition-colors">
                <Calendar className="w-4 h-4" />
                <span>檢視所有活動</span>
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
            
            <div className="text-center py-8 text-text-secondary">
              團體活動功能即將推出...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupDetail;