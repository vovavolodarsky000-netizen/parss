// Setup file for Vitest
import { beforeEach } from 'vitest';

// Очищаем localStorage перед каждым тестом
beforeEach(() => {
  localStorage.clear();
});
