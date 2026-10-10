import { describe, it, expect, beforeEach } from 'vitest';
import { getChannels, getPosts, getSettings, addChannel, removeChannel, toggleChannel, updatePostStatus, bulkUpdateStatus, simulateParsing, resetData } from '../store';
import type { Channel, Post } from '../types';

describe('store - дополнительные тесты', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('updatePostStatus', () => {
    it('должен обновлять статус поста', () => {
      const posts = getPosts();
      const postId = posts[0].id;
      
      updatePostStatus(postId, 'approved');
      
      const updatedPosts = getPosts();
      const post = updatedPosts.find(p => p.id === postId);
      expect(post?.status).toBe('approved');
    });

    it('должен обновлять статус на rejected', () => {
      const posts = getPosts();
      const postId = posts[0].id;
      
      updatePostStatus(postId, 'rejected');
      
      const updatedPosts = getPosts();
      const post = updatedPosts.find(p => p.id === postId);
      expect(post?.status).toBe('rejected');
    });
  });

  describe('bulkUpdateStatus', () => {
    it('должен массово обновлять статусы', () => {
      const posts = getPosts();
      const ids = [posts[0].id, posts[1].id];
      
      bulkUpdateStatus(ids, 'approved');
      
      const updatedPosts = getPosts();
      ids.forEach(id => {
        const post = updatedPosts.find(p => p.id === id);
        expect(post?.status).toBe('approved');
      });
    });

    it('не должен обновлять посты вне списка', () => {
      const posts = getPosts();
      const ids = [posts[0].id];
      const otherPostId = posts[1].id;
      const originalStatus = posts[1].status;
      
      bulkUpdateStatus(ids, 'approved');
      
      const updatedPosts = getPosts();
      const otherPost = updatedPosts.find(p => p.id === otherPostId);
      expect(otherPost?.status).toBe(originalStatus);
    });
  });

  describe('simulateParsing', () => {
    it('должен возвращать массив новых постов', () => {
      const newPosts = simulateParsing();
      
      expect(Array.isArray(newPosts)).toBe(true);
    });

    it('должен обновлять lastParsed у каналов', () => {
      const channelsBefore = getChannels();
      const activeChannel = channelsBefore.find(ch => ch.isActive);
      
      if (activeChannel) {
        simulateParsing();
        
        const channelsAfter = getChannels();
        const updatedChannel = channelsAfter.find(ch => ch.id === activeChannel.id);
        expect(updatedChannel?.lastParsed).not.toBeNull();
      }
    });
  });

  describe('resetData', () => {
    it('должен удалять все данные из localStorage', () => {
      // Создаём данные
      addChannel({
        username: 'test',
        title: 'Test',
        subscribers: 100,
        isActive: true,
        lastParsed: null,
        avatar: 'test.png',
        category: 'Test',
        topics: [],
        keywords: [],
      });
      
      expect(localStorage.getItem('tg_parser_channels')).not.toBeNull();
      
      resetData();
      
      expect(localStorage.getItem('tg_parser_channels')).toBeNull();
      expect(localStorage.getItem('tg_parser_posts')).toBeNull();
      expect(localStorage.getItem('tg_parser_settings')).toBeNull();
    });
  });

  describe('getSettings', () => {
    it('должен возвращать настройки по умолчанию при первом вызове', () => {
      const settings = getSettings();
      
      expect(settings.parseInterval).toBe(30);
      expect(settings.maxPostsPerChannel).toBe(50);
      expect(settings.autoApprove).toBe(false);
    });

    it('должен сохранять настройки в localStorage', () => {
      getSettings();
      
      const stored = localStorage.getItem('tg_parser_settings');
      expect(stored).not.toBeNull();
    });
  });
});
