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
    isLoading,
  } = useAppStore();

  const stats = useDashboardStats(channels, posts, sites, webPosts);

  const allPosts = useMemo(
    () => sortPostsByDate(mergePosts(posts, webPosts)),
    [posts, webPosts]
  );

  const handleNavigate = useCallback((tab: string) => {
    navigate(`/${tab === 'dashboard' ? '' : tab}`);
  }, [navigate]);

  // UX-001: индикатор загрузки
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Загрузка данных...</p>
        </div>
      </div>
    );
  }

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
