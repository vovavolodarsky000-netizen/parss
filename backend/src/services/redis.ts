import Redis from 'ioredis';
import { config } from '../config.js';
import logger from './logger.js';

/**
 * PERF-004: Redis клиент для кеширования
 */
class RedisService {
  private client: Redis | null = null;
  private isConnected = false;

  constructor() {
    if (config.redis.url) {
      this.client = new Redis(config.redis.url, {
        retryStrategy: (times) => {
          if (times > 3) {
            logger.warn('Redis: превышено количество попыток подключения');
            return null;
          }
          return Math.min(times * 200, 2000);
        },
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        logger.info('Redis: подключение установлено');
      });

      this.client.on('error', (err) => {
        logger.error('Redis: ошибка подключения', { error: err.message });
        this.isConnected = false;
      });

      this.client.on('close', () => {
        this.isConnected = false;
        logger.warn('Redis: соединение закрыто');
      });
    } else {
      logger.warn('Redis: URL не указан, кеширование отключено');
    }
  }

  /**
   * Получить значение из кеша
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.client || !this.isConnected) {
      return null;
    }

    try {
      const value = await this.client.get(key);
      if (value) {
        return JSON.parse(value) as T;
      }
      return null;
    } catch (error) {
      logger.error('Redis: ошибка получения значения', { 
        key, 
        error: error instanceof Error ? error.message : String(error) 
      });
      return null;
    }
  }

  /**
   * Установить значение в кеш
   */
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.client.set(key, serialized, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, serialized);
      }
      return true;
    } catch (error) {
      logger.error('Redis: ошибка установки значения', { 
        key, 
        error: error instanceof Error ? error.message : String(error) 
      });
      return false;
    }
  }

  /**
   * Удалить значение из кеша
   */
  async del(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error('Redis: ошибка удаления значения', { 
        key, 
        error: error instanceof Error ? error.message : String(error) 
      });
      return false;
    }
  }

  /**
   * Очистить все ключи по паттерну
   */
  async flushPattern(pattern: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
      return true;
    } catch (error) {
      logger.error('Redis: ошибка очистки по паттерну', { pattern, error });
      return false;
    }
  }

  /**
   * Закрыть соединение
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
    }
  }
}

export const redisService = new RedisService();
export default redisService;
