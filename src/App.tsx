import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAppStore } from './store/appStore';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useWebSocketIntegration } from './hooks/useWebSocketIntegration';
import Dashboard from './containers/DashboardContainer';
import ChannelsList from './containers/ChannelsListContainer';
import PostsList from './containers/PostsListContainer';
import Settings from './containers/SettingsContainer';
import PublishQueue from './containers/PublishQueueContainer';
import SitesManager from './containers/SitesManagerContainer';

function App() {
  const { loadData } = useAppStore();
  
  // CODE-005: интеграция WebSocket для реалтайм-обновлений
  useWebSocketIntegration();

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/channels" element={<ChannelsList />} />
          <Route path="/posts" element={<PostsList />} />
          <Route path="/publish" element={<PublishQueue />} />
          <Route path="/sites" element={<SitesManager />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
