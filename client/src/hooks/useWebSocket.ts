import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
}

export interface UseWebSocketOptions {
  url?: string;
  protocols?: string | string[];
  reconnectAttempts?: number;
  reconnectInterval?: number;
  heartbeatInterval?: number;
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  onMessage?: (message: WebSocketMessage) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  
  const {
    url = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`,
    protocols,
    reconnectAttempts = 5,
    reconnectInterval = 3000,
    heartbeatInterval = 30000,
    onOpen,
    onClose,
    onError,
    onMessage
  } = options;

  // 清理函數
  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.onmessage = null;
      
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  // 發送心跳
  const sendHeartbeat = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'heartbeat',
        timestamp: Date.now()
      }));
    }
  }, []);

  // 開始心跳
  const startHeartbeat = useCallback(() => {
    if (heartbeatInterval > 0) {
      heartbeatIntervalRef.current = setInterval(sendHeartbeat, heartbeatInterval);
    }
  }, [sendHeartbeat, heartbeatInterval]);

  // 停止心跳
  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  // 連接 WebSocket
  const connect = useCallback(() => {
    if (!user) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    
    setIsConnecting(true);
    setConnectionError(null);
    
    try {
      const wsUrl = `${url}?token=${localStorage.getItem('token')}`;
      wsRef.current = new WebSocket(wsUrl, protocols);
      
      wsRef.current.onopen = (event) => {
        setIsConnected(true);
        setIsConnecting(false);
        setConnectionError(null);
        reconnectAttemptsRef.current = 0;
        
        startHeartbeat();
        onOpen?.(event);
      };
      
      wsRef.current.onclose = (event) => {
        setIsConnected(false);
        setIsConnecting(false);
        stopHeartbeat();
        
        onClose?.(event);
        
        // 如果不是手動關閉且還有重連次數，則嘗試重連
        if (!event.wasClean && reconnectAttemptsRef.current < reconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          setConnectionError(`連接已斷開，正在嘗試重連 (${reconnectAttemptsRef.current}/${reconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        } else if (reconnectAttemptsRef.current >= reconnectAttempts) {
          setConnectionError('連接失敗，已達到最大重連次數');
        }
      };
      
      wsRef.current.onerror = (event) => {
        setConnectionError('WebSocket 連接錯誤');
        onError?.(event);
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          onMessage?.(message);
        } catch (error) {
          console.error('解析 WebSocket 消息失敗:', error);
        }
      };
      
    } catch (error) {
      setIsConnecting(false);
      setConnectionError('無法創建 WebSocket 連接');
      console.error('WebSocket 連接錯誤:', error);
    }
  }, [user, url, protocols, reconnectAttempts, reconnectInterval, onOpen, onClose, onError, onMessage, startHeartbeat, stopHeartbeat]);

  // 斷開連接
  const disconnect = useCallback(() => {
    reconnectAttemptsRef.current = reconnectAttempts; // 阻止自動重連
    cleanup();
  }, [cleanup, reconnectAttempts]);

  // 發送消息
  const sendMessage = useCallback((type: string, data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message = {
        type,
        data,
        timestamp: Date.now()
      };
      
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    
    console.warn('WebSocket 未連接，無法發送消息');
    return false;
  }, []);

  // 重新連接
  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    cleanup();
    connect();
  }, [cleanup, connect]);

  // 自動連接
  useEffect(() => {
    if (user) {
      connect();
    } else {
      disconnect();
    }
    
    return cleanup;
  }, [user, connect, disconnect, cleanup]);

  return {
    isConnected,
    isConnecting,
    lastMessage,
    connectionError,
    sendMessage,
    connect,
    disconnect,
    reconnect,
  };
}

// 用於實時通知的專用 hook
export function useNotificationWebSocket() {
  const [notifications, setNotifications] = useState<any[]>([]);
  
  const { isConnected, sendMessage, lastMessage } = useWebSocket({
    onMessage: (message) => {
      if (message.type === 'notification') {
        setNotifications(prev => [message.data, ...prev.slice(0, 49)]); // 保持最新50條
      }
    }
  });

  // 訂閱通知
  useEffect(() => {
    if (isConnected) {
      sendMessage('subscribe', { type: 'notifications' });
    }
  }, [isConnected, sendMessage]);

  return {
    isConnected,
    notifications,
    lastNotification: lastMessage?.type === 'notification' ? lastMessage.data : null,
  };
}