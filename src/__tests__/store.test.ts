import { describe, it, expect } from 'vitest';
import { getChannels, getSettings, addChannel, removeChannel, toggleChannel } from '../store';
import type { Channel } from '../types';

describe('Telegram Store', () => {

  describe('getChannels', () => {
    it('должен возвращать моковые каналы при первом вызове', () => {
      const channels = getChannels();
      expect(channels).toBeDefined();
      expect(Array.isArray(channels)).toBe(true);
      expect(channels.length).toBeGreaterThan(0);
    });

    it('каждый канал должен иметь обязательные поля', () => {
      const channels = getChannels();
      channels.forEach((channel: Channel) => {
        expect(channel.id).toBeDefined();
        expect(channel.username).toBeDefined();
        expect(channel.title).toBeDefined();
        expect(typeof channel.subscribers).toBe('number');
        expect(typeof channel.isActive).toBe('boolean');
        expect(channel.category).toBeDefined();
        // После миграции topics и keywords всегда массивы
        expect(Array.isArray(channel.topics)).toBe(true);
        expect(Array.isArray(channel.keywords)).toBe(true);
      });
    });

    it('должен кэшировать данные в localStorage', () => {
      getChannels();
      const stored = localStorage.getItem('tg_parser_channels');
      expect(stored).not.toBeNull();
    });

    it('должен корректно обрабатывать старые данные без topics', () => {
      // Симулируем старые данные
      const legacyData = [
        {
          id: 'ch_legacy',
          username: 'legacy_channel',
          title: 'Legacy Channel',
          subscribers: 1000,
          isActive: true,
          lastParsed: null,
          avatar: 'test.png',
          category: 'Test',
          addedAt: new Date().toISOString(),
          // Нет topics и keywords
        },
      ];
      localStorage.setItem('tg_parser_channels', JSON.stringify(legacyData));

      const channels = getChannels();
      expect(channels[0].topics).toEqual([]);
      expect(channels[0].keywords).toEqual([]);
    });
  });

  describe('addChannel', () => {
    it('должен добавлять новый канал', () => {
      const initialCount = getChannels().length;
      addChannel({
        username: 'new_channel',
        title: 'New Channel',
        subscribers: 500,
        isActive: true,
        lastParsed: null,
        avatar: 'new.png',
        category: 'Test',
        topics: ['Технологии'],
        keywords: ['test'],
      });

      const channels = getChannels();
      expect(channels.length).toBe(initialCount + 1);
      expect(channels.find((ch: Channel) => ch.username === 'new_channel')).toBeDefined();
    });
  });

  describe('removeChannel', () => {
    it('должен удалять канал по ID', () => {
      const channels = getChannels();
      const channelId = channels[0].id;
      removeChannel(channelId);

      const updated = getChannels();
      expect(updated.find((ch: Channel) => ch.id === channelId)).toBeUndefined();
    });
  });

  describe('toggleChannel', () => {
    it('должен переключать isActive', () => {
      const channels = getChannels();
      const channelId = channels[0].id;
      const initialActive = channels[0].isActive;

      toggleChannel(channelId);

      const updated = getChannels();
      const channel = updated.find((ch: Channel) => ch.id === channelId);
      expect(channel?.isActive).toBe(!initialActive);
    });
  });

  describe('getSettings', () => {
    it('должен возвращать настройки по умолчанию', () => {
      const settings = getSettings();
      expect(settings.parseInterval).toBe(30);
      expect(settings.maxPostsPerChannel).toBe(50);
      expect(settings.autoApprove).toBe(false);
    });
  });
});
