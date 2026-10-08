import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/error.js';
import { authenticate } from '../middleware/auth.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';
import logger from '../services/logger.js';

const router = Router();

router.use(authenticate);

/**
 * GET /api/posts
 * Получение списка постов
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const {
      page = '1',
      limit = '20',
      status,
      channelId,
      source,
      search,
      topic,
    } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: any = { userId: req.user!.id };

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
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / parseInt(limit as string)),
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
