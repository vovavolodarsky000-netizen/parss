import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';
import { prisma } from '../lib/prisma.js';
import logger from '../services/logger.js';

// Расширяем Request для TypeScript
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        username: string;
        role: string;
      };
    }
  }
}

interface JwtPayload {
  userId: string;
  email: string;
  username: string;
  role: string;
}

/**
 * Middleware для проверки JWT токена
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Токен авторизации не предоставлен');
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

    // Проверяем, что пользователь существует и активен
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, username: true, role: true, isActive: true },
    });

    if (!user) {
      throw new UnauthorizedError('Пользователь не найден');
    }

    if (!user.isActive) {
      throw new ForbiddenError('Аккаунт деактивирован');
    }

    req.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Недействительный JWT токен', { error: error.message });
      next(new UnauthorizedError('Недействительный токен'));
    } else if (error instanceof jwt.TokenExpiredError) {
      logger.warn('Истёк срок действия JWT токена');
      next(new UnauthorizedError('Срок действия токена истёк'));
    } else {
      next(error);
    }
  }
};

/**
 * Middleware для проверки ролей
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Необходима авторизация'));
      return;
    }

    if (!roles.includes(req.user.role)) {
      logger.warn('Попытка доступа с недостаточными правами', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
        path: req.path,
      });
      next(new ForbiddenError('Недостаточно прав для выполнения действия'));
      return;
    }

    next();
  };
};

/**
 * Middleware для проверки владельца ресурса
 */
export const checkOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Необходима авторизация');
    }

    // Админы могут всё
    if (req.user.role === 'ADMIN') {
      next();
      return;
    }

    // Проверяем поле userId в параметрах или теле запроса
    const resourceId = req.params.id;
    const model = req.params.model;

    if (!resourceId || !model) {
      next();
      return;
    }

    // Проверяем владельца в зависимости от модели
    let ownerId: string | null = null;

    switch (model) {
      case 'channels':
        const channel = await prisma.channel.findUnique({
          where: { id: resourceId },
          select: { userId: true },
        });
        ownerId = channel?.userId || null;
        break;
      case 'posts':
        const post = await prisma.post.findUnique({
          where: { id: resourceId },
          select: { userId: true },
        });
        ownerId = post?.userId || null;
        break;
      case 'sites':
        const site = await prisma.webSite.findUnique({
          where: { id: resourceId },
          select: { userId: true },
        });
        ownerId = site?.userId || null;
        break;
      default:
        next();
        return;
    }

    if (ownerId && ownerId !== req.user.id) {
      logger.warn('Попытка доступа к чужому ресурсу', {
        userId: req.user.id,
        resourceId,
        model,
        ownerId,
      });
      throw new ForbiddenError('Нет доступа к этому ресурсу');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware для логирования запросов
 */
export const logRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    };

    if (res.statusCode >= 400) {
      logger.warn('HTTP запрос с ошибкой', logData);
    } else {
      logger.info('HTTP запрос', logData);
    }
  });

  next();
};
