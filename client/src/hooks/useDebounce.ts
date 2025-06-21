import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // 設置一個定時器，在延遲後更新防抖值
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // 清理函數，在值改變或組件卸載時清除定時器
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const [debouncedCallback] = useState(() => {
    let timeoutId: NodeJS.Timeout;
    
    const debouncedFn = (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => callback(...args), delay);
    };
    
    return debouncedFn as T;
  });

  return debouncedCallback;
}

// 進階版本，支援立即執行和取消
export function useAdvancedDebounce<T>(
  value: T,
  delay: number,
  options?: {
    immediate?: boolean; // 是否立即執行第一次
    maxWait?: number;    // 最大等待時間
  }
): [T, () => void] {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const [lastCallTime, setLastCallTime] = useState<number>(0);

  useEffect(() => {
    const now = Date.now();
    setLastCallTime(now);

    // 如果設置了立即執行且這是第一次調用
    if (options?.immediate && debouncedValue === value) {
      return;
    }

    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // 如果設置了最大等待時間
    if (options?.maxWait && now - lastCallTime >= options.maxWait) {
      setDebouncedValue(value);
      clearTimeout(handler);
      return;
    }

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay, options?.immediate, options?.maxWait, lastCallTime]);

  // 取消防抖的函數
  const cancel = () => {
    setDebouncedValue(value);
  };

  return [debouncedValue, cancel];
}