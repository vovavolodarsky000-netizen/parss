import { describe, it, expect } from 'vitest';
import { AVAILABLE_TOPICS } from '../types';

describe('Types', () => {
  describe('AVAILABLE_TOPICS', () => {
    it('должен содержать все предопределённые тематики', () => {
      expect(AVAILABLE_TOPICS).toContain('Технологии');
      expect(AVAILABLE_TOPICS).toContain('Крипто');
      expect(AVAILABLE_TOPICS).toContain('Дизайн');
      expect(AVAILABLE_TOPICS).toContain('Бизнес');
    });

    it('не должен содержать дубликатов', () => {
      const unique = new Set(AVAILABLE_TOPICS);
      expect(unique.size).toBe(AVAILABLE_TOPICS.length);
    });

    it('должен содержать минимум 10 тематик', () => {
      expect(AVAILABLE_TOPICS.length).toBeGreaterThanOrEqual(10);
    });
  });
});
