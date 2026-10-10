import { useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { useWebSocket } from './useWebSocket';

/**
 * CODE-005: Хук для интеграции WebSocket с appStore
 * Получает реалтайм-обновления от сервера
 */
export function useWebSocketIntegration() {
  const { loadData } = useAppStore();
  const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:4000';
  
  const { lastMessage, isConnected } = useWebSocket(wsUrl);

  useEffect(() => {
    if (lastMessage !== null) {
      try {
        const data = lastMessage;
        
        // Обрабатываем разные типы сообщений
        switch (data.type) {
          case 'NEW_POSTS':
            // Новые посты доступны - перезагружаем данные
            loadData();
            break;
          case 'PARSE_COMPLETE':
            // Парсинг завершён - перезагружаем данные
            loadData();
            break;
          case 'CHANNEL_UPDATE':
            // Канал обновлён - перезагружаем данные
            loadData();
            break;
          default:
            console.log('WebSocket message:', data);
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    }
  }, [lastMessage, loadData]);

  return { isConnected };
}
