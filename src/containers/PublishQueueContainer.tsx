import React, { useMemo, useCallback } from 'react';
import { useAppStore } from '../store/appStore';
import { mergePosts, sortPostsByDate } from '../utils/transformers';
import PublishQueueComponent from '../components/PublishQueue';

export default function PublishQueue() {
  const {
    posts,
    webPosts,
    handleUpdatePostStatus,
    handleBulkUpdate,
    handleUpdateWebPostStatus,
    handleBulkUpdateWebPosts,
  } = useAppStore();

  const allPosts = useMemo(
    () => sortPostsByDate(mergePosts(posts, webPosts)),
    [posts, webPosts]
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
    <PublishQueueComponent
      posts={allPosts}
      onUpdateStatus={handlePostStatusUpdate}
      onBulkUpdate={handleBulkStatusUpdate}
    />
  );
}
