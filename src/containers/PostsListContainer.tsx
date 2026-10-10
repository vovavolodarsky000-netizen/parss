import React, { useMemo, useCallback } from 'react';
import { useAppStore } from '../store/appStore';
import { mergePosts, sortPostsByDate, mergeChannelFilters } from '../utils/transformers';
import PostsListComponent from '../components/PostsList';

export default function PostsList() {
  const {
    posts,
    channels,
    webPosts,
    sites,
    handleUpdatePostStatus,
    handleBulkUpdate,
    handleUpdateWebPostStatus,
    handleBulkUpdateWebPosts,
  } = useAppStore();

  const allPosts = useMemo(
    () => sortPostsByDate(mergePosts(posts, webPosts)),
    [posts, webPosts]
  );

  const channelFilters = useMemo(
    () => mergeChannelFilters(
      channels.map(ch => ({ id: ch.id, title: ch.title, topics: ch.topics, keywords: ch.keywords })),
      sites.map(s => ({ id: s.id, name: s.name, topics: s.topics, keywords: s.keywords }))
    ),
    [channels, sites]
  );

  // Оптимизация: используем Set для быстрого поиска
  const webPostIdsSet = useMemo(() => new Set(webPosts.map(wp => wp.id)), [webPosts]);
  const postIdsSet = useMemo(() => new Set(posts.map(p => p.id)), [posts]);

  const handlePostStatusUpdate = useCallback((id: string, status: 'new' | 'approved' | 'published' | 'rejected') => {
    const isWebPost = webPostIdsSet.has(id);
    if (isWebPost) {
      handleUpdateWebPostStatus(id, status);
    } else {
      handleUpdatePostStatus(id, status);
    }
  }, [webPostIdsSet, handleUpdateWebPostStatus, handleUpdatePostStatus]);

  const handleBulkStatusUpdate = useCallback((ids: string[], status: 'new' | 'approved' | 'published' | 'rejected') => {
    const webPostIds = ids.filter(id => webPostIdsSet.has(id));
    const telegramPostIds = ids.filter(id => postIdsSet.has(id));
    if (webPostIds.length > 0) handleBulkUpdateWebPosts(webPostIds, status);
    if (telegramPostIds.length > 0) handleBulkUpdate(telegramPostIds, status);
  }, [webPostIdsSet, postIdsSet, handleBulkUpdateWebPosts, handleBulkUpdate]);

  return (
    <PostsListComponent
      posts={allPosts}
      channels={channelFilters}
      onUpdateStatus={handlePostStatusUpdate}
      onBulkUpdate={handleBulkStatusUpdate}
    />
  );
}
