import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { config } from '../config.js';
import { asyncHandler } from '../middleware/error.js';
import { authenticate } from '../middleware/auth.js';
import { BadRequestError, UnauthorizedError, ConflictError } from '../utils/errors.js';
import logger from '../services/logger.js';

const router = Router();

// Схемы валидации
const registerSchema = z.object({
  email: z.string().email('Неверный формат email'),
  username: z.string().min(3, 'Минимум 3 символа').max(30, 'Максимум 30 символов'),
  password: z.string().min(8, 'Минимум 8 символов'),
});

const loginSchema = z.object({
  email: z.string().email('Неверный формат email'),
  password: z.string().min(1, 'Пароль обязателен'),
});

/**
 * POST /api/auth/register
 * Регистрация нового пользователя
 */
router.post(
  '/register',
  asyncHandler(async (req: Request, res: Response) => {
    const data = registerSchema.parse(req.body);

    // Проверяем, существует ли пользователь
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { username: data.username }],
      },
    });

    if (existingUser) {
      throw new ConflictError('Пользователь с таким email или username уже существует');
    }

    // Хешируем пароль
    const passwordHash = await bcrypt.hash(data.password, config.security.bcryptRounds);

    // Создаём пользователя
    const user = await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
      },
    });

    // Создаём настройки по умолчанию
    await prisma.parserSettings.create({
      data: {
        userId: user.id,
      },
    });

    // Генерируем токены
    const tokens = generateTokens(user.id, user.email, user.username, user.role);

    // Сохраняем refresh token
    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 дней
      },
    });

    // Логируем действие
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_REGISTERED',
        entity: 'User',
        entityId: user.id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    logger.info('Новый пользователь зарегистрирован', {
      userId: user.id,
      email: user.email,
    });

    res.status(201).json({
      success: true,
      data: {
        user,
        tokens,
      },
    });
  })
);

/**
 * POST /api/auth/login
 * Авторизация пользователя
 */
router.post(
  '/login',
  asyncHandler(async (req: Request, res: Response) => {
    const data = loginSchema.parse(req.body);

    // Ищем пользователя
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new UnauthorizedError('Неверный email или пароль');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Аккаунт деактивирован');
    }

    // Проверяем пароль
    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Неверный email или пароль');
    }

    // Обновляем время последнего входа
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Генерируем токены
    const tokens = generateTokens(user.id, user.email, user.username, user.role);

    // Сохраняем refresh token
    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    // Логируем действие
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_LOGIN',
        entity: 'User',
        entityId: user.id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    logger.info('Пользователь вошёл в систему', {
      userId: user.id,
      email: user.email,
    });

    // SEC-002: устанавливаем токены в httpOnly cookies
    res.cookie('access_token', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
    });

    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 дней
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
        },
        // SEC-002: не возвращаем токены в теле ответа
      },
    });
  })
);

/**
 * POST /api/auth/refresh
 * Обновление токена
 */
router.post(
  '/refresh',
  asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new BadRequestError('Refresh token не предоставлен');
    }

    // Проверяем refresh token в базе
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken) {
      throw new UnauthorizedError('Недействительный refresh token');
    }

    if (storedToken.expiresAt < new Date()) {
      // Удаляем истёкший токен
      await prisma.refreshToken.delete({ where: { id: storedToken.id } });
      throw new UnauthorizedError('Срок действия refresh token истёк');
    }

    if (!storedToken.user.isActive) {
      throw new UnauthorizedError('Аккаунт деактивирован');
    }

    // Удаляем старый refresh token
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });

    // Генерируем новые токены
    const tokens = generateTokens(
      storedToken.user.id,
      storedToken.user.email,
      storedToken.user.username,
      storedToken.user.role
    );

    // Сохраняем новый refresh token
    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: storedToken.user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    res.json({
      success: true,
      data: { tokens },
    });
  })
);

/**
 * POST /api/auth/logout
 * Выход из системы
 */
router.post(
  '/logout',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken, userId: req.user!.id },
      });
    }

    // Логируем действие
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'USER_LOGOUT',
        entity: 'User',
        entityId: req.user!.id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    logger.info('Пользователь вышел из системы', { userId: req.user!.id });

    res.json({
      success: true,
      message: 'Выход выполнен успешно',
    });
  })
);

/**
 * GET /api/auth/me
 * Получение информации о текущем пользователе
 */
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        _count: {
          select: {
            channels: true,
            webSites: true,
            posts: true,
            webPosts: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: user,
    });
  })
);

/**
 * PUT /api/auth/password
 * Изменение пароля
 */
router.put(
  '/password',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new BadRequestError('Текущий и новый пароль обязательны');
    }

    if (newPassword.length < 8) {
      throw new BadRequestError('Новый пароль должен содержать минимум 8 символов');
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });

    if (!user) {
      throw new UnauthorizedError('Пользователь не найден');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isPasswordValid) {
      throw new BadRequestError('Неверный текущий пароль');
    }

    const passwordHash = await bcrypt.hash(newPassword, config.security.bcryptRounds);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // Удаляем все refresh tokens (требует повторного входа)
    await prisma.refreshToken.deleteMany({
      where: { userId: user.id },
    });

    logger.info('Пароль изменён', { userId: user.id });

    res.json({
      success: true,
      message: 'Пароль успешно изменён',
    });
  })
);

/**
 * Генерация JWT токенов
 */
function generateTokens(
  userId: string,
  email: string,
  username: string,
  role: string
) {
  const accessToken = jwt.sign(
    { userId, email, username, role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  const refreshToken = jwt.sign(
    { userId },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn }
  );

  return { accessToken, refreshToken };
}

export default router;
