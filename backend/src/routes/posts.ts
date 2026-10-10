import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/error.js';
import { authenticate } from '../middleware/auth.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';
import logger from '../services/logger.js';

// Схема валидации query-параметров (аналогично channels.ts)
const postQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.string().optional(),
  channelId: z.string().optional(),
  source: z.string().optional(),
  search: z.string().optional(),
  topic: z.string().optional(),
});

const router = Router();

router.use(authenticate);

/**
 * GET /api/posts
 * Получение списка постов
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    // Валидация query-параметров
    const query = postQuerySchema.parse(req.query);
    const { page, limit, status, channelId, source, search } = query;

    const skip = (page - 1) * limit;
    const take = limit;

    const where: {
      userId: string;
      status?: string;
      channelId?: string;
      source?: string;
      text?: { contains: string; mode: 'insensitive' };
    } = { userId: req.user!.id };

    if (status) {
      where.status = status;
    }

    if (channelId) {
      where.channelId = channelId;
    }

    if (source) {
      where.source = source;
    }

    if (search) {
      where.text = { contains: search as string, mode: 'insensitive' };
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip,
        take,
        include: {
          channel: true,
          tags: true,
        },
        orderBy: { date: 'desc' },
      }),
      prisma.post.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        posts: posts.map((p) => ({
          ...p,
          tags: p.tags.map((t) => t.tag),
          channelTitle: p.channel.title,
          channelUsername: p.channel.username,
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
 * PUT /api/posts/:id/status
 * Обновление статуса поста
 */
router.put(
  '/:id/status',
  asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.body;

    if (!['NEW', 'APPROVED', 'PUBLISHED', 'REJECTED'].includes(status)) {
      throw new BadRequestError('Недопустимый статус');
    }

    const post = await prisma.post.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    });

    if (!post) {
      throw new NotFoundError('Пост не найден');
    }

    await prisma.post.update({
      where: { id: post.id },
      data: { status },
    });

    // Логируем действие
    await prisma.publishLog.create({
      data: {
        userId: req.user!.id,
        postId: post.id,
        action: 'STATUS_CHANGED',
        status,
        message: `Статус поста изменён на ${status}`,
      },
    });

    logger.info('Статус поста изменён', {
      userId: req.user!.id,
      postId: post.id,
      status,
    });

    res.json({
      success: true,
      message: 'Статус обновлён',
    });
  })
);

/**
 * PUT /api/posts/bulk-status
 * Массовое обновление статусов
 */
router.put(
  '/bulk-status',
  asyncHandler(async (req: Request, res: Response) => {
    const { ids, status } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestError('Список ID обязателен');
    }

    if (!['NEW', 'APPROVED', 'PUBLISHED', 'REJECTED'].includes(status)) {
      throw new BadRequestError('Недопустимый статус');
    }

    const result = await prisma.post.updateMany({
      where: {
        id: { in: ids },
        userId: req.user!.id,
      },
      data: { status },
    });

    logger.info('Массовое обновление статусов', {
      userId: req.user!.id,
      count: result.count,
      status,
    });

    res.json({
      success: true,
      data: { updated: result.count },
    });
  })
);

/**
 * GET /api/posts/stats
 * Статистика постов
 */
router.get(
  '/stats',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const [total, byStatus, today] = await Promise.all([
      prisma.post.count({ where: { userId } }),
      prisma.post.groupBy({
        by: ['status'],
        where: { userId },
        _count: true,
      }),
      prisma.post.count({
        where: {
          userId,
          date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
    ]);

    const statusStats = byStatus.reduce((acc, item) => {
      acc[item.status] = item._count;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      success: true,
      data: {
        total,
        today,
        byStatus: statusStats,
      },
    });
  })
);

export default router;
