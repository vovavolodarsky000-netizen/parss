/**
 * Базовый класс для приложений ошибок
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public errorCode?: string;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    errorCode?: string
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errorCode = errorCode;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Ошибка 400 - Неверный запрос
 */
export class BadRequestError extends AppError {
  constructor(message: string = 'Неверный запрос', errorCode?: string) {
    super(message, 400, true, errorCode);
  }
}

/**
 * Ошибка 401 - Не авторизован
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Необходима авторизация', errorCode?: string) {
    super(message, 401, true, errorCode);
  }
}

/**
 * Ошибка 403 - Доступ запрещён
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Доступ запрещён', errorCode?: string) {
    super(message, 403, true, errorCode);
  }
}

/**
 * Ошибка 404 - Не найдено
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Ресурс не найден', errorCode?: string) {
    super(message, 404, true, errorCode);
  }
}

/**
 * Ошибка 409 - Конфликт
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Конфликт данных', errorCode?: string) {
    super(message, 409, true, errorCode);
  }
}

/**
 * Ошибка 422 - Невозможно обработать
 */
export class UnprocessableError extends AppError {
  constructor(message: string = 'Невозможно обработать запрос', errorCode?: string) {
    super(message, 422, true, errorCode);
  }
}

/**
 * Ошибка 429 - Слишком много запросов
 */
export class TooManyRequestsError extends AppError {
  constructor(message: string = 'Слишком много запросов', errorCode?: string) {
    super(message, 429, true, errorCode);
  }
}

/**
 * Ошибка 500 - Внутренняя ошибка сервера
 */
export class InternalError extends AppError {
  constructor(message: string = 'Внутренняя ошибка сервера', errorCode?: string) {
    super(message, 500, false, errorCode);
  }
}

/**
 * Ошибка Telegram API
 */
export class TelegramApiError extends AppError {
  constructor(message: string = 'Ошибка Telegram API', errorCode?: string) {
    super(message, 502, true, errorCode);
  }
}

/**
 * Ошибка парсинга
 */
export class ParsingError extends AppError {
  constructor(message: string = 'Ошибка парсинга', errorCode?: string) {
    super(message, 500, true, errorCode);
  }
}
