import React, { useState } from 'react';
import { Save, Bell, Mail, Smartphone, Clock } from 'lucide-react';
import { NotificationSettings as NotificationSettingsType } from '@/types';

interface NotificationSettingsProps {
  settings: NotificationSettingsType;
  onSave: (settings: Partial<NotificationSettingsType>) => void;
  loading?: boolean;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  settings,
  onSave,
  loading = false
}) => {
  const [formData, setFormData] = useState(settings);
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (path: string, value: boolean | string) => {
    setFormData(prev => {
      const keys = path.split('.');
      const newData = { ...prev };
      let current: any = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      setHasChanges(true);
      return newData;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setHasChanges(false);
  };

  const handleReset = () => {
    setFormData(settings);
    setHasChanges(false);
  };

  const SettingSection: React.FC<{
    icon: React.ReactNode;
    title: string;
    description: string;
    children: React.ReactNode;
  }> = ({ icon, title, description, children }) => (
    <div className="space-y-4">
      <div className="flex items-start space-x-3">
        <div className="text-morandi-sage mt-1">{icon}</div>
        <div className="flex-1">
          <h3 className="text-lg font-medium text-text-primary">{title}</h3>
          <p className="text-sm text-text-secondary mt-1">{description}</p>
        </div>
      </div>
      <div className="ml-8 space-y-3">
        {children}
      </div>
    </div>
  );

  const ToggleSwitch: React.FC<{
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    description?: string;
  }> = ({ label, checked, onChange, description }) => (
    <div className="flex items-start justify-between py-2">
      <div className="flex-1">
        <label className="text-sm font-medium text-text-primary">{label}</label>
        {description && (
          <p className="text-xs text-text-secondary mt-1">{description}</p>
        )}
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-surface-alt peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-morandi-sage/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-morandi-sage border border-border"></div>
      </label>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* 郵件通知 */}
      <SettingSection
        icon={<Mail className="w-5 h-5" />}
        title="郵件通知"
        description="接收重要通知的郵件提醒"
      >
        <ToggleSwitch
          label="啟用郵件通知"
          checked={formData.email.enabled}
          onChange={(checked) => handleChange('email.enabled', checked)}
          description="是否接收郵件通知"
        />
        
        {formData.email.enabled && (
          <>
            <ToggleSwitch
              label="團體邀請"
              checked={formData.email.groupInvitations}
              onChange={(checked) => handleChange('email.groupInvitations', checked)}
            />
            <ToggleSwitch
              label="活動提醒"
              checked={formData.email.eventReminders}
              onChange={(checked) => handleChange('email.eventReminders', checked)}
            />
            <ToggleSwitch
              label="活動更新"
              checked={formData.email.eventUpdates}
              onChange={(checked) => handleChange('email.eventUpdates', checked)}
            />
            <ToggleSwitch
              label="留言通知"
              checked={formData.email.comments}
              onChange={(checked) => handleChange('email.comments', checked)}
            />
            <ToggleSwitch
              label="提及通知"
              checked={formData.email.mentions}
              onChange={(checked) => handleChange('email.mentions', checked)}
            />
          </>
        )}
      </SettingSection>

      {/* 瀏覽器通知 */}
      <SettingSection
        icon={<Bell className="w-5 h-5" />}
        title="瀏覽器通知"
        description="在瀏覽器中顯示桌面通知"
      >
        <ToggleSwitch
          label="啟用瀏覽器通知"
          checked={formData.browser.enabled}
          onChange={(checked) => handleChange('browser.enabled', checked)}
          description="需要瀏覽器權限才能顯示通知"
        />
        
        {formData.browser.enabled && (
          <>
            <ToggleSwitch
              label="團體邀請"
              checked={formData.browser.groupInvitations}
              onChange={(checked) => handleChange('browser.groupInvitations', checked)}
            />
            <ToggleSwitch
              label="活動提醒"
              checked={formData.browser.eventReminders}
              onChange={(checked) => handleChange('browser.eventReminders', checked)}
            />
            <ToggleSwitch
              label="活動更新"
              checked={formData.browser.eventUpdates}
              onChange={(checked) => handleChange('browser.eventUpdates', checked)}
            />
            <ToggleSwitch
              label="留言通知"
              checked={formData.browser.comments}
              onChange={(checked) => handleChange('browser.comments', checked)}
            />
            <ToggleSwitch
              label="提及通知"
              checked={formData.browser.mentions}
              onChange={(checked) => handleChange('browser.mentions', checked)}
            />
          </>
        )}
      </SettingSection>

      {/* 手機通知 */}
      <SettingSection
        icon={<Smartphone className="w-5 h-5" />}
        title="手機通知"
        description="推送通知到手機設備"
      >
        <ToggleSwitch
          label="啟用手機通知"
          checked={formData.mobile.enabled}
          onChange={(checked) => handleChange('mobile.enabled', checked)}
          description="需要安裝手機應用程序"
        />
        
        {formData.mobile.enabled && (
          <>
            <ToggleSwitch
              label="團體邀請"
              checked={formData.mobile.groupInvitations}
              onChange={(checked) => handleChange('mobile.groupInvitations', checked)}
            />
            <ToggleSwitch
              label="活動提醒"
              checked={formData.mobile.eventReminders}
              onChange={(checked) => handleChange('mobile.eventReminders', checked)}
            />
            <ToggleSwitch
              label="活動更新"
              checked={formData.mobile.eventUpdates}
              onChange={(checked) => handleChange('mobile.eventUpdates', checked)}
            />
            <ToggleSwitch
              label="留言通知"
              checked={formData.mobile.comments}
              onChange={(checked) => handleChange('mobile.comments', checked)}
            />
            <ToggleSwitch
              label="提及通知"
              checked={formData.mobile.mentions}
              onChange={(checked) => handleChange('mobile.mentions', checked)}
            />
          </>
        )}
      </SettingSection>

      {/* 免打擾時間 */}
      <SettingSection
        icon={<Clock className="w-5 h-5" />}
        title="免打擾時間"
        description="設定不接收通知的時間段"
      >
        <ToggleSwitch
          label="啟用免打擾"
          checked={formData.quietHours.enabled}
          onChange={(checked) => handleChange('quietHours.enabled', checked)}
        />
        
        {formData.quietHours.enabled && (
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                開始時間
              </label>
              <input
                type="time"
                value={formData.quietHours.startTime}
                onChange={(e) => handleChange('quietHours.startTime', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-morandi-sage"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                結束時間
              </label>
              <input
                type="time"
                value={formData.quietHours.endTime}
                onChange={(e) => handleChange('quietHours.endTime', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-morandi-sage"
              />
            </div>
          </div>
        )}
      </SettingSection>

      {/* 操作按鈕 */}
      <div className="flex items-center justify-end space-x-4 pt-6 border-t border-border">
        {hasChanges && (
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            重置
          </button>
        )}
        
        <button
          type="submit"
          disabled={!hasChanges || loading}
          className="flex items-center space-x-2 px-6 py-2 bg-morandi-sage text-white rounded-lg hover:bg-morandi-sage-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          <span>{loading ? '儲存中...' : '儲存設定'}</span>
        </button>
      </div>
    </form>
  );
};

export default NotificationSettings;