import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { config } from '../config.js';

// Создаём папку для логов, если её нет
const logDir = path.dirname(config.log.file);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    if (stack) log += `\n${stack}`;
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    return log;
  })
);

export const logger = winston.createLogger({
  level: config.log.level,
  format: customFormat,
  transports: [
    // Вывод в консоль
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        customFormat
      ),
    }),
    // Общий лог файл
    new winston.transports.File({
      filename: config.log.file,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Лог ошибок
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5,
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' }),
  ],
});

// В development режиме логируем всё
if (config.env === 'development') {
  logger.level = 'debug';
}

export default logger;
