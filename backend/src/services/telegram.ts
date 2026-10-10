import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import { Api } from 'telegram';
import logger from './logger.js';
import { TelegramApiError } from '../utils/errors.js';
import { config } from '../config.js';

interface TelegramEntity {
  id: number;
  className?: string;
  username?: string;
  title?: string;
  participantsCount?: number;
}

interface TelegramMedia {
  className: string;
  document?: {
    attributes?: Array<{ className: string }>;
  };
}

interface TelegramMessage {
  id: number;
  message?: string;
  date: number;
  views?: number;
  media?: TelegramMedia;
}

export interface TelegramMessage {
  id: number;
  text: string;
  date: Date;
  views: number;
  mediaType: 'text' | 'photo' | 'video' | 'document';
  mediaUrl?: string;
  hasMedia: boolean;
  channelId: string;
  channelTitle: string;
  channelUsername: string;
}

export interface TelegramChannel {
  id: string;
  username: string;
  title: string;
  subscribers: number;
  avatar?: string;
}

/**
 * Сервис для работы с Telegram API
 */
class TelegramService {
  private client: TelegramClient | null = null;
  private session: StringSession | null = null;

  /**
   * Инициализация клиента Telegram
   */
  async initialize(sessionString?: string): Promise<void> {
    try {
      if (!config.telegram.apiId || !config.telegram.apiHash) {
        throw new TelegramApiError('TELEGRAM_API_ID и TELEGRAM_API_HASH не настроены');
      }

      this.session = new StringSession(sessionString || '');
      this.client = new TelegramClient(
        this.session,
        parseInt(config.telegram.apiId, 10),
        config.telegram.apiHash,
        {
          connectionRetries: 5,
          useWSS: true,
        }
      );

      logger.info('Telegram клиент инициализирован');
    } catch (error) {
      logger.error('Ошибка инициализации Telegram клиента', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      throw new TelegramApiError('Не удалось инициализировать Telegram клиент');
    }
  }

  /**
   * Авторизация в Telegram
   */
  async authorize(phone: string, phoneCodeHandler: () => Promise<string>): Promise<string> {
    if (!this.client) {
      throw new TelegramApiError('Клиент не инициализирован');
    }

    try {
      await this.client.start({
        phoneNumber: phone,
        phoneCode: phoneCodeHandler,
        password: undefined,
        onError: (err: Error) => {
          logger.error('Ошибка Telegram авторизации', { error: err.message });
        },
      });

      const sessionString = (this.session as StringSession).save();
      logger.info('Успешная авторизация в Telegram', { phone });

      return sessionString;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      logger.error('Ошибка авторизации в Telegram', { error: errorMessage });
      throw new TelegramApiError(`Ошибка авторизации: ${errorMessage}`);
    }
  }

  /**
   * Получение информации о канале
   */
  async getChannelInfo(username: string): Promise<TelegramChannel> {
    if (!this.client) {
      throw new TelegramApiError('Клиент не инициализирован');
    }

    try {
      const entity = await this.client.getEntity(username);

      if (!entity) {
        throw new TelegramApiError(`Канал @${username} не найден`);
      }

      const telegramEntity = entity as TelegramEntity;

      const channel: TelegramChannel = {
        id: telegramEntity.id.toString(),
        username: telegramEntity.username || username,
        title: telegramEntity.title || username,
        subscribers: telegramEntity.participantsCount || 0,
      };

      logger.info('Получена информация о канале', { username, title: channel.title });
      return channel;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      logger.error('Ошибка получения информации о канале', { username, error: errorMessage });
      throw new TelegramApiError(`Не удалось получить информацию о канале @${username}`);
    }
  }

  /**
   * Парсинг сообщений из канала
   */
  async parseChannelMessages(
    username: string,
    limit: number = 50,
    offsetDate?: Date
  ): Promise<TelegramMessage[]> {
    if (!this.client) {
      throw new TelegramApiError('Клиент не инициализирован');
    }

    try {
      const entity = await this.client.getEntity(username);

      if (!entity) {
        throw new TelegramApiError(`Канал @${username} не найден`);
      }

      const messages = await this.client.getMessages(entity, {
        limit,
        offsetDate: offsetDate ? Math.floor(offsetDate.getTime() / 1000) : undefined,
      });

      const telegramEntity = entity as TelegramEntity;
      const channelTitle = telegramEntity.title || username;
      const channelUsername = telegramEntity.username || username;

      const parsedMessages: TelegramMessage[] = messages.map((msg: TelegramMessage) => {
        let mediaType: 'text' | 'photo' | 'video' | 'document' = 'text';
        let mediaUrl: string | undefined;
        let hasMedia = false;

        if (msg.media) {
          hasMedia = true;
          if (msg.media.className === 'MessageMediaPhoto') {
            mediaType = 'photo';
          } else if (msg.media.className === 'MessageMediaDocument') {
            const document = msg.media.document;
            if (document?.attributes?.some((attr: { className: string }) => attr.className === 'DocumentAttributeVideo')) {
              mediaType = 'video';
            } else {
              mediaType = 'document';
            }
          }
        }

        return {
          id: msg.id,
          text: msg.message || '',
          date: new Date(msg.date * 1000),
          views: msg.views || 0,
          mediaType,
          mediaUrl,
          hasMedia,
          channelId: entity.id.toString(),
          channelTitle,
          channelUsername,
        };
      });

      logger.info('Спарсены сообщения из канала', {
        username,
        count: parsedMessages.length,
      });

      return parsedMessages;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      logger.error('Ошибка парсинга канала', { username, error: errorMessage });
      throw new TelegramApiError(`Не удалось получить сообщения из канала @${username}`);
    }
  }

  /**
   * Отправка сообщения в канал
   */
  async sendMessage(
    username: string,
    text: string,
    mediaUrl?: string
  ): Promise<void> {
    if (!this.client) {
      throw new TelegramApiError('Клиент не инициализирован');
    }

    try {
      const entity = await this.client.getEntity(username);

      if (!entity) {
        throw new TelegramApiError(`Канал @${username} не найден`);
      }

      await this.client.sendMessage(entity, { message: text });

      logger.info('Сообщение отправлено в канал', { username });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      logger.error('Ошибка отправки сообщения', { username, error: errorMessage });
      throw new TelegramApiError(`Не удалось отправить сообщение в канал @${username}`);
    }
  }

  /**
   * Проверка подключения
   */
  async isConnected(): Promise<boolean> {
    if (!this.client) return false;

    try {
      const me = await this.client.getMe();
      return !!me;
    } catch {
      return false;
    }
  }

  /**
   * Отключение клиента
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
      this.client = null;
      this.session = null;
      logger.info('Telegram клиент отключён');
    }
  }
}

export const telegramService = new TelegramService();
export default telegramService;
