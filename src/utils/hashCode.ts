/**
 * Детерминированный хеш-код для строк
 * Используется вместо Math.random() для стабильных значений
 */
export function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash) % 10000;
}

/**
 * Генерация стабильного ID на основе содержимого
 */
export function stableId(prefix: string, ...parts: string[]): string {
  const combined = parts.join('|');
  return `${prefix}_${hashCode(combined).toString(36)}`;
}
