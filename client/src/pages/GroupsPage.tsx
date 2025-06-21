import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, Plus, Search, ArrowLeft, Sparkles
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { groupAPI } from '@/services/api';
import { Group, CreateGroupForm, EditGroupForm } from '@/types';
import GroupList from '@/components/Group/GroupList';
import GroupForm from '@/components/Group/GroupForm';
import GroupDetail from '@/components/Group/GroupDetail';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

type ViewMode = 'list' | 'detail' | 'form';

const GroupsPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('');

  // 獲取用戶團體列表
  const { data: groupsData, isLoading, error } = useQuery({
    queryKey: ['user-groups', filterRole],
    queryFn: () => groupAPI.getUserGroups({ 
      page: 1, 
      limit: 50,
      ...(filterRole && { role: filterRole })
    }),
    enabled: !!user,
  });

  // 獲取團體詳情
  const { data: groupDetailData, isLoading: detailLoading } = useQuery({
    queryKey: ['group-detail', selectedGroup?._id],
    queryFn: () => selectedGroup ? groupAPI.getGroupDetail(selectedGroup._id) : null,
    enabled: !!selectedGroup && viewMode === 'detail',
  });

  // 創建團體 mutation
  const createGroupMutation = useMutation({
    mutationFn: groupAPI.createGroup,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['user-groups'] });
      toast.success('團體創建成功！');
      setIsFormOpen(false);
      setSelectedGroup(response.data.group);
      setViewMode('detail');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '創建團體失敗');
    },
  });

  // 更新團體 mutation
  const updateGroupMutation = useMutation({
    mutationFn: ({ groupId, data }: { groupId: string; data: Partial<EditGroupForm> }) =>
      groupAPI.updateGroup(groupId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-groups'] });
      queryClient.invalidateQueries({ queryKey: ['group-detail'] });
      toast.success('團體更新成功！');
      setIsFormOpen(false);
      setEditingGroup(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '更新團體失敗');
    },
  });

  // 刪除團體 mutation
  const deleteGroupMutation = useMutation({
    mutationFn: groupAPI.deleteGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-groups'] });
      toast.success('團體刪除成功！');
      setViewMode('list');
      setSelectedGroup(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '刪除團體失敗');
    },
  });

  // 離開團體 mutation
  const leaveGroupMutation = useMutation({
    mutationFn: groupAPI.leaveGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-groups'] });
      toast.success('已成功離開團體');
      setViewMode('list');
      setSelectedGroup(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '離開團體失敗');
    },
  });

  // 更新成員角色 mutation
  const updateMemberRoleMutation = useMutation({
    mutationFn: ({ groupId, memberId, role }: { groupId: string; memberId: string; role: string }) =>
      groupAPI.updateMemberRole(groupId, memberId, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-detail'] });
      toast.success('成員角色更新成功！');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '更新成員角色失敗');
    },
  });

  // 移除成員 mutation
  const removeMemberMutation = useMutation({
    mutationFn: ({ groupId, memberId }: { groupId: string; memberId: string }) =>
      groupAPI.removeMember(groupId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-detail'] });
      toast.success('成員移除成功！');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '移除成員失敗');
    },
  });

  const groups = groupsData?.data.groups || [];
  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (group.description?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreateGroup = async (data: CreateGroupForm) => {
    await createGroupMutation.mutateAsync(data);
  };

  const handleUpdateGroup = async (data: EditGroupForm) => {
    if (editingGroup) {
      await updateGroupMutation.mutateAsync({
        groupId: editingGroup._id,
        data
      });
    }
  };

  const handleFormSubmit = async (data: CreateGroupForm | EditGroupForm) => {
    if (editingGroup && 'groupId' in data) {
      await handleUpdateGroup(data as EditGroupForm);
    } else {
      await handleCreateGroup(data as CreateGroupForm);
    }
  };

  const handleGroupClick = (group: Group) => {
    setSelectedGroup(group);
    setViewMode('detail');
  };

  const handleGroupEdit = () => {
    if (selectedGroup) {
      setEditingGroup(selectedGroup);
      setIsFormOpen(true);
    }
  };

  const handleGroupDelete = () => {
    if (selectedGroup && window.confirm('確定要刪除這個團體嗎？此操作無法復原。')) {
      deleteGroupMutation.mutate(selectedGroup._id);
    }
  };

  const handleLeaveGroup = () => {
    if (selectedGroup && window.confirm('確定要離開這個團體嗎？')) {
      leaveGroupMutation.mutate(selectedGroup._id);
    }
  };

  const handleMemberRoleUpdate = (memberId: string, role: string) => {
    if (selectedGroup) {
      updateMemberRoleMutation.mutate({
        groupId: selectedGroup._id,
        memberId,
        role
      });
    }
  };

  const handleMemberRemove = (memberId: string) => {
    if (selectedGroup && window.confirm('確定要移除這個成員嗎？')) {
      removeMemberMutation.mutate({
        groupId: selectedGroup._id,
        memberId
      });
    }
  };

  const handleInviteMembers = () => {
    toast('邀請成員功能即將推出！');
  };

  const backToList = () => {
    setViewMode('list');
    setSelectedGroup(null);
  };

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Users className="w-16 h-16 text-error mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-text-primary mb-2">載入失敗</h2>
          <p className="text-text-secondary">無法載入團體資料，請稍後再試。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 頂部導航 */}
      <header className="bg-surface border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {viewMode !== 'list' && (
              <button
                onClick={backToList}
                className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-alt rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center space-x-2">
              <Users className="w-8 h-8 text-morandi-sage" />
              <h1 className="text-xl font-semibold text-text-primary">
                {viewMode === 'detail' ? selectedGroup?.name : '我的團體'}
              </h1>
              <button
                onClick={() => navigate('/calendar')}
                className="ml-4 px-3 py-1 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-alt rounded-lg transition-colors"
              >
                返回日曆
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {viewMode === 'list' && (
              <>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-text-disabled" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜尋團體..."
                    className="pl-10 pr-4 py-2 w-64 border border-border rounded-lg bg-background text-text-primary placeholder-text-disabled focus:outline-none focus:ring-2 focus:ring-morandi-sage"
                  />
                </div>

                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="px-3 py-2 border border-border rounded-lg bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-morandi-sage"
                >
                  <option value="">所有角色</option>
                  <option value="owner">創建者</option>
                  <option value="admin">管理員</option>
                  <option value="member">成員</option>
                  <option value="viewer">觀察者</option>
                </select>

                <button
                  onClick={() => setIsFormOpen(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-morandi-sage text-white rounded-lg hover:bg-morandi-sage-dark transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>創建團體</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 主要內容 */}
      <main className="container mx-auto px-6 py-8">
        {viewMode === 'list' && (
          <div>
            {isLoading ? (
              <GroupList groups={[]} loading={true} onGroupClick={handleGroupClick} />
            ) : filteredGroups.length > 0 ? (
              <GroupList
                groups={filteredGroups}
                onGroupClick={handleGroupClick}
                loading={isLoading}
              />
            ) : (
              <div className="text-center py-12">
                <Sparkles className="w-16 h-16 text-morandi-sage mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-text-primary mb-2">
                  {searchQuery ? '找不到相關團體' : '歡迎使用團體功能！'}
                </h3>
                <p className="text-text-secondary mb-6">
                  {searchQuery 
                    ? '嘗試調整搜尋關鍵字或清除篩選條件'
                    : '創建或加入團體，與夥伴一起管理共同的行程安排'
                  }
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => setIsFormOpen(true)}
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-morandi-sage text-white rounded-lg hover:bg-morandi-sage-dark transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    <span>創建第一個團體</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {viewMode === 'detail' && selectedGroup && (
          <div>
            {detailLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-morandi-sage"></div>
              </div>
            ) : groupDetailData?.data.group ? (
              <GroupDetail
                group={groupDetailData.data.group}
                onEdit={handleGroupEdit}
                onDelete={handleGroupDelete}
                onInviteMembers={handleInviteMembers}
                onLeaveGroup={handleLeaveGroup}
                onMemberRoleUpdate={handleMemberRoleUpdate}
                onMemberRemove={handleMemberRemove}
              />
            ) : (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-text-disabled mx-auto mb-4" />
                <p className="text-text-secondary">無法載入團體詳情</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* 表單 Modal */}
      <GroupForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingGroup(null);
        }}
        onSubmit={handleFormSubmit}
        group={editingGroup}
        loading={createGroupMutation.isPending || updateGroupMutation.isPending}
      />
    </div>
  );
};

export default GroupsPage;