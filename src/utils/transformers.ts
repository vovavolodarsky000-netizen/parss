/**
 * Утилиты для трансформации данных между форматами
 * Устраняет дублирование кода (ARCH-001)
 */

import { WebPost, Post } from '../types';
import { hashCode } from './hashCode';

/**
 * Трансформация WebPost в единый формат Post
 * Используется в Dashboard, PostsList, PublishQueue
 */
export function transformWebPostToPost(wp: WebPost): Post {
  let hostname = 'unknown';
  try {
    hostname = new URL(wp.siteUrl).hostname;
  } catch {
    hostname = wp.siteUrl;
  }

  return {
    id: wp.id,
    channelId: wp.siteId,
    channelTitle: wp.siteName,
    channelUsername: hostname,
    text: `${wp.title}\n\n${wp.content}`,
    mediaType: wp.imageUrl ? 'photo' : 'text',
    mediaUrl: wp.imageUrl,
    views: hashCode(wp.id), // Детерминированные views вместо Math.random()
    date: wp.date,
    parsedAt: wp.parsedAt,
    status: wp.status,
    hashtags: wp.keywords.map(k => `#${k}`),
    hasMedia: !!wp.imageUrl,
    source: 'web',
  };
}

/**
 * Объединение Telegram постов и Web постов в единый список
 */
export function mergePosts(telegramPosts: Post[], webPosts: WebPost[]): Post[] {
  return [
    ...telegramPosts.map(p => ({ ...p, source: 'telegram' as const })),
    ...webPosts.map(transformWebPostToPost),
  ];
}

/**
 * Сортировка постов по дате (новые первыми)
 */
export function sortPostsByDate(posts: Post[]): Post[] {
  return [...posts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

/**
 * Объединение каналов и сайтов в единый формат для фильтров
 */
export function mergeChannelFilters(
  channels: Array<{ id: string; title: string; topics: string[]; keywords: string[] }>,
  sites: Array<{ id: string; name: string; topics: string[]; keywords: string[] }>
): Array<{ id: string; title: string; topics: string[]; keywords: string[] }> {
  return [
    ...channels,
    ...sites.map(s => ({ id: s.id, title: s.name, topics: s.topics, keywords: s.keywords })),
  ];
}
