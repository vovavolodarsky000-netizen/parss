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

  const handlePostStatusUpdate = useCallback((id: string, status: 'new' | 'approved' | 'published' | 'rejected') => {
    const isWebPost = webPosts.some(wp => wp.id === id);
    if (isWebPost) {
      handleUpdateWebPostStatus(id, status);
    } else {
      handleUpdatePostStatus(id, status);
    }
  }, [webPosts, handleUpdateWebPostStatus, handleUpdatePostStatus]);

  const handleBulkStatusUpdate = useCallback((ids: string[], status: 'new' | 'approved' | 'published' | 'rejected') => {
    const webPostIds = ids.filter(id => webPosts.some(wp => wp.id === id));
    const telegramPostIds = ids.filter(id => posts.some(p => p.id === id));
    if (webPostIds.length > 0) handleBulkUpdateWebPosts(webPostIds, status);
    if (telegramPostIds.length > 0) handleBulkUpdate(telegramPostIds, status);
  }, [webPosts, posts, handleBulkUpdateWebPosts, handleBulkUpdate]);

  return (
    <PostsListComponent
      posts={allPosts}
      channels={channelFilters}
      onUpdateStatus={handlePostStatusUpdate}
      onBulkUpdate={handleBulkStatusUpdate}
    />
  );
}
