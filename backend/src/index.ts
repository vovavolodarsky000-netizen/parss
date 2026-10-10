import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { config, validateConfig } from './config.js';
import logger from './services/logger.js';
import { errorHandler, notFoundHandler, logRequest } from './middleware/error.js';
import { prisma } from './lib/prisma.js';
import webSocketService from './services/websocket.js';
import { csrfProtection, getCsrfToken } from './middleware/csrf.js';
import cookieParser from 'cookie-parser';

// Импорт маршрутов
import authRoutes from './routes/auth.js';
import channelsRoutes from './routes/channels.js';
import postsRoutes from './routes/posts.js';

const app = express();
const server = createServer(app);

// ============================================
// Базовые middleware безопасности
// ============================================

// Helmet для безопасности HTTP заголовков
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
        imgSrc: ["'self'", "data:", "https:", "http:"],
        connectSrc: ["'self'", "ws:", "wss:"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// CORS
app.use(
  cors({
    origin: (origin, callback) => {
      // Разрешаем запросы без origin (mobile apps, curl)
      if (!origin) return callback(null, true);

      if (config.cors.origin.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn('CORS: запрос заблокирован', { origin });
        callback(new Error('Не разрешено CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
  })
);

// Rate Limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Слишком много запросов. Попробуйте позже.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Cookie parser (для CSRF)
app.use(cookieParser());

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CSRF токен (должен быть ДО csrfProtection)
app.get('/api/csrf-token', getCsrfToken);

// CSRF защита (SEC-003)
// Применяется ко всем API маршрутам кроме /csrf-token
app.use('/api', (req, res, next) => {
  if (req.path === '/csrf-token') return next();
  return csrfProtection(req, res, next);
});

// Логирование запросов
app.use(logRequest);
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim()),
  },
}));

// ============================================
// Маршруты API
// ============================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.env,
    },
  });
});

// API Routes (v1)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/channels', channelsRoutes);
app.use('/api/v1/posts', postsRoutes);

// Legacy routes - redirect to v1
app.use('/api/auth', (req, res) => res.redirect(301, `/api/v1/auth${req.path}`));
app.use('/api/channels', (req, res) => res.redirect(301, `/api/v1/channels${req.path}`));
app.use('/api/posts', (req, res) => res.redirect(301, `/api/v1/posts${req.path}`));

// ============================================
// Обработка ошибок
// ============================================

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// ============================================
// Запуск сервера
// ============================================

const startServer = async () => {
  try {
    // Валидация конфигурации (SEC-001)
    validateConfig();

    // Проверяем подключение к базе данных
    await prisma.$connect();
    logger.info('✅ Подключение к базе данных установлено');

    // Инициализируем WebSocket
    webSocketService.initialize(server);
    logger.info('✅ WebSocket сервер инициализирован');

    // Запускаем сервер
    server.listen(config.port, () => {
      logger.info(`🚀 Сервер запущен на порту ${config.port}`);
      logger.info(`📡 API доступен по адресу: ${config.apiUrl}`);
      logger.info(`🔌 WebSocket доступен на ws://${config.apiUrl}/ws`);
      logger.info(`🌍 Окружение: ${config.env}`);
    });
  } catch (error) {
    logger.error('❌ Ошибка запуска сервера', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM получен. Завершение работы...');
  webSocketService.close();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT получен. Завершение работы...');
  webSocketService.close();
  await prisma.$disconnect();
  process.exit(0);
});

// Необработанные исключения
process.on('uncaughtException', (error) => {
  logger.error('Необработанное исключение', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Необработанное отклонение промиса', { reason });
  process.exit(1);
});

startServer();

export { app, server };
export default app;
