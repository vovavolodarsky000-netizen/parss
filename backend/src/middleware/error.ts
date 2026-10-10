import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors.js';
import logger from '../services/logger.js';
import { config } from '../config.js';

/**
 * Middleware для обработки всех ошибок
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // По умолчанию 500
  let statusCode = 500;
  let message = 'Внутренняя ошибка сервера';
  let errorCode = 'INTERNAL_ERROR';
  let isOperational = true;

  // Обработка наших кастомных ошибок
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errorCode = err.errorCode || 'APP_ERROR';
    isOperational = err.isOperational;
  }

  // Обработка ошибок валидации Zod
  if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Ошибка валидации данных';
    errorCode = 'VALIDATION_ERROR';
    isOperational = true;

    const errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    logger.warn('Ошибка валидации', {
      path: req.path,
      method: req.method,
      errors,
    });

    res.status(statusCode).json({
      success: false,
      error: {
        code: errorCode,
        message,
        details: errors,
      },
      ...(config.env === 'development' && { stack: err.stack }),
    });
    return;
  }

  // Обработка ошибок JWT
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Недействительный токен';
    errorCode = 'INVALID_TOKEN';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Срок действия токена истёк';
    errorCode = 'TOKEN_EXPIRED';
  }

  // Обработка ошибок Prisma
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as Error & { code?: string };
    switch (prismaError.code) {
      case 'P2002':
        statusCode = 409;
        message = 'Запись с такими данными уже существует';
        errorCode = 'DUPLICATE_ENTRY';
        break;
      case 'P2025':
        statusCode = 404;
        message = 'Запись не найдена';
        errorCode = 'NOT_FOUND';
        break;
      default:
        statusCode = 500;
        message = 'Ошибка базы данных';
        errorCode = 'DATABASE_ERROR';
    }
  }

  // Логирование ошибок
  if (!isOperational || statusCode >= 500) {
    logger.error('Неоперационная ошибка', {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      userId: req.user?.id,
    });
  } else {
    logger.warn('Операционная ошибка', {
      message: err.message,
      code: errorCode,
      path: req.path,
      method: req.method,
    });
  }

  // Отправляем ответ
  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
    },
    ...(config.env === 'development' && { stack: err.stack }),
  });
};

/**
 * Middleware для обработки несуществующих маршрутов
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Маршрут ${req.method} ${req.path} не найден`,
    },
  });
};

/**
 * Middleware для обработки необработанных исключений
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void | Response>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
