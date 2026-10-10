import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDashboardStats } from '../useDashboardStats';
import type { Channel, Post, WebSite, WebPost } from '../../types';

describe('useDashboardStats', () => {
  const mockChannels: Channel[] = [
    {
      id: 'ch1',
      username: 'test1',
      title: 'Test Channel 1',
      subscribers: 1000,
      isActive: true,
      lastParsed: new Date().toISOString(),
      avatar: 'test.png',
      category: 'Test',
      topics: ['Технологии'],
      keywords: ['test'],
      addedAt: new Date().toISOString(),
    },
    {
      id: 'ch2',
      username: 'test2',
      title: 'Test Channel 2',
      subscribers: 2000,
      isActive: false,
      lastParsed: null,
      avatar: 'test2.png',
      category: 'Test',
      topics: ['Дизайн'],
      keywords: [],
      addedAt: new Date().toISOString(),
    },
  ];

  const mockPosts: Post[] = [
    {
      id: 'p1',
      channelId: 'ch1',
      channelTitle: 'Test Channel 1',
      channelUsername: 'test1',
      text: 'Test post 1',
      mediaType: 'text',
      views: 100,
      date: new Date().toISOString(),
      parsedAt: new Date().toISOString(),
      status: 'new',
      hashtags: ['#test'],
      hasMedia: false,
    },
    {
      id: 'p2',
      channelId: 'ch1',
      channelTitle: 'Test Channel 1',
      channelUsername: 'test1',
      text: 'Test post 2',
      mediaType: 'text',
      views: 200,
      date: new Date().toISOString(),
      parsedAt: new Date().toISOString(),
      status: 'approved',
      hashtags: ['#test'],
      hasMedia: false,
    },
  ];

  const mockSites: WebSite[] = [
    {
      id: 'site1',
      name: 'Test Site',
      url: 'https://test.com',
      isActive: true,
      lastParsed: new Date().toISOString(),
      topics: ['Технологии'],
      keywords: ['test'],
      parseRules: [],
      addedAt: new Date().toISOString(),
    },
  ];

  const mockWebPosts: WebPost[] = [
    {
      id: 'wp1',
      siteId: 'site1',
      siteName: 'Test Site',
      siteUrl: 'https://test.com',
      title: 'Test Web Post',
      content: 'Test content',
      url: 'https://test.com/post',
      date: new Date().toISOString(),
      parsedAt: new Date().toISOString(),
      status: 'published',
      topics: ['Технологии'],
      keywords: ['test'],
    },
  ];

  it('должен корректно рассчитывать общую статистику', () => {
    const { result } = renderHook(() =>
      useDashboardStats(mockChannels, mockPosts, mockSites, mockWebPosts)
    );

    expect(result.current.totalChannels).toBe(3); // 2 канала + 1 сайт
    expect(result.current.activeChannels).toBe(2); // 1 активный канал + 1 активный сайт
    expect(result.current.totalPosts).toBe(3); // 2 поста + 1 веб-пост
  });

  it('должен корректно считать посты по статусам', () => {
    const { result } = renderHook(() =>
      useDashboardStats(mockChannels, mockPosts, mockSites, mockWebPosts)
    );

    expect(result.current.newPosts).toBe(1);
    expect(result.current.approvedPosts).toBe(1);
    expect(result.current.publishedPosts).toBe(1);
  });

  it('должен мемоизировать результат', () => {
    const { result, rerender } = renderHook(
      ({ channels, posts, sites, webPosts }: { channels: Channel[]; posts: Post[]; sites: WebSite[]; webPosts: WebPost[] }) =>
        useDashboardStats(channels, posts, sites, webPosts),
      {
        initialProps: {
          channels: mockChannels,
          posts: mockPosts,
          sites: mockSites,
          webPosts: mockWebPosts,
        },
      }
    );

    const firstResult = result.current;
    rerender({
      channels: mockChannels,
      posts: mockPosts,
      sites: mockSites,
      webPosts: mockWebPosts,
    });

    // Должен вернуть тот же объект (мемоизация)
    expect(result.current).toBe(firstResult);
  });

  it('должен обрабатывать пустые массивы', () => {
    const { result } = renderHook(() => useDashboardStats([], [], [], []));

    expect(result.current.totalChannels).toBe(0);
    expect(result.current.activeChannels).toBe(0);
    expect(result.current.totalPosts).toBe(0);
    expect(result.current.newPosts).toBe(0);
  });
});
