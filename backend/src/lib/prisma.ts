import { PrismaClient } from '@prisma/client';
import logger from '../services/logger.js';

// Глобальный экземпляр для предотвращения создания множества клиентов в dev
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: [
      { level: 'query', emit: 'event' },
      { level: 'error', emit: 'event' },
      { level: 'warn', emit: 'event' },
    ],
  });

interface PrismaLogEvent {
  query: string;
  params: string;
  duration: number;
  message?: string;
}

// Логирование запросов в development
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;

  prisma.$on('query' as never, (e: PrismaLogEvent) => {
    logger.debug('Query', {
      query: e.query,
      params: e.params,
      duration: `${e.duration}ms`,
    });
  });

  prisma.$on('error' as never, (e: PrismaLogEvent) => {
    logger.error('Prisma error', { message: e.message });
  });

  prisma.$on('warn' as never, (e: PrismaLogEvent) => {
    logger.warn('Prisma warning', { message: e.message });
  });
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;
