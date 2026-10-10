import { useMemo } from 'react';
import { Channel, Post, WebSite, WebPost, DashboardStats } from '../types';

/**
 * Хук для расчёта статистики дашборда
 * 
 * @description
 * Вычисляет агрегированную статистику по каналам, постам и сайтам.
 * Использует useMemo для оптимизации производительности.
 * 
 * @param channels - Массив Telegram каналов
 * @param posts - Массив постов из каналов
 * @param sites - Массив веб-сайтов
 * @param webPosts - Массив постов с веб-сайтов
 * @returns {DashboardStats} Объект со статистикой
 * 
 * @example
 * ```tsx
 * const stats = useDashboardStats(channels, posts, sites, webPosts);
 * 
 * console.log(stats.totalChannels); // 10
 * console.log(stats.newPosts); // 5
 * ```
 */
export function useDashboardStats(
  channels: Channel[],
  posts: Post[],
  sites: WebSite[],
  webPosts: WebPost[]
): DashboardStats {
  const stats = useMemo<DashboardStats>(() => {
    const allPosts = [...posts, ...webPosts];

    // Вычисляем lastParseTime отдельно для оптимизации
    const channelLast = channels.reduce((latest, ch) => {
      if (ch.lastParsed && (!latest || new Date(ch.lastParsed) > new Date(latest))) {
        return ch.lastParsed;
      }
      return latest;
    }, null as string | null);

    const siteLast = sites.reduce((latest, s) => {
      if (s.lastParsed && (!latest || new Date(s.lastParsed) > new Date(latest))) {
        return s.lastParsed;
      }
      return latest;
    }, null as string | null);

    let lastParseTime: string | null = null;
    if (channelLast && siteLast) {
      lastParseTime = new Date(channelLast) > new Date(siteLast) ? channelLast : siteLast;
    } else {
      lastParseTime = channelLast || siteLast;
    }

    // Оптимизируем postsToday - создаём Date один раз
    const today = new Date();
    const todayString = today.toDateString();
    const postsToday = allPosts.filter((p) => {
      const postDate = new Date(p.date);
      return postDate.toDateString() === todayString;
    }).length;

    return {
      totalChannels: channels.length + sites.length,
      activeChannels:
        channels.filter((ch) => ch.isActive).length +
        sites.filter((s) => s.isActive).length,
      totalPosts: allPosts.length,
      newPosts: allPosts.filter((p) => p.status === 'new').length,
      approvedPosts: allPosts.filter((p) => p.status === 'approved').length,
      publishedPosts: allPosts.filter((p) => p.status === 'published').length,
      lastParseTime,
      postsToday,
    };
  }, [channels, posts, sites, webPosts]);

  return stats;
}
