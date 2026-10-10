import { describe, it, expect, beforeEach } from 'vitest';
import { runMigrations, getMigrationVersion } from '../migrations';

describe('Migrations', () => {

  describe('runMigrations', () => {
    it('должна устанавливать версию миграции', () => {
      runMigrations();
      expect(getMigrationVersion()).toBe(2);
    });

    it('не должна запускаться повторно', () => {
      runMigrations();
      const version1 = getMigrationVersion();
      runMigrations();
      const version2 = getMigrationVersion();
      expect(version1).toBe(version2);
    });

    it('должна мигрировать старые каналы', () => {
      const legacyData = [
        {
          id: 'ch_test',
          username: 'test',
          title: 'Test',
          subscribers: 100,
          isActive: true,
          lastParsed: null,
          avatar: 'test.png',
          category: 'Test',
          addedAt: new Date().toISOString(),
        },
      ];
      localStorage.setItem('tg_parser_channels', JSON.stringify(legacyData));

      runMigrations();

      const migrated = JSON.parse(localStorage.getItem('tg_parser_channels') || '[]');
      expect(migrated[0].topics).toBeDefined();
      expect(migrated[0].keywords).toBeDefined();
      expect(Array.isArray(migrated[0].topics)).toBe(true);
      expect(Array.isArray(migrated[0].keywords)).toBe(true);
    });

    it('должна мигрировать старые сайты', () => {
      const legacyData = [
        {
          id: 'site_test',
          name: 'Test Site',
          url: 'https://test.com',
          isActive: true,
          lastParsed: null,
          addedAt: new Date().toISOString(),
        },
      ];
      localStorage.setItem('tg_parser_sites', JSON.stringify(legacyData));

      runMigrations();

      const migrated = JSON.parse(localStorage.getItem('tg_parser_sites') || '[]');
      expect(migrated[0].topics).toBeDefined();
      expect(migrated[0].keywords).toBeDefined();
      expect(migrated[0].parseRules).toBeDefined();
    });
  });
});
