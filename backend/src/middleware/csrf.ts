/**
 * CSRF защита с использованием Double Submit Cookie pattern
 * Альтернатива устаревшему csurf пакету (SEC-003)
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { config } from '../config.js';
import logger from './logger.js';

const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Генерация CSRF токена
 */
function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Middleware для генерации и проверки CSRF токенов
 */
export const csrfProtection = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Для безопасных методов (GET, HEAD, OPTIONS) — только генерируем токен
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    const token = generateCsrfToken();
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: false, // Должен быть доступен JS
      secure: config.env === 'production',
      sameSite: 'strict',
      maxAge: 3600000, // 1 час
    });
    next();
    return;
  }

  // Для опасных методов (POST, PUT, DELETE, PATCH) — проверяем токен
  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.headers[CSRF_HEADER_NAME] as string;

  // Если CSRF проверка отключена для тестов
  if (config.env === 'test') {
    next();
    return;
  }

  // Если нет токена в cookie или header
  if (!cookieToken || !headerToken) {
    logger.warn('CSRF: отсутствует токен', {
      method: req.method,
      path: req.path,
      hasCookie: !!cookieToken,
      hasHeader: !!headerToken,
    });
    res.status(403).json({
      success: false,
      error: {
        code: 'CSRF_TOKEN_MISSING',
        message: 'CSRF токен отсутствует. Обновите страницу и попробуйте снова.',
      },
    });
    return;
  }

  // Сравнение токенов (timing-safe)
  const cookieBuffer = Buffer.from(cookieToken);
  const headerBuffer = Buffer.from(headerToken);

  if (
    cookieBuffer.length !== headerBuffer.length ||
    !crypto.timingSafeEqual(cookieBuffer, headerBuffer)
  ) {
    logger.warn('CSRF: недействительный токен', {
      method: req.method,
      path: req.path,
      userId: req.user?.id,
    });
    res.status(403).json({
      success: false,
      error: {
        code: 'CSRF_TOKEN_INVALID',
        message: 'Недействительный CSRF токен. Обновите страницу и попробуйте снова.',
      },
    });
    return;
  }

  next();
};

/**
 * Middleware для получения CSRF токена (для SPA)
 */
export const getCsrfToken = (
  req: Request,
  res: Response
): void => {
  const token = generateCsrfToken();
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    secure: config.env === 'production',
    sameSite: 'strict',
    maxAge: 3600000,
  });
  res.json({ success: true, data: { csrfToken: token } });
};
