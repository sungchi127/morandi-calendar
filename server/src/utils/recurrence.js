const { addDays, addWeeks, addMonths, addYears, isBefore, isAfter, startOfDay } = require('date-fns');

/**
 * 生成重複活動的日期
 * @param {Object} baseEvent - 基礎活動
 * @param {Object} recurrence - 重複規則
 * @param {Date} rangeStart - 查詢範圍開始
 * @param {Date} rangeEnd - 查詢範圍結束
 * @returns {Array} 重複活動日期陣列
 */
function generateRecurrenceOccurrences(baseEvent, recurrence, rangeStart, rangeEnd) {
  if (!recurrence || recurrence.type === 'none') {
    return [];
  }

  const occurrences = [];
  const eventStart = new Date(baseEvent.startDate);
  const eventEnd = new Date(baseEvent.endDate);
  const eventDuration = eventEnd.getTime() - eventStart.getTime();

  let currentStart = new Date(eventStart);
  let currentEnd = new Date(eventEnd);
  let count = 0;
  const maxOccurrences = recurrence.occurrences || 100; // 防止無限循環
  const endDate = recurrence.endDate ? new Date(recurrence.endDate) : null;

  // 跳過原始活動，從第一個重複開始
  currentStart = getNextOccurrence(currentStart, recurrence);
  currentEnd = new Date(currentStart.getTime() + eventDuration);

  while (count < maxOccurrences) {
    // 檢查是否超過結束日期
    if (endDate && isAfter(currentStart, endDate)) {
      break;
    }

    // 檢查是否在查詢範圍內
    if (isBefore(currentEnd, rangeStart)) {
      // 還沒到查詢範圍，繼續下一個
      currentStart = getNextOccurrence(currentStart, recurrence);
      currentEnd = new Date(currentStart.getTime() + eventDuration);
      count++;
      continue;
    }

    if (isAfter(currentStart, rangeEnd)) {
      // 已經超過查詢範圍，停止
      break;
    }

    // 在查詢範圍內，添加這個重複活動
    occurrences.push({
      ...baseEvent,
      _id: undefined, // 重複活動將獲得新的ID
      startDate: new Date(currentStart),
      endDate: new Date(currentEnd),
      isRecurring: true,
      originalEventId: baseEvent._id,
      recurrenceDate: new Date(currentStart)
    });

    // 生成下一個重複
    currentStart = getNextOccurrence(currentStart, recurrence);
    currentEnd = new Date(currentStart.getTime() + eventDuration);
    count++;
  }

  return occurrences;
}

/**
 * 根據重複規則計算下一個重複日期
 * @param {Date} currentDate - 當前日期
 * @param {Object} recurrence - 重複規則
 * @returns {Date} 下一個重複日期
 */
function getNextOccurrence(currentDate, recurrence) {
  const interval = recurrence.interval || 1;

  switch (recurrence.type) {
    case 'daily':
      return addDays(currentDate, interval);
    
    case 'weekly':
      return addWeeks(currentDate, interval);
    
    case 'monthly':
      return addMonths(currentDate, interval);
    
    case 'yearly':
      return addYears(currentDate, interval);
    
    default:
      return currentDate;
  }
}

/**
 * 檢查日期是否符合重複規則
 * @param {Date} date - 要檢查的日期
 * @param {Object} baseEvent - 基礎活動
 * @param {Object} recurrence - 重複規則
 * @returns {boolean} 是否符合重複規則
 */
function isDateInRecurrence(date, baseEvent, recurrence) {
  if (!recurrence || recurrence.type === 'none') {
    return false;
  }

  const baseDate = new Date(baseEvent.startDate);
  const checkDate = new Date(date);
  
  // 檢查結束條件
  if (recurrence.endDate && isAfter(checkDate, new Date(recurrence.endDate))) {
    return false;
  }

  const interval = recurrence.interval || 1;
  let diffValue;

  switch (recurrence.type) {
    case 'daily':
      diffValue = Math.floor((checkDate - baseDate) / (1000 * 60 * 60 * 24));
      return diffValue > 0 && diffValue % interval === 0;
    
    case 'weekly':
      diffValue = Math.floor((checkDate - baseDate) / (1000 * 60 * 60 * 24 * 7));
      return diffValue > 0 && diffValue % interval === 0 && 
             checkDate.getDay() === baseDate.getDay();
    
    case 'monthly':
      const monthDiff = (checkDate.getFullYear() - baseDate.getFullYear()) * 12 + 
                       (checkDate.getMonth() - baseDate.getMonth());
      return monthDiff > 0 && monthDiff % interval === 0 && 
             checkDate.getDate() === baseDate.getDate();
    
    case 'yearly':
      const yearDiff = checkDate.getFullYear() - baseDate.getFullYear();
      return yearDiff > 0 && yearDiff % interval === 0 && 
             checkDate.getMonth() === baseDate.getMonth() && 
             checkDate.getDate() === baseDate.getDate();
    
    default:
      return false;
  }
}

/**
 * 生成重複活動的摘要文字
 * @param {Object} recurrence - 重複規則
 * @returns {string} 重複摘要
 */
function getRecurrenceSummary(recurrence) {
  if (!recurrence || recurrence.type === 'none') {
    return '不重複';
  }

  const interval = recurrence.interval || 1;
  let summary = '';

  switch (recurrence.type) {
    case 'daily':
      summary = interval === 1 ? '每天' : `每 ${interval} 天`;
      break;
    case 'weekly':
      summary = interval === 1 ? '每週' : `每 ${interval} 週`;
      break;
    case 'monthly':
      summary = interval === 1 ? '每月' : `每 ${interval} 個月`;
      break;
    case 'yearly':
      summary = interval === 1 ? '每年' : `每 ${interval} 年`;
      break;
  }

  // 添加結束條件
  if (recurrence.endDate) {
    summary += `，直到 ${new Date(recurrence.endDate).toLocaleDateString('zh-TW')}`;
  } else if (recurrence.occurrences) {
    summary += `，共 ${recurrence.occurrences} 次`;
  }

  return summary;
}

module.exports = {
  generateRecurrenceOccurrences,
  getNextOccurrence,
  isDateInRecurrence,
  getRecurrenceSummary
};