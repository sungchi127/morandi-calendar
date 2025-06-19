import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Repeat, Calendar, Hash, Clock } from 'lucide-react';

export interface RecurrenceRule {
  type: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  endDate?: string;
  occurrences?: number;
  endType: 'never' | 'date' | 'count';
}

interface RecurrenceSettingsProps {
  value: RecurrenceRule;
  onChange: (rule: RecurrenceRule) => void;
  disabled?: boolean;
}

const RecurrenceSettings: React.FC<RecurrenceSettingsProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  const recurrenceTypes = [
    { value: 'none', label: '不重複', icon: null },
    { value: 'daily', label: '每日', icon: <Clock className="w-3 h-3" /> },
    { value: 'weekly', label: '每週', icon: <Calendar className="w-3 h-3" /> },
    { value: 'monthly', label: '每月', icon: <Calendar className="w-3 h-3" /> },
    { value: 'yearly', label: '每年', icon: <Calendar className="w-3 h-3" /> },
  ];

  const endTypes = [
    { value: 'never', label: '永不結束' },
    { value: 'date', label: '結束日期' },
    { value: 'count', label: '重複次數' },
  ];

  const handleTypeChange = (type: RecurrenceRule['type']) => {
    onChange({
      ...value,
      type,
      interval: type === 'none' ? 1 : value.interval,
      endType: type === 'none' ? 'never' : value.endType,
    });
  };

  const handleIntervalChange = (interval: number) => {
    onChange({ ...value, interval: Math.max(1, interval) });
  };

  const handleEndTypeChange = (endType: RecurrenceRule['endType']) => {
    const newValue: RecurrenceRule = {
      ...value,
      endType,
    };

    // 清空其他結束條件
    if (endType !== 'date') {
      delete newValue.endDate;
    }
    if (endType !== 'count') {
      delete newValue.occurrences;
    }

    onChange(newValue);
  };

  const getIntervalText = () => {
    switch (value.type) {
      case 'daily':
        return value.interval === 1 ? '每天' : `每 ${value.interval} 天`;
      case 'weekly':
        return value.interval === 1 ? '每週' : `每 ${value.interval} 週`;
      case 'monthly':
        return value.interval === 1 ? '每月' : `每 ${value.interval} 個月`;
      case 'yearly':
        return value.interval === 1 ? '每年' : `每 ${value.interval} 年`;
      default:
        return '';
    }
  };

  return (
    <div className="space-y-4">
      {/* 重複類型選擇 */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          <Repeat className="inline w-4 h-4 mr-1" />
          重複規則
        </label>
        <div className="grid grid-cols-3 gap-2">
          {recurrenceTypes.map((type) => {
            const isSelected = value.type === type.value;
            return (
              <button
                key={type.value}
                type="button"
                onClick={() => handleTypeChange(type.value as RecurrenceRule['type'])}
                disabled={disabled}
                className={`
                  px-3 py-2 text-sm rounded-lg border transition-all
                  ${isSelected
                    ? 'bg-morandi-sage text-white border-morandi-sage'
                    : 'bg-surface border-border text-text-secondary hover:bg-surface-alt hover:border-morandi-sage'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                <div className="flex items-center justify-center space-x-1">
                  {type.icon}
                  <span>{type.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 高級設定 */}
      <AnimatePresence>
        {value.type !== 'none' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4 border-t border-border pt-4"
          >
            {/* 間隔設定 */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                間隔
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="1"
                  max="999"
                  value={value.interval}
                  onChange={(e) => handleIntervalChange(parseInt(e.target.value) || 1)}
                  disabled={disabled}
                  className="w-20 px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-morandi-sage focus:border-morandi-sage"
                />
                <span className="text-sm text-text-secondary">
                  {getIntervalText()}
                </span>
              </div>
            </div>

            {/* 結束條件 */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                結束條件
              </label>
              <div className="space-y-3">
                {endTypes.map((endType) => {
                  const isSelected = value.endType === endType.value;
                  return (
                    <label key={endType.value} className="flex items-center">
                      <input
                        type="radio"
                        name="endType"
                        value={endType.value}
                        checked={isSelected}
                        onChange={() => handleEndTypeChange(endType.value as RecurrenceRule['endType'])}
                        disabled={disabled}
                        className="w-4 h-4 text-morandi-sage bg-background border-border rounded focus:ring-morandi-sage"
                      />
                      <span className="ml-2 text-sm text-text-primary">
                        {endType.label}
                      </span>
                    </label>
                  );
                })}
              </div>

              {/* 結束日期輸入 */}
              {value.endType === 'date' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3"
                >
                  <input
                    type="date"
                    value={value.endDate || ''}
                    onChange={(e) => onChange({ ...value, endDate: e.target.value })}
                    disabled={disabled}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-morandi-sage focus:border-morandi-sage"
                  />
                </motion.div>
              )}

              {/* 重複次數輸入 */}
              {value.endType === 'count' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 flex items-center space-x-2"
                >
                  <input
                    type="number"
                    min="1"
                    max="999"
                    value={value.occurrences || 1}
                    onChange={(e) => onChange({ ...value, occurrences: parseInt(e.target.value) || 1 })}
                    disabled={disabled}
                    placeholder="次數"
                    className="w-24 px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-morandi-sage focus:border-morandi-sage"
                  />
                  <span className="text-sm text-text-secondary">次</span>
                </motion.div>
              )}
            </div>

            {/* 預覽 */}
            <div className="bg-morandi-cream-light border border-morandi-cream rounded-lg p-3">
              <div className="text-sm text-text-primary">
                <strong>預覽:</strong> {getRecurrencePreview(value)}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// 生成重複規則預覽文字
function getRecurrencePreview(rule: RecurrenceRule): string {
  if (rule.type === 'none') {
    return '此活動不會重複';
  }

  let preview = '';
  
  // 頻率描述
  switch (rule.type) {
    case 'daily':
      preview = rule.interval === 1 ? '每天' : `每 ${rule.interval} 天`;
      break;
    case 'weekly':
      preview = rule.interval === 1 ? '每週' : `每 ${rule.interval} 週`;
      break;
    case 'monthly':
      preview = rule.interval === 1 ? '每月' : `每 ${rule.interval} 個月`;
      break;
    case 'yearly':
      preview = rule.interval === 1 ? '每年' : `每 ${rule.interval} 年`;
      break;
  }

  // 結束條件
  if (rule.endType === 'never') {
    preview += '，永不結束';
  } else if (rule.endType === 'date' && rule.endDate) {
    preview += `，直到 ${rule.endDate}`;
  } else if (rule.endType === 'count' && rule.occurrences) {
    preview += `，共 ${rule.occurrences} 次`;
  }

  return preview;
}

export default RecurrenceSettings;