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
    <PublishQueueComponent
      posts={allPosts}
      onUpdateStatus={handlePostStatusUpdate}
      onBulkUpdate={handleBulkStatusUpdate}
    />
  );
}
