import dotenv from 'dotenv';
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  apiUrl: process.env.API_URL || 'http://localhost:4000',

  // База данных
  database: {
    url: process.env.DATABASE_URL || '',
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-only-default-secret-do-not-use-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-only-refresh-secret-do-not-use-in-production',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  // Telegram
  telegram: {
    apiId: process.env.TELEGRAM_API_ID || '',
    apiHash: process.env.TELEGRAM_API_HASH || '',
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
  },

  // CORS
  cors: {
    origin: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(','),
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  // Логирование
  log: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log',
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  // Безопасность
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
    sessionSecret: process.env.SESSION_SECRET || 'default-session-secret',
  },
};

export type Config = typeof config;

/**
 * Валидация критических переменных окружения (SEC-001)
 * В production режиме сервер не должен запускаться с дефолтными секретами
 */
export function validateConfig(): void {
  if (config.env === 'production') {
    const errors: string[] = [];

    if (!process.env.JWT_SECRET || config.jwt.secret.includes('dev-only')) {
      errors.push('JWT_SECRET: необходимо установить безопасный секретный ключ');
    }
    if (!process.env.JWT_REFRESH_SECRET || config.jwt.refreshSecret.includes('dev-only')) {
      errors.push('JWT_REFRESH_SECRET: необходимо установить безопасный секретный ключ');
    }
    if (!process.env.DATABASE_URL) {
      errors.push('DATABASE_URL: необходимо указать строку подключения к БД');
    }
    if (config.jwt.secret.length < 32) {
      errors.push('JWT_SECRET: минимальная длина 32 символа');
    }

    if (errors.length > 0) {
      console.error('❌ Ошибка конфигурации production окружения:');
      errors.forEach(e => console.error(`   - ${e}`));
      process.exit(1);
    }
  }
}
