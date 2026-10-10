import { useMemo } from 'react';
import { Channel, Post, WebSite, WebPost, DashboardStats } from '../types';

export function useDashboardStats(
  channels: Channel[],
  posts: Post[],
  sites: WebSite[],
  webPosts: WebPost[]
) {
  const stats = useMemo<DashboardStats>(() => {
    const allPosts = [...posts, ...webPosts];

    return {
      totalChannels: channels.length + sites.length,
      activeChannels:
        channels.filter((ch) => ch.isActive).length +
        sites.filter((s) => s.isActive).length,
      totalPosts: allPosts.length,
      newPosts: allPosts.filter((p) => p.status === 'new').length,
      approvedPosts: allPosts.filter((p) => p.status === 'approved').length,
      publishedPosts: allPosts.filter((p) => p.status === 'published').length,
      lastParseTime: (() => {
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

        if (channelLast && siteLast) {
          return new Date(channelLast) > new Date(siteLast) ? channelLast : siteLast;
        }
        return channelLast || siteLast;
      })(),
      postsToday: allPosts.filter((p) => {
        const today = new Date();
        const postDate = new Date(p.date);
        return postDate.toDateString() === today.toDateString();
      }).length,
    };
  }, [channels, posts, sites, webPosts]);

  return stats;
}
