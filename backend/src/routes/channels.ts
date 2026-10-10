import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/error.js';
import { authenticate } from '../middleware/auth.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';
import logger from '../services/logger.js';
import telegramService from '../services/telegram.js';

// Схема валидации query-параметров (BACK-003)
const channelQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  isActive: z.string().optional().transform(v => v === undefined ? undefined : v === 'true'),
  category: z.string().optional(),
  topic: z.string().optional(),
});

const router = Router();

// Все маршруты требуют аутентификации
router.use(authenticate);

// Схемы валидации
const createChannelSchema = z.object({
  username: z.string().min(1, 'Username обязателен'),
  title: z.string().min(1, 'Название обязательно'),
  category: z.string().min(1, 'Категория обязательна'),
  topics: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
});

/**
 * GET /api/channels
 * Получение списка каналов пользователя
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    // Валидация query-параметров (BACK-003)
    const query = channelQuerySchema.parse(req.query);
    const { page, limit, isActive, category, topic } = query;

    const skip = (page - 1) * limit;
    const take = limit;

    const where: {
      userId: string;
      isActive?: boolean;
      category?: string;
      topics?: { some: { topic: { name: string } } };
    } = { userId: req.user!.id };

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (category) {
      where.category = category;
    }

    if (topic) {
      where.topics = {
        some: {
          topic: { name: topic },
        },
      };
    }

    // Оптимизированный запрос: используем include для избежания N+1
    const [channels, total] = await Promise.all([
      prisma.channel.findMany({
        where,
        skip,
        take,
        include: {
          topics: {
            include: { topic: true },
          },
          keywords: true,
          _count: {
            select: { posts: true },
          },
        },
        orderBy: { addedAt: 'desc' },
      }),
      prisma.channel.count({ where }),
    ]);

    // PERF-004: В production использовать Redis для кэширования
    // См. backend/src/services/redis.ts

    res.json({
      success: true,
      data: {
        channels: channels.map((ch) => ({
          ...ch,
          topics: ch.topics.map((t) => t.topic.name),
          keywords: ch.keywords.map((k) => k.keyword),
          postsCount: ch._count.posts,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  })
);

/**
 * GET /api/channels/:id
 * Получение информации о канале
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const channel = await prisma.channel.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
      include: {
        topics: { include: { topic: true } },
        keywords: true,
        posts: {
          take: 10,
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!channel) {
      throw new NotFoundError('Канал не найден');
    }

    res.json({
      success: true,
      data: {
        ...channel,
        topics: channel.topics.map((t) => t.topic.name),
        keywords: channel.keywords.map((k) => k.keyword),
      },
    });
  })
);

/**
 * POST /api/channels
 * Добавление нового канала
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const data = createChannelSchema.parse(req.body);

    // Проверяем, не добавлен ли уже этот канал
    const existing = await prisma.channel.findFirst({
      where: { userId: req.user!.id, username: data.username },
    });

    if (existing) {
      throw new BadRequestError('Канал уже добавлен');
    }

    // Пытаемся получить информацию из Telegram
    let subscribers = 0;
    let avatar: string | undefined;

    try {
      const channelInfo = await telegramService.getChannelInfo(data.username);
      subscribers = channelInfo.subscribers;
      avatar = channelInfo.avatar;
    } catch (error) {
      logger.warn('Не удалось получить информацию из Telegram', { 
        username: data.username,
        error: error instanceof Error ? error.message : String(error)
      });
    }

    // Создаём канал
    const channel = await prisma.channel.create({
      data: {
        userId: req.user!.id,
        username: data.username,
        title: data.title,
        category: data.category,
        subscribers,
        avatar,
        topics: data.topics
          ? {
              create: await Promise.all(
                data.topics.map(async (topicName) => {
                  // Используем upsert для избежания race conditions
                  const topic = await prisma.topic.upsert({
                    where: { name: topicName },
                    update: {},
                    create: { name: topicName },
                  });
                  return { topicId: topic.id };
                })
              ),
            }
          : undefined,
        keywords: data.keywords
          ? {
              create: data.keywords.map((keyword) => ({ keyword })),
            }
          : undefined,
      },
      include: {
        topics: { include: { topic: true } },
        keywords: true,
      },
    });

    // Логируем действие
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'CHANNEL_CREATED',
        entity: 'Channel',
        entityId: channel.id,
        metadata: { username: data.username },
      },
    });

    logger.info('Канал добавлен', {
      userId: req.user!.id,
      channelId: channel.id,
      username: data.username,
    });

    res.status(201).json({
      success: true,
      data: {
        ...channel,
        topics: channel.topics.map((t) => t.topic.name),
        keywords: channel.keywords.map((k) => k.keyword),
      },
    });
  })
);

/**
 * PUT /api/channels/:id
 * Обновление канала
 */
router.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { title, category, isActive, topics, keywords } = req.body;

    const channel = await prisma.channel.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    });

    if (!channel) {
      throw new NotFoundError('Канал не найден');
    }

    // Обновляем канал
    const updated = await prisma.channel.update({
      where: { id: channel.id },
      data: {
        ...(title && { title }),
        ...(category && { category }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    // Обновляем тематики
    if (topics) {
      await prisma.channelTopic.deleteMany({ where: { channelId: channel.id } });
      await prisma.channelTopic.createMany({
        data: await Promise.all(
          topics.map(async (topicName: string) => {
            // Используем upsert для избежания race conditions
            const topic = await prisma.topic.upsert({
              where: { name: topicName },
              update: {},
              create: { name: topicName },
            });
            return { channelId: channel.id, topicId: topic.id };
          })
        ),
      });
    }

    // Обновляем ключевые слова
    if (keywords) {
      await prisma.channelKeyword.deleteMany({ where: { channelId: channel.id } });
      await prisma.channelKeyword.createMany({
        data: keywords.map((keyword: string) => ({
          channelId: channel.id,
          keyword,
        })),
      });
    }

    logger.info('Канал обновлён', {
      userId: req.user!.id,
      channelId: channel.id,
    });

    res.json({
      success: true,
      data: updated,
    });
  })
);

/**
 * DELETE /api/channels/:id
 * Удаление канала
 */
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const channel = await prisma.channel.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    });

    if (!channel) {
      throw new NotFoundError('Канал не найден');
    }

    await prisma.channel.delete({ where: { id: channel.id } });

    // Логируем действие
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'CHANNEL_DELETED',
        entity: 'Channel',
        entityId: channel.id,
        metadata: { username: channel.username },
      },
    });

    logger.info('Канал удалён', {
      userId: req.user!.id,
      channelId: channel.id,
    });

    res.json({
      success: true,
      message: 'Канал удалён',
    });
  })
);

/**
 * POST /api/channels/:id/parse
 * Запуск парсинга канала
 */
router.post(
  '/:id/parse',
  asyncHandler(async (req: Request, res: Response) => {
    const channel = await prisma.channel.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
      include: { keywords: true },
    });

    if (!channel) {
      throw new NotFoundError('Канал не найден');
    }

    const { limit = 50 } = req.body;

    try {
      // Парсим сообщения из Telegram
      const messages = await telegramService.parseChannelMessages(
        channel.username,
        limit,
        channel.lastParsedAt || undefined
      );

      // Сохраняем новые посты
      const newPosts = [];
      for (const msg of messages) {
        // Проверяем, не сохранён ли уже этот пост
        const existing = await prisma.post.findFirst({
          where: {
            channelId: channel.id,
            telegramMsgId: msg.id.toString(),
          },
        });

        if (existing) continue;

        const post = await prisma.post.create({
          data: {
            userId: req.user!.id,
            channelId: channel.id,
            telegramMsgId: msg.id.toString(),
            text: msg.text,
            mediaType: msg.mediaType.toUpperCase() as 'TEXT' | 'PHOTO' | 'VIDEO' | 'DOCUMENT',
            mediaUrl: msg.mediaUrl,
            views: msg.views,
            date: msg.date,
            hasMedia: msg.hasMedia,
          },
        });

        newPosts.push(post);
      }

      // Обновляем время последнего парсинга
      await prisma.channel.update({
        where: { id: channel.id },
        data: { lastParsedAt: new Date() },
      });

      // Логируем действие
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'CHANNEL_PARSED',
          entity: 'Channel',
          entityId: channel.id,
          metadata: { newPostsCount: newPosts.length },
        },
      });

      logger.info('Канал спарсен', {
        userId: req.user!.id,
        channelId: channel.id,
        newPostsCount: newPosts.length,
      });

      res.json({
        success: true,
        data: {
          parsedMessages: messages.length,
          newPosts: newPosts.length,
        },
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      logger.error('Ошибка парсинга канала', {
        channelId: channel.id,
        error: errorMessage,
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'PARSE_ERROR',
          message: errorMessage,
        },
      });
    }
  })
);

export default router;
