# TG Parser Backend

Бэкенд для парсера Telegram каналов и веб-сайтов с полной аутентификацией, базой данных и интеграцией с Telegram API.

## 🛠 Технологии

- **Node.js** + **TypeScript**
- **Express.js** — веб-фреймворк
- **PostgreSQL** + **Prisma ORM** — база данных
- **JWT** — аутентификация
- **gram.js (telegram)** — Telegram API
- **Winston** — логирование
- **Helmet** + **CORS** + **Rate Limiting** — безопасность
- **Zod** — валидация данных
- **Bull** — очереди задач (опционально)

## 📋 Требования

- Node.js 18+
- PostgreSQL 14+
- Redis (опционально, для очередей)

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
# База данных
DATABASE_URL="postgresql://postgres:password@localhost:5432/tg_parser?schema=public"

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-secret

# Telegram API (получите на https://my.telegram.org)
TELEGRAM_API_ID=your_api_id
TELEGRAM_API_HASH=your_api_hash
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

## 📡 API Endpoints

### Аутентификация

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/auth/register` | Регистрация |
| POST | `/api/auth/login` | Вход |
| POST | `/api/auth/refresh` | Обновление токена |
| POST | `/api/auth/logout` | Выход |
| GET | `/api/auth/me` | Информация о пользователе |
| PUT | `/api/auth/password` | Изменение пароля |

### Каналы

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/channels` | Список каналов |
| GET | `/api/channels/:id` | Информация о канале |
| POST | `/api/channels` | Добавить канал |
| PUT | `/api/channels/:id` | Обновить канал |
| DELETE | `/api/channels/:id` | Удалить канал |
| POST | `/api/channels/:id/parse` | Запустить парсинг |

### Посты

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/posts` | Список постов |
| GET | `/api/posts/stats` | Статистика |
| PUT | `/api/posts/:id/status` | Изменить статус |
| PUT | `/api/posts/bulk-status` | Массовое обновление |

## 🔐 Аутентификация

Все защищённые маршруты требуют заголовок:

```
Authorization: Bearer <access_token>
```

### Получение токена

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

Ответ:

```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "...", "username": "..." },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc..."
    }
  }
}
```

## 🗄 Структура базы данных

Основные модели:

- **User** — пользователи
- **Channel** — Telegram каналы
- **Post** — посты из Telegram
- **WebSite** — веб-сайты для парсинга
- **WebPost** — посты с веб-сайтов
- **ParseRule** — правила парсинга
- **AuditLog** — логи аудита
- **PublishLog** — логи публикации

## 🔒 Безопасность

- **Helmet** — безопасные HTTP заголовки
- **CORS** — настройка разрешённых источников
- **Rate Limiting** — защита от DDoS
- **JWT** — аутентификация с refresh токенами
- **bcrypt** — хеширование паролей
- **Zod** — валидация входных данных
- **Логирование** — аудит всех действий

## 📊 Логирование

Логи сохраняются в:
- `logs/app.log` — общие логи
- `logs/error.log` — ошибки
- `logs/exceptions.log` — необработанные исключения
- Консоль (в development)

Уровень логирования настраивается через `LOG_LEVEL` в `.env`.

## 🧪 Тестирование API

### Регистрация

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "password123"
  }'
```

### Добавление канала

```bash
curl -X POST http://localhost:4000/api/channels \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "durov",
    "title": "Durov's Channel",
    "category": "Технологии",
    "topics": ["Технологии", "Новости"],
    "keywords": ["telegram", "messenger"]
  }'
```

### Парсинг канала

```bash
curl -X POST http://localhost:4000/api/channels/CHANNEL_ID/parse \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"limit": 50}'
```

## 🚢 Деплой

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 4000
CMD ["npm", "start"]
```

### Переменные окружения для продакшена

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/tg_parser
JWT_SECRET=<длинная случайная строка>
CORS_ORIGIN=https://your-frontend.com
```

## 📝 Лицензия

MIT
