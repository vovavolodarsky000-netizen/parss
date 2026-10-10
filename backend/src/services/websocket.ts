import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import crypto from 'crypto';
import logger from './logger.js';

interface Client {
  ws: WebSocket;
  userId?: string;
}

interface WebSocketMessage {
  type: string;
  payload: Record<string, unknown>;
  timestamp?: string;
}

interface AuthPayload {
  userId: string;
}

interface SubscribePayload {
  channel: string;
}

class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, Client> = new Map();

  /**
   * Инициализация WebSocket сервера
   */
  initialize(server: Server): void {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: WebSocket, req) => {
      const clientId = this.generateClientId();
      const client: Client = { ws };

      this.clients.set(clientId, client);
      logger.info('WebSocket клиент подключён', { clientId, totalClients: this.clients.size });

      ws.on('message', (data: Buffer | string) => {
        try {
          const message: WebSocketMessage = JSON.parse(data.toString());
          this.handleMessage(clientId, message);
        } catch (error) {
          logger.error('Ошибка обработки WebSocket сообщения', { 
            error: error instanceof Error ? error.message : String(error) 
          });
        }
      });

      ws.on('close', () => {
        this.clients.delete(clientId);
        logger.info('WebSocket клиент отключён', { clientId, totalClients: this.clients.size });
      });

      ws.on('error', (error: Error) => {
        logger.error('WebSocket ошибка', { clientId, error: error.message });
      });

      // Отправляем приветствие
      this.sendToClient(clientId, {
        type: 'connected',
        payload: { clientId },
        timestamp: new Date().toISOString(),
      });
    });

    logger.info('WebSocket сервер инициализирован');
  }

  /**
   * Обработка входящих сообщений
   */
  private handleMessage(clientId: string, message: WebSocketMessage): void {
    const { type, payload } = message;

    switch (type) {
      case 'authenticate':
        this.authenticateClient(clientId, payload as unknown as AuthPayload);
        break;
      case 'subscribe':
        this.subscribeClient(clientId, payload as unknown as SubscribePayload);
        break;
      default:
        logger.warn('Неизвестный тип сообщения', { clientId, type });
    }
  }

  /**
   * Аутентификация клиента
   */
  private authenticateClient(clientId: string, payload: AuthPayload): void {
    const client = this.clients.get(clientId);
    if (client) {
      client.userId = payload.userId;
      logger.info('Клиент аутентифицирован', { clientId, userId: payload.userId });
    }
  }

  /**
   * Подписка клиента на события
   */
  private subscribeClient(clientId: string, payload: SubscribePayload): void {
    logger.info('Клиент подписан на канал', { clientId, channel: payload.channel });
  }

  /**
   * Отправка сообщения конкретному клиенту
   */
  private sendToClient(clientId: string, message: WebSocketMessage): void {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Broadcast сообщение всем подключённым клиентам
   */
  broadcast(message: WebSocketMessage, userId?: string): void {
    this.clients.forEach((client, clientId) => {
      if (!userId || client.userId === userId) {
        this.sendToClient(clientId, message);
      }
    });
  }

  /**
   * Уведомление о новом посте
   */
  notifyNewPost(post: Record<string, unknown>, userId?: string): void {
    this.broadcast(
      {
        type: 'new_post',
        payload: post,
        timestamp: new Date().toISOString(),
      },
      userId
    );
  }

  /**
   * Уведомление о завершении парсинга
   */
  notifyParseComplete(result: Record<string, unknown>, userId?: string): void {
    this.broadcast(
      {
        type: 'parse_complete',
        payload: result,
        timestamp: new Date().toISOString(),
      },
      userId
    );
  }

  /**
   * Уведомление об изменении статуса
   */
  notifyStatusChange(postId: string, status: string, userId?: string): void {
    this.broadcast(
      {
        type: 'status_change',
        payload: { postId, status },
        timestamp: new Date().toISOString(),
      },
      userId
    );
  }

  /**
   * Генерация уникального ID клиента
   */
  private generateClientId(): string {
    return `client_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Получение количества подключённых клиентов
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Закрытие всех соединений
   */
  close(): void {
    if (this.wss) {
      this.clients.forEach((client) => {
        client.ws.close();
      });
      this.clients.clear();
      this.wss.close();
      this.wss = null;
      logger.info('WebSocket сервер закрыт');
    }
  }
}

export const webSocketService = new WebSocketService();
export default webSocketService;
