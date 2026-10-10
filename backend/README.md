# TG Parser Backend

Production-ready бэкенд для парсера Telegram каналов и веб-сайтов с полной аутентификацией, базой данных, интеграцией с Telegram API и real-time уведомлениями.

## 🛠 Технологии

- **Node.js 18+** + **TypeScript 5**
- **Express.js 4** — веб-фреймворк
- **PostgreSQL 15** + **Prisma ORM 5** — база данных
- **JWT** — аутентификация с httpOnly cookies
- **gram.js (telegram)** — Telegram API
- **cheerio** — парсинг веб-сайтов
- **Winston** — профессиональное логирование
- **Helmet** + **CORS** + **Rate Limiting** — безопасность
- **CSRF Protection** — защита от CSRF атак
- **Zod** — валидация данных
- **WebSocket (ws)** — real-time уведомления
- **Redis (ioredis)** — кеширование
- **Bull** — очереди задач (опционально)

## 📋 Требования

- Node.js 18+
- PostgreSQL 15+
- Redis 6+ (опционально, для кеширования)

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
cd backend
npm install
```

### 2. Настройка переменных окружения

```bash
cp .env.example .env
```

Отредактируйте `.env`:

```env
# Server
NODE_ENV=development
PORT=4000
API_URL=http://localhost:4000

# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/tg_parser?schema=public"

# JWT (минимум 32 символа для production)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key

# Telegram API (получите на https://my.telegram.org)
TELEGRAM_API_ID=your_api_id
TELEGRAM_API_HASH=your_api_hash
TELEGRAM_BOT_TOKEN=optional_bot_token

# CORS
CORS_ORIGIN=http://localhost:5173,http://localhost:3000

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security
BCRYPT_ROUNDS=10
SESSION_SECRET=your-session-secret
```

### 3. Настройка базы данных

```bash
# Генерация Prisma клиента
npm run prisma:generate

# Создание миграций
npm run prisma:migrate

# Запуск seed (опционально)
npm run prisma:seed
```

### 4. Запуск сервера

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

Сервер будет доступен по адресу: `http://localhost:4000`

## 📡 API Endpoints

### CSRF Token

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/csrf-token` | Получение CSRF токена |

### Аутентификация

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/v1/auth/register` | Регистрация |
| POST | `/api/v1/auth/login` | Вход |
| POST | `/api/v1/auth/refresh` | Обновление токена |
| POST | `/api/v1/auth/logout` | Выход |
| GET | `/api/v1/auth/me` | Информация о пользователе |
| PUT | `/api/v1/auth/password` | Изменение пароля |

### Каналы

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/v1/channels` | Список каналов |
| GET | `/api/v1/channels/:id` | Информация о канале |
| POST | `/api/v1/channels` | Добавить канал |
| PUT | `/api/v1/channels/:id` | Обновить канал |
| DELETE | `/api/v1/channels/:id` | Удалить канал |
| POST | `/api/v1/channels/:id/parse` | Запустить парсинг |

### Посты

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/v1/posts` | Список постов |
| GET | `/api/v1/posts/stats` | Статистика |
| PUT | `/api/v1/posts/:id/status` | Изменить статус |
| PUT | `/api/v1/posts/bulk-status` | Массовое обновление |

### WebSocket

```
ws://localhost:4000/ws
```

События:
- `authenticate` — аутентификация клиента
- `subscribe` — подписка на канал
- `new_post` — новый пост
- `parse_complete` — парсинг завершен
- `status_change` — изменение статуса

## 🔐 Аутентификация

### HttpOnly Cookies (Рекомендуется)

Токены автоматически устанавливаются в httpOnly cookies при login/register:

```bash
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}' \
  -c cookies.txt
```

Cookies будут установлены автоматически:
- `access_token` — JWT токен (7 дней)
- `refresh_token` — Refresh токен (30 дней)

### Bearer Token (Альтернатива)

Все защищённые маршруты также принимают заголовок:

```
Authorization: Bearer <access_token>
```

### CSRF Защита

Все mutating запросы (POST, PUT, DELETE, PATCH) требуют CSRF токен:

1. Получите CSRF токен:
```bash
curl http://localhost:4000/api/csrf-token -c cookies.txt
```

2. Используйте токен в заголовке:
```bash
curl -X POST http://localhost:4000/api/v1/channels \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: <csrf_token>" \
  -b cookies.txt \
  -d '{"username": "durov", "title": "Durov", "category": "Tech"}'
```

## 🗄 Структура базы данных

### Основные модели

- **User** — пользователи с ролями (USER, ADMIN, MODERATOR)
- **Channel** — Telegram каналы с тематиками и ключевыми словами
- **Post** — посты из Telegram с медиа и тегами
- **WebSite** — веб-сайты для парсинга
- **WebPost** — посты с веб-сайтов
- **ParseRule** — правила парсинга с CSS-селекторами
- **Topic** — тематики (связь многие-ко-многим)
- **RefreshToken** — refresh токены для JWT
- **AuditLog** — логи аудита действий
- **PublishLog** — логи публикации
- **ParserSettings** — настройки парсера для каждого пользователя
- **ParsingJob** — очереди задач парсинга

### Связи

```
User 1:N Channel
User 1:N Post
User 1:N WebSite
User 1:N WebPost
Channel 1:N Post
Channel N:M Topic
WebSite 1:N WebPost
WebSite 1:N ParseRule
WebSite N:M Topic
Post 1:N PostTag
WebPost 1:N WebPostTag
```

### Индексы

Оптимизированные индексы для частых запросов:
- `User.email`, `User.username`
- `Channel.userId`, `Channel.isActive`
- `Post.userId`, `Post.channelId`, `Post.status`, `Post.date`
- `WebSite.userId`, `WebSite.isActive`
- `WebPost.userId`, `WebPost.siteId`, `WebPost.status`, `WebPost.date`

## 🔒 Безопасность

### Реализованные меры

**Аутентификация:**
- ✅ JWT токены в httpOnly cookies
- ✅ Refresh токены с длительным сроком жизни
- ✅ Автоматическое обновление access токенов
- ✅ Валидация токенов на каждом запросе
- ✅ Проверка активности пользователя

**CSRF защита:**
- ✅ Double Submit Cookie pattern
- ✅ CSRF токен в cookie и заголовке
- ✅ Timing-safe сравнение токенов
- ✅ Автоматическое обновление при истечении
- ✅ Исключение GET/HEAD/OPTIONS из проверки

**HTTP безопасность:**
- ✅ Helmet для защиты HTTP заголовков
- ✅ Content Security Policy (CSP)
- ✅ X-Frame-Options, X-Content-Type-Options
- ✅ Strict-Transport-Security (HSTS)
- ✅ Referrer-Policy

**Защита от атак:**
- ✅ Rate Limiting (100 запросов / 15 минут)
- ✅ CORS с whitelist origin
- ✅ Валидация всех входных данных (Zod)
- ✅ Защита от SQL injection (Prisma)
- ✅ Защита от XSS (React + CSP)
- ✅ bcrypt хеширование паролей (10 раундов)

**Production security:**
- ✅ Валидация JWT секретов при старте
- ✅ Проверка длины секретов (минимум 32 символа)
- ✅ Обязательные переменные окружения
- ✅ Graceful shutdown
- ✅ Логирование всех ошибок

### Безопасные практики

✅ **Правильно:**
- Токены в httpOnly cookies
- CSRF защита на всех mutating запросах
- Валидация всех входных данных
- Rate limiting на API
- HTTPS в production
- Timing-safe сравнение токенов

❌ **Неправильно:**
- ~~Токены в localStorage~~ (исправлено)
- ~~Отсутствие CSRF защиты~~ (исправлено)
- ~~Невалидированные данные~~ (исправлено)
- ~~Слабые JWT секреты~~ (исправлено)

## 📊 Логирование

### Уровни логирования

- `error` — ошибки приложения
- `warn` — предупреждения
- `info` — информационные сообщения
- `debug` — отладочная информация (только development)

### Файлы логов

- `logs/app.log` — общие логи (5 MB, 5 файлов)
- `logs/error.log` — только ошибки (5 MB, 5 файлов)
- `logs/exceptions.log` — необработанные исключения
- `logs/rejections.log` — необработанные rejection
- Консоль (в development с цветами)

### Формат логов

```
2024-01-15 10:30:45 [INFO]: Пользователь вошёл в систему {"userId": "123", "email": "user@example.com"}
```

### Настройка

Уровень логирования настраивается через `LOG_LEVEL` в `.env`:

```env
LOG_LEVEL=info  # error, warn, info, debug
LOG_FILE=logs/app.log
```

## ⚡ Производительность

### Database оптимизации

**Prisma include:**
```typescript
// Устранение N+1 запросов
const channels = await prisma.channel.findMany({
  include: {
    topics: { include: { topic: true } },
    keywords: true,
    _count: { select: { posts: true } },
  },
});
```

**Promise.all для параллельных запросов:**
```typescript
const [channels, total] = await Promise.all([
  prisma.channel.findMany({ where, skip, take }),
  prisma.channel.count({ where }),
]);
```

**Индексы:**
- Все foreign key поля
- Часто фильтруемые поля (status, isActive, date)
- Уникальные constraints

### Redis кеширование

```typescript
import { redisService } from './services/redis';

// Получение из кеша
const cached = await redisService.get<Channel[]>('channels:user:123');

// Установка в кеш с TTL
await redisService.set('channels:user:123', channels, 3600); // 1 час

// Удаление
await redisService.del('channels:user:123');

// Массовое удаление по паттерну
await redisService.flushPattern('channels:user:*');
```

### WebSocket

- Автоматическое переподключение при обрыве связи
- Exponential backoff для повторных попыток
- Broadcast для групповых уведомлений
- Аутентификация клиентов

## 🧪 Тестирование API

### Регистрация

```bash
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "password123"
  }'
```

### Добавление канала

```bash
# Получите CSRF токен
curl http://localhost:4000/api/csrf-token -c cookies.txt

# Добавьте канал
curl -X POST http://localhost:4000/api/v1/channels \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: <csrf_token>" \
  -b cookies.txt \
  -d '{
    "username": "durov",
    "title": "Durov'\''s Channel",
    "category": "Технологии",
    "topics": ["Технологии", "Новости"],
    "keywords": ["telegram", "messenger"]
  }'
```

### Парсинг канала

```bash
curl -X POST http://localhost:4000/api/v1/channels/CHANNEL_ID/parse \
  -H "X-CSRF-Token: <csrf_token>" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"limit": 50}'
```

### Список постов с пагинацией

```bash
curl "http://localhost:4000/api/v1/posts?page=1&limit=20&status=new" \
  -b cookies.txt
```

## 🚢 Деплой

### Docker

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma

EXPOSE 4000
CMD ["node", "dist/index.js"]
```

### Docker Compose

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: tg_parser
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  backend:
    build: .
    ports:
      - "4000:4000"
    environment:
      DATABASE_URL: postgresql://postgres:password@postgres:5432/tg_parser
      REDIS_URL: redis://redis:6379
      JWT_SECRET: your-production-secret-min-32-chars
      NODE_ENV: production
    depends_on:
      - postgres
      - redis

volumes:
  postgres_data:
  redis_data:
```

### Переменные окружения для продакшена

```env
NODE_ENV=production
PORT=4000

# Database
DATABASE_URL=postgresql://user:pass@host:5432/tg_parser

# JWT (минимум 32 символа!)
JWT_SECRET=<длинная случайная строка минимум 32 символа>
JWT_REFRESH_SECRET=<другая длинная случайная строка>

# CORS
CORS_ORIGIN=https://your-frontend.com

# Redis
REDIS_URL=redis://redis:6379

# Logging
LOG_LEVEL=info
```

### Production checklist

- [ ] Установите безопасные JWT секреты (минимум 32 символа)
- [ ] Настройте HTTPS
- [ ] Укажите правильные CORS origins
- [ ] Настройте PostgreSQL с backups
- [ ] Настройте Redis для кеширования
- [ ] Включите логирование в файл
- [ ] Настройте мониторинг (Sentry, LogRocket)
- [ ] Настройте rate limiting
- [ ] Протестируйте CSRF защиту
- [ ] Проверьте валидацию всех входных данных
- [ ] Настройте backup для базы данных
- [ ] Включите SSL для PostgreSQL
- [ ] Настройте firewall правила

## 📝 Скрипты

```bash
# Development
npm run dev              # Запуск с hot reload
npm run build            # Сборка TypeScript
npm start                # Запуск production версии

# Database
npm run prisma:generate  # Генерация Prisma клиента
npm run prisma:migrate   # Создание миграций
npm run prisma:studio    # Prisma Studio UI
npm run prisma:seed      # Запуск seed данных

# Testing
npm test                 # Запуск тестов
npm run test:coverage    # Покрытие кода

# Code quality
npm run lint             # ESLint проверка
npm run format           # Prettier форматирование
npm run typecheck        # Проверка типов TypeScript
```

## 🐛 Отладка

### Включение debug логов

```env
LOG_LEVEL=debug
```

### Проверка подключения к БД

```bash
npx prisma db push
npx prisma studio
```

### Проверка Redis

```bash
redis-cli ping
# PONG
```

### Просмотр логов

```bash
tail -f logs/app.log
tail -f logs/error.log
```

## 📚 Дополнительные ресурсы

- [Prisma Documentation](https://www.prisma.io/docs)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Security Guide](https://owasp.org/www-project-cheat-sheets/)
- [gram.js Documentation](https://gram.js.org/)

## 📝 Лицензия

MIT

## 🤝 Вклад

Pull requests приветствуются! Для крупных изменений сначала откройте issue для обсуждения.

## 📧 Контакты

По вопросам и предложениям создавайте issue в репозитории.

---

**Статус:** ✅ Production Ready  
**Версия:** 1.0.0  
**Последнее обновление:** 2024
