import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Lock, Plus, Trash2 } from 'lucide-react';
import { Group, CreateGroupForm, EditGroupForm } from '@/types';

interface GroupFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateGroupForm | EditGroupForm) => Promise<void>;
  group?: Group | null;
  loading?: boolean;
}

const GroupForm: React.FC<GroupFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  group = null,
  loading = false
}) => {
  const [formData, setFormData] = useState<CreateGroupForm>({
    name: '',
    description: '',
    visibility: 'private',
    settings: {
      allowMembersCreateEvents: true,
      requireEventApproval: false,
      allowMembersInvite: true,
      defaultEventPrivacy: 'group_only'
    },
    tags: []
  });
  
  const [newTag, setNewTag] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (group) {
      setFormData({
        name: group.name,
        description: group.description || '',
        visibility: group.visibility,
        settings: group.settings,
        tags: group.tags || []
      });
    } else {
      setFormData({
        name: '',
        description: '',
        visibility: 'private',
        settings: {
          allowMembersCreateEvents: true,
          requireEventApproval: false,
          allowMembersInvite: true,
          defaultEventPrivacy: 'group_only'
        },
        tags: []
      });
    }
    setErrors({});
    setNewTag('');
  }, [group, isOpen]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = '團體名稱不能為空';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = '團體名稱不能超過100個字元';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = '團體描述不能超過500個字元';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const submitData = {
        ...formData,
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        tags: formData.tags?.filter(tag => tag.trim().length > 0) || []
      };

      if (group) {
        await onSubmit({ ...submitData, groupId: group._id } as EditGroupForm);
      } else {
        await onSubmit(submitData);
      }
      
      onClose();
    } catch (error) {
      console.error('提交表單錯誤:', error);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), newTag.trim()]
      });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter(tag => tag !== tagToRemove) || []
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-text-primary">
            {group ? '編輯團體' : '創建新團體'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-alt rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 基本資訊 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-text-primary">基本資訊</h3>
            
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                團體名稱 *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg bg-background text-text-primary placeholder-text-disabled focus:outline-none focus:ring-2 focus:ring-morandi-sage ${
                  errors.name ? 'border-error' : 'border-border'
                }`}
                placeholder="輸入團體名稱"
                maxLength={100}
              />
              {errors.name && (
                <p className="text-error text-sm mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                團體描述
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg bg-background text-text-primary placeholder-text-disabled focus:outline-none focus:ring-2 focus:ring-morandi-sage resize-none ${
                  errors.description ? 'border-error' : 'border-border'
                }`}
                placeholder="簡單描述這個團體的用途..."
                maxLength={500}
              />
              {errors.description && (
                <p className="text-error text-sm mt-1">{errors.description}</p>
              )}
              <p className="text-text-disabled text-sm mt-1">
                {formData.description?.length || 0} / 500
              </p>
            </div>
          </div>

          {/* 隱私設定 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-text-primary">隱私設定</h3>
            
            <div className="space-y-3">
              <div
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  formData.visibility === 'private' 
                    ? 'border-morandi-sage bg-morandi-sage/5' 
                    : 'border-border hover:bg-surface-alt'
                }`}
                onClick={() => setFormData({ ...formData, visibility: 'private' })}
              >
                <div className="flex items-center space-x-3">
                  <EyeOff className="w-5 h-5 text-morandi-grey flex-shrink-0" />
                  <div>
                    <div className="font-medium text-text-primary">私人團體</div>
                    <div className="text-sm text-text-secondary">只有成員可以查看和加入</div>
                  </div>
                </div>
              </div>

              <div
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  formData.visibility === 'invite_only' 
                    ? 'border-morandi-sage bg-morandi-sage/5' 
                    : 'border-border hover:bg-surface-alt'
                }`}
                onClick={() => setFormData({ ...formData, visibility: 'invite_only' })}
              >
                <div className="flex items-center space-x-3">
                  <Lock className="w-5 h-5 text-morandi-peach flex-shrink-0" />
                  <div>
                    <div className="font-medium text-text-primary">邀請制團體</div>
                    <div className="text-sm text-text-secondary">需要邀請碼才能加入</div>
                  </div>
                </div>
              </div>

              <div
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  formData.visibility === 'public' 
                    ? 'border-morandi-sage bg-morandi-sage/5' 
                    : 'border-border hover:bg-surface-alt'
                }`}
                onClick={() => setFormData({ ...formData, visibility: 'public' })}
              >
                <div className="flex items-center space-x-3">
                  <Eye className="w-5 h-5 text-morandi-sage flex-shrink-0" />
                  <div>
                    <div className="font-medium text-text-primary">公開團體</div>
                    <div className="text-sm text-text-secondary">任何人都可以搜尋和加入</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 團體設定 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-text-primary">團體設定</h3>
            
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.settings?.allowMembersCreateEvents}
                  onChange={(e) => setFormData({
                    ...formData,
                    settings: {
                      ...formData.settings!,
                      allowMembersCreateEvents: e.target.checked
                    }
                  })}
                  className="w-4 h-4 text-morandi-sage focus:ring-morandi-sage border-border rounded"
                />
                <div>
                  <div className="font-medium text-text-primary">允許成員創建活動</div>
                  <div className="text-sm text-text-secondary">成員可以在團體中創建新活動</div>
                </div>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.settings?.requireEventApproval}
                  onChange={(e) => setFormData({
                    ...formData,
                    settings: {
                      ...formData.settings!,
                      requireEventApproval: e.target.checked
                    }
                  })}
                  className="w-4 h-4 text-morandi-sage focus:ring-morandi-sage border-border rounded"
                />
                <div>
                  <div className="font-medium text-text-primary">活動需要審核</div>
                  <div className="text-sm text-text-secondary">新活動需要管理員審核才能顯示</div>
                </div>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.settings?.allowMembersInvite}
                  onChange={(e) => setFormData({
                    ...formData,
                    settings: {
                      ...formData.settings!,
                      allowMembersInvite: e.target.checked
                    }
                  })}
                  className="w-4 h-4 text-morandi-sage focus:ring-morandi-sage border-border rounded"
                />
                <div>
                  <div className="font-medium text-text-primary">允許成員邀請他人</div>
                  <div className="text-sm text-text-secondary">成員可以邀請其他用戶加入團體</div>
                </div>
              </label>
            </div>
          </div>

          {/* 標籤 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-text-primary">標籤</h3>
            
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.tags?.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 bg-morandi-cream/20 text-morandi-cream text-sm rounded-full"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-2 text-morandi-cream/70 hover:text-morandi-cream"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex space-x-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-text-primary placeholder-text-disabled focus:outline-none focus:ring-2 focus:ring-morandi-sage"
                placeholder="新增標籤..."
                maxLength={20}
              />
              <button
                type="button"
                onClick={addTag}
                disabled={!newTag.trim()}
                className="px-4 py-2 bg-morandi-sage text-white rounded-lg hover:bg-morandi-sage-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 提交按鈕 */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-border text-text-secondary hover:text-text-primary hover:bg-surface-alt rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-morandi-sage text-white rounded-lg hover:bg-morandi-sage-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              <span>{group ? '更新團體' : '創建團體'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GroupForm;