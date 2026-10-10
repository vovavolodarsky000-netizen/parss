// Setup file for Vitest
import { beforeEach } from 'vitest';
import '@testing-library/jest-dom';

// Очищаем localStorage перед каждым тестом
beforeEach(() => {
  localStorage.clear();
});
