import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { X, Calendar, Clock, MapPin, Palette, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Event, CreateEventForm, MorandiColor } from '@/types';
import { getColorConfig, getColorOptions } from '@/utils/colors';
import { separateDateTime, formatDateForInput } from '@/utils/date';
import { groupAPI } from '@/services/api';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

const eventSchema = yup.object({
  title: yup
    .string()
    .required('活動標題是必填項目')
    .max(100, '標題不能超過100個字符'),
  description: yup
    .string()
    .max(1000, '描述不能超過1000個字符'),
  startDate: yup
    .string()
    .required('開始日期是必填項目'),
  startTime: yup
    .string()
    .when('isAllDay', {
      is: false,
      then: (schema) => schema.required('開始時間是必填項目'),
      otherwise: (schema) => schema.notRequired(),
    }),
  endDate: yup
    .string()
    .required('結束日期是必填項目'),
  endTime: yup
    .string()
    .when('isAllDay', {
      is: false,
      then: (schema) => schema.required('結束時間是必填項目'),
      otherwise: (schema) => schema.notRequired(),
    }),
  isAllDay: yup.boolean().default(false),
  color: yup.string().required(),
  category: yup.string().required(),
  location: yup.string().max(200, '地點不能超過200個字符'),
  privacy: yup.string().oneOf(['private', 'shared', 'public', 'group_only']).default('private'),
  group: yup.string().optional(),
});

interface EventEditModalProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (eventId: string, data: Partial<CreateEventForm>) => Promise<void>;
}

const EventEditModal: React.FC<EventEditModalProps> = ({
  event,
  isOpen,
  onClose,
  onSubmit
}) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const colorOptions = getColorOptions();

  // 獲取用戶的團體列表
  const { data: userGroupsData } = useQuery({
    queryKey: ['user-groups'],
    queryFn: () => groupAPI.getUserGroups({ limit: 50 }),
    enabled: !!user,
  });

  const userGroups = userGroupsData?.data.groups || [];

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateEventForm>({
    resolver: yupResolver(eventSchema) as any,
  });

  // 當 event 改變時，更新表單默認值
  useEffect(() => {
    if (event && isOpen) {
      const startDate = new Date(event.startDate);
      const endDate = new Date(event.endDate);
      const startDateTime = separateDateTime(event.startDate);
      const endDateTime = separateDateTime(event.endDate);
      
      reset({
        title: event.title,
        description: event.description || '',
        startDate: formatDateForInput(startDate),
        startTime: event.isAllDay ? '09:00' : startDateTime.time,
        endDate: formatDateForInput(endDate),
        endTime: event.isAllDay ? '10:00' : endDateTime.time,
        isAllDay: event.isAllDay,
        color: event.color,
        category: event.category,
        location: event.location || '',
        privacy: event.privacy,
        group: event.group?._id || '', // 添加 group 欄位
        reminders: [],
      });
    }
  }, [event, isOpen, reset]);

  const isAllDay = watch('isAllDay');
  const selectedColor = watch('color') as MorandiColor;
  const selectedGroup = watch('group');
  const selectedPrivacy = watch('privacy');

  // 當選擇團體時，自動設置隱私為 group_only
  useEffect(() => {
    if (selectedGroup && selectedPrivacy !== 'group_only') {
      setValue('privacy', 'group_only');
    } else if (!selectedGroup && selectedPrivacy === 'group_only') {
      setValue('privacy', 'private');
    }
  }, [selectedGroup, selectedPrivacy, setValue]);

  const handleFormSubmit = async (data: CreateEventForm) => {
    if (!event) return;

    try {
      setIsSubmitting(true);
      
      // 過濾掉startTime和endTime字段，只保留後端需要的字段
      const filteredData = {
        title: data.title,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        isAllDay: data.isAllDay,
        color: data.color,
        category: data.category,
        location: data.location,
        privacy: data.privacy,
        reminders: data.reminders || [],
        ...(data.group && { group: data.group }), // 只在有團體時添加 group 欄位
      };
      
      console.log('EventEditModal - 過濾後的數據:', filteredData);
      
      await onSubmit(event._id, filteredData);
      onClose();
    } catch (error) {
      console.error('Event update error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!event || !isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className="relative bg-surface rounded-xl shadow-strong max-w-md w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-xl font-semibold text-text-primary">編輯活動</h2>
            <button
              onClick={handleClose}
              className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-alt rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(handleFormSubmit as any)} className="p-6 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                活動標題 *
              </label>
              <input
                {...register('title')}
                type="text"
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-morandi-sage focus:border-morandi-sage"
                placeholder="輸入活動標題"
                disabled={isSubmitting}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-error">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                活動描述
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-morandi-sage focus:border-morandi-sage resize-none"
                placeholder="活動詳細描述..."
                disabled={isSubmitting}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-error">{errors.description.message}</p>
              )}
            </div>

            {/* All Day Toggle */}
            <div className="flex items-center">
              <input
                {...register('isAllDay')}
                type="checkbox"
                id="editIsAllDay"
                className="w-4 h-4 text-morandi-sage bg-background border-border rounded focus:ring-morandi-sage"
                disabled={isSubmitting}
              />
              <label htmlFor="editIsAllDay" className="ml-2 text-sm text-text-primary">
                全天活動
              </label>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  開始日期 *
                </label>
                <input
                  {...register('startDate')}
                  type="date"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-morandi-sage focus:border-morandi-sage"
                  disabled={isSubmitting}
                />
                {errors.startDate && (
                  <p className="mt-1 text-sm text-error">{errors.startDate.message}</p>
                )}
              </div>

              {/* Start Time */}
              {!isAllDay && (
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    <Clock className="inline w-4 h-4 mr-1" />
                    開始時間 *
                  </label>
                  <input
                    {...register('startTime')}
                    type="time"
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-morandi-sage focus:border-morandi-sage"
                    disabled={isSubmitting}
                  />
                  {errors.startTime && (
                    <p className="mt-1 text-sm text-error">{errors.startTime.message}</p>
                  )}
                </div>
              )}

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  結束日期 *
                </label>
                <input
                  {...register('endDate')}
                  type="date"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-morandi-sage focus:border-morandi-sage"
                  disabled={isSubmitting}
                />
                {errors.endDate && (
                  <p className="mt-1 text-sm text-error">{errors.endDate.message}</p>
                )}
              </div>

              {/* End Time */}
              {!isAllDay && (
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    結束時間 *
                  </label>
                  <input
                    {...register('endTime')}
                    type="time"
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-morandi-sage focus:border-morandi-sage"
                    disabled={isSubmitting}
                  />
                  {errors.endTime && (
                    <p className="mt-1 text-sm text-error">{errors.endTime.message}</p>
                  )}
                </div>
              )}
            </div>

            {/* Color Selection */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                <Palette className="inline w-4 h-4 mr-1" />
                顏色標籤
              </label>
              <div className="grid grid-cols-4 gap-2">
                {colorOptions.map((option) => {
                  const colorConfig = getColorConfig(option.value);
                  const isSelected = selectedColor === option.value;
                  
                  return (
                    <label key={option.value} className="cursor-pointer">
                      <input
                        {...register('color')}
                        type="radio"
                        value={option.value}
                        className="sr-only"
                        disabled={isSubmitting}
                      />
                      <div className={`
                        w-full h-12 rounded-lg border-2 transition-all
                        ${colorConfig.bg}
                        ${isSelected 
                          ? 'border-text-primary shadow-medium' 
                          : 'border-border hover:border-text-muted'
                        }
                      `}>
                        <div className="w-full h-full rounded-md flex items-center justify-center">
                          <span className={`text-xs font-medium ${colorConfig.text}`}>
                            {option.label}
                          </span>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                分類
              </label>
              <select
                {...register('category')}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-morandi-sage focus:border-morandi-sage"
                disabled={isSubmitting}
              >
                <option value="personal">個人</option>
                <option value="work">工作</option>
                <option value="friends">朋友</option>
                <option value="family">家庭</option>
                <option value="health">健康</option>
                <option value="other">其他</option>
              </select>
            </div>

            {/* Group Selection */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                <Users className="inline w-4 h-4 mr-1" />
                團體 (可選)
              </label>
              <select
                {...register('group')}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-morandi-sage focus:border-morandi-sage"
                disabled={isSubmitting}
              >
                <option value="">個人活動</option>
                {userGroups.map((group) => (
                  <option key={group._id} value={group._id}>
                    {group.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-text-muted">
                選擇團體後，活動將僅對團體成員可見
              </p>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                <MapPin className="inline w-4 h-4 mr-1" />
                地點
              </label>
              <input
                {...register('location')}
                type="text"
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-morandi-sage focus:border-morandi-sage"
                placeholder="活動地點"
                disabled={isSubmitting}
              />
              {errors.location && (
                <p className="mt-1 text-sm text-error">{errors.location.message}</p>
              )}
            </div>

            {/* Privacy */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                隱私設定
              </label>
              <select
                {...register('privacy')}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-morandi-sage focus:border-morandi-sage"
                disabled={isSubmitting}
              >
                {selectedGroup ? (
                  <>
                    <option value="group_only">團體成員可見</option>
                    <option value="public">公開</option>
                  </>
                ) : (
                  <>
                    <option value="private">私人</option>
                    <option value="shared">共享</option>
                    <option value="public">公開</option>
                  </>
                )}
              </select>
              <p className="mt-1 text-xs text-text-muted">
                {selectedGroup 
                  ? '團體活動的隱私設定已自動調整' 
                  : '選擇活動的可見性範圍'
                }
              </p>
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 text-text-secondary border border-border rounded-lg hover:bg-surface-alt transition-colors"
                disabled={isSubmitting}
              >
                取消
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`
                  flex-1 px-4 py-2 bg-morandi-sage text-white rounded-lg
                  hover:bg-morandi-sage-dark transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${isSubmitting ? 'animate-pulse' : ''}
                `}
              >
                {isSubmitting ? '更新中...' : '更新活動'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EventEditModal;