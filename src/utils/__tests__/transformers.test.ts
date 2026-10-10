import { describe, it, expect } from 'vitest';
import { transformWebPostToPost, mergePosts, sortPostsByDate } from '../transformers';
import { WebPost, Post } from '../../types';

describe('transformWebPostToPost', () => {
  it('должен трансформировать WebPost в Post', () => {
    const webPost: WebPost = {
      id: 'web_1',
      siteId: 'site_1',
      siteName: 'Test Site',
      siteUrl: 'https://example.com',
      title: 'Test Title',
      content: 'Test Content',
      url: 'https://example.com/post/1',
      imageUrl: 'https://example.com/image.jpg',
      author: 'Author',
      date: '2024-01-01T00:00:00Z',
      parsedAt: '2024-01-01T00:00:00Z',
      status: 'new',
      keywords: ['test', 'example'],
      topics: ['test'],
    };

    const post = transformWebPostToPost(webPost);

    expect(post.id).toBe('web_1');
    expect(post.channelId).toBe('site_1');
    expect(post.channelTitle).toBe('Test Site');
    expect(post.text).toContain('Test Title');
    expect(post.text).toContain('Test Content');
    expect(post.mediaType).toBe('photo');
    expect(post.mediaUrl).toBe('https://example.com/image.jpg');
    expect(post.status).toBe('new');
    expect(post.hashtags).toEqual(['#test', '#example']);
    expect(post.hasMedia).toBe(true);
    expect(post.source).toBe('web');
  });

  it('должен извлекать hostname из URL', () => {
    const webPost: WebPost = {
      id: 'web_2',
      siteId: 'site_2',
      siteName: 'Test',
      siteUrl: 'https://test.example.com/path',
      title: 'Title',
      content: 'Content',
      url: 'https://test.example.com/post',
      author: 'Author',
      date: '2024-01-01T00:00:00Z',
      parsedAt: '2024-01-01T00:00:00Z',
      status: 'new',
      keywords: [],
      topics: [],
    };

    const post = transformWebPostToPost(webPost);
    expect(post.channelUsername).toBe('test.example.com');
  });

  it('должен устанавливать mediaType в text, если нет imageUrl', () => {
    const webPost: WebPost = {
      id: 'web_3',
      siteId: 'site_3',
      siteName: 'Test',
      siteUrl: 'https://example.com',
      title: 'Title',
      content: 'Content',
      url: 'https://example.com/post',
      author: 'Author',
      date: '2024-01-01T00:00:00Z',
      parsedAt: '2024-01-01T00:00:00Z',
      status: 'new',
      keywords: [],
      topics: [],
    };

    const post = transformWebPostToPost(webPost);
    expect(post.mediaType).toBe('text');
    expect(post.hasMedia).toBe(false);
  });
});

describe('mergePosts', () => {
  it('должен объединять Telegram и Web посты', () => {
    const telegramPosts: Post[] = [
      {
        id: 'tg_1',
        channelId: 'ch_1',
        channelTitle: 'Channel 1',
        channelUsername: 'channel1',
        text: 'Telegram post',
        mediaType: 'text',
        views: 100,
        date: '2024-01-01T00:00:00Z',
        parsedAt: '2024-01-01T00:00:00Z',
        status: 'new',
        hashtags: [],
        hasMedia: false,
        source: 'telegram',
      },
    ];

    const webPosts: WebPost[] = [
      {
        id: 'web_1',
        siteId: 'site_1',
        siteName: 'Site 1',
        siteUrl: 'https://example.com',
        title: 'Web post',
        content: 'Content',
        url: 'https://example.com/post',
        author: 'Author',
        date: '2024-01-02T00:00:00Z',
        parsedAt: '2024-01-02T00:00:00Z',
        status: 'new',
        keywords: [],
        topics: [],
      },
    ];

    const merged = mergePosts(telegramPosts, webPosts);
    expect(merged).toHaveLength(2);
    expect(merged[0].source).toBe('telegram');
    expect(merged[1].source).toBe('web');
  });
});

describe('sortPostsByDate', () => {
  it('должен сортировать посты по дате (новые первыми)', () => {
    const posts: Post[] = [
      {
        id: '1',
        channelId: 'ch_1',
        channelTitle: 'Channel',
        channelUsername: 'channel',
        text: 'Old post',
        mediaType: 'text',
        views: 100,
        date: '2024-01-01T00:00:00Z',
        parsedAt: '2024-01-01T00:00:00Z',
        status: 'new',
        hashtags: [],
        hasMedia: false,
        source: 'telegram',
      },
      {
        id: '2',
        channelId: 'ch_1',
        channelTitle: 'Channel',
        channelUsername: 'channel',
        text: 'New post',
        mediaType: 'text',
        views: 100,
        date: '2024-01-03T00:00:00Z',
        parsedAt: '2024-01-03T00:00:00Z',
        status: 'new',
        hashtags: [],
        hasMedia: false,
        source: 'telegram',
      },
      {
        id: '3',
        channelId: 'ch_1',
        channelTitle: 'Channel',
        channelUsername: 'channel',
        text: 'Middle post',
        mediaType: 'text',
        views: 100,
        date: '2024-01-02T00:00:00Z',
        parsedAt: '2024-01-02T00:00:00Z',
        status: 'new',
        hashtags: [],
        hasMedia: false,
        source: 'telegram',
      },
    ];

    const sorted = sortPostsByDate(posts);
    expect(sorted[0].id).toBe('2'); // Самый новый
    expect(sorted[1].id).toBe('3');
    expect(sorted[2].id).toBe('1'); // Самый старый
  });
});
