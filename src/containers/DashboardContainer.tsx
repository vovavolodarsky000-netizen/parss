import React, { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { mergePosts, sortPostsByDate } from '../utils/transformers';
import { useDashboardStats } from '../hooks/useDashboardStats';
import DashboardComponent from '../components/Dashboard';

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    channels,
    posts,
    sites,
    webPosts,
  } = useAppStore();

  const stats = useDashboardStats(channels, posts, sites, webPosts);

  const allPosts = useMemo(
    () => sortPostsByDate(mergePosts(posts, webPosts)),
    [posts, webPosts]
  );

  const handleNavigate = useCallback((tab: string) => {
    navigate(`/${tab === 'dashboard' ? '' : tab}`);
  }, [navigate]);

  return (
    <DashboardComponent
      stats={stats}
      recentPosts={allPosts}
      channels={channels}
      sites={sites}
      onNavigate={handleNavigate}
    />
  );
}
