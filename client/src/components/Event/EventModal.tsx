import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { X, Calendar, Clock, MapPin, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreateEventForm, MorandiColor, EventCategory, RecurrenceRule } from '@/types';
import { getColorConfig, getColorOptions } from '@/utils/colors';
import { formatDate, getTodayDateString, formatDateForInput } from '@/utils/date';
import RecurrenceSettings from './RecurrenceSettings';

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
  privacy: yup.string().oneOf(['private', 'shared', 'public']).default('private'),
});

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateEventForm) => Promise<void>;
  initialDate?: Date;
}

const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialDate
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule>({
    type: 'none',
    interval: 1,
    endType: 'never'
  });
  const colorOptions = getColorOptions();

  const defaultValues: Partial<CreateEventForm> = {
    title: '',
    description: '',
    startDate: initialDate ? formatDateForInput(initialDate) : getTodayDateString(),
    startTime: '09:00',
    endDate: initialDate ? formatDateForInput(initialDate) : getTodayDateString(),
    endTime: '10:00',
    isAllDay: false,
    color: 'morandi-sage',
    category: 'personal',
    location: '',
    privacy: 'private',
    reminders: [],
    recurrence: {
      type: 'none',
      interval: 1,
      endType: 'never'
    },
  };

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateEventForm>({
    resolver: yupResolver(eventSchema),
    defaultValues,
  });

  // 當 initialDate 或 isOpen 改變時重置表單
  useEffect(() => {
    if (isOpen) {
      const newDefaultValues: Partial<CreateEventForm> = {
        title: '',
        description: '',
        startDate: initialDate ? formatDateForInput(initialDate) : getTodayDateString(),
        startTime: '09:00',
        endDate: initialDate ? formatDateForInput(initialDate) : getTodayDateString(),
        endTime: '10:00',
        isAllDay: false,
        color: 'morandi-sage',
        category: 'personal',
        location: '',
        privacy: 'private',
        reminders: [],
      };
      reset(newDefaultValues);
      setRecurrenceRule({
        type: 'none',
        interval: 1,
        endType: 'never'
      });
    }
  }, [initialDate, isOpen, reset]);

  const isAllDay = watch('isAllDay');
  const selectedColor = watch('color') as MorandiColor;

  const handleFormSubmit = async (data: CreateEventForm) => {
    try {
      setIsSubmitting(true);
      // 包含重複設定
      const formDataWithRecurrence = {
        ...data,
        recurrence: recurrenceRule
      };
      await onSubmit(formDataWithRecurrence);
      reset();
      onClose();
    } catch (error) {
      console.error('Event creation error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen) return null;

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
            <h2 className="text-xl font-semibold text-text-primary">新增活動</h2>
            <button
              onClick={handleClose}
              className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-alt rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-6">
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
                id="isAllDay"
                className="w-4 h-4 text-morandi-sage bg-background border-border rounded focus:ring-morandi-sage"
                disabled={isSubmitting}
              />
              <label htmlFor="isAllDay" className="ml-2 text-sm text-text-primary">
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
                <option value="private">私人</option>
                <option value="shared">共享</option>
                <option value="public">公開</option>
              </select>
            </div>

            {/* Recurrence Settings */}
            <RecurrenceSettings
              value={recurrenceRule}
              onChange={setRecurrenceRule}
              disabled={isSubmitting}
            />

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
                {isSubmitting ? '新增中...' : '新增活動'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EventModal;