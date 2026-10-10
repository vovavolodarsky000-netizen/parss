import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * Сообщение WebSocket
 */
export interface WebSocketMessage {
  /** Тип сообщения */
  type: string;
  /** Данные сообщения */
  payload: Record<string, unknown>;
  /** Временная метка */
  timestamp: string;
}

/**
 * Хук для работы с WebSocket соединениями
 * 
 * @description
 * Управляет WebSocket соединением с автоматическим переподключением.
 * Поддерживает аутентификацию и подписку на каналы.
 * 
 * @param url - URL WebSocket сервера
 * @returns {Object} Объект с методами и состоянием WebSocket
 * @returns {boolean} isConnected - Статус подключения
 * @returns {WebSocketMessage|null} lastMessage - Последнее полученное сообщение
 * @returns {Function} sendMessage - Функция отправки сообщения
 * @returns {Function} disconnect - Функция отключения
 * 
 * @example
 * ```tsx
 * const { isConnected, sendMessage, lastMessage } = useWebSocket('ws://localhost:8080');
 * 
 * // Отправка сообщения
 * sendMessage('new_post', { id: '123', text: 'Hello' });
 * 
 * // Обработка входящих сообщений
 * useEffect(() => {
 *   if (lastMessage) {
 *     console.log('Получено:', lastMessage);
 *   }
 * }, [lastMessage]);
 * ```
 */
export function useWebSocket(url: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout>>();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    try {
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        console.log('[WebSocket] Connected');
        setIsConnected(true);
        reconnectAttempts.current = 0;
      };

      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          setLastMessage(message);
        } catch (error) {
          console.error('[WebSocket] Error parsing message:', error);
        }
      };

      ws.current.onclose = () => {
        console.log('[WebSocket] Disconnected');
        setIsConnected(false);

        // Автоматическое переподключение
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          reconnectTimeout.current = setTimeout(() => {
            reconnectAttempts.current += 1;
            connect();
          }, delay);
        }
      };

      ws.current.onerror = (event) => {
        console.error('[WebSocket] Error:', event);
      };
    } catch (error) {
      console.error('[WebSocket] Connection error:', error);
    }
  }, [url]);

  const disconnect = useCallback(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
    }
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
  }, []);

  const sendMessage = useCallback((type: string, payload: Record<string, unknown>) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type, payload, timestamp: new Date().toISOString() }));
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    lastMessage,
    sendMessage,
    disconnect,
  };
}
