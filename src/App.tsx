import React, { useState, useCallback, useMemo } from 'react';
import { TabType } from './types';
import { useAppData } from './hooks/useAppData';
import { useDashboardStats } from './hooks/useDashboardStats';
import Dashboard from './components/Dashboard';
import ChannelsList from './components/ChannelsList';
import PostsList from './components/PostsList';
import Settings from './components/Settings';
import PublishQueue from './components/PublishQueue';
import SitesManager from './components/SitesManager';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Используем кастомный хук для всей логики данных
  const {
    channels,
    posts,
    sites,
    webPosts,
    settings,
    isParsing,
    parseResult,
    handleParse,
    handleAddChannel,
    handleRemoveChannel,
    handleToggleChannel,
    handleUpdatePostStatus,
    handleBulkUpdate,
    handleSaveSettings,
    handleReset,
    handleAddSite,
    handleRemoveSite,
    handleToggleSite,
    handleUpdateSite,
    handleUpdateWebPostStatus,
    handleBulkUpdateWebPosts,
  } = useAppData();

  // Мемоизация статистики
  const stats = useDashboardStats(channels, posts, sites, webPosts);

  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: 'dashboard', label: 'Дашборд', icon: 'fa-chart-line' },
    { key: 'channels', label: 'Каналы', icon: 'fa-broadcast-tower' },
    { key: 'sites', label: 'Веб-сайты', icon: 'fa-globe' },
    { key: 'posts', label: 'Посты', icon: 'fa-newspaper' },
    { key: 'publish', label: 'Публикация', icon: 'fa-paper-plane' },
    { key: 'settings', label: 'Настройки', icon: 'fa-cog' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
              <i className="fas fa-robot text-white text-lg"></i>
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-lg">TG Parser</h1>
              <p className="text-xs text-gray-500">Парсер каналов</p>
            </div>
          </div>
        </div>

        <nav className="p-3 space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <i className={`fas ${tab.icon} w-5 text-center`}></i>
              {tab.label}
              {tab.key === 'posts' && stats.newPosts > 0 && (
                <span className="ml-auto bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {stats.newPosts}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Parser Status */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-600">Статус парсера</span>
              <div className={`w-2 h-2 rounded-full ${isParsing ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></div>
            </div>
            <button
              onClick={handleParse}
              disabled={isParsing}
              className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isParsing ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Парсинг...
                </>
              ) : (
                <>
                  <i className="fas fa-sync-alt"></i>
                  Запустить парсинг
                </>
              )}
            </button>
            {parseResult && (
              <p className="text-xs text-green-600 mt-2 text-center">{parseResult}</p>
            )}
          </div>
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setSidebarOpen(false)}></div>
      )}

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-8 py-4 sticky top-0 z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 text-gray-600 hover:text-gray-900"
              >
                <i className="fas fa-bars text-xl"></i>
              </button>
              <div>
                <h2 className="font-semibold text-gray-900 hidden sm:block">
                  {tabs.find(t => t.key === activeTab)?.label}
                </h2>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {stats.newPosts > 0 && (
                <span className="hidden sm:flex items-center gap-1 text-sm text-gray-500">
                  <i className="fas fa-bell text-orange-500"></i>
                  {stats.newPosts} новых
                </span>
              )}
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-600 hidden sm:inline">
                  {stats.activeChannels} активных каналов
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 lg:p-8">
          {activeTab === 'dashboard' && (
            <Dashboard
              stats={stats}
              recentPosts={[
                ...posts.map(p => ({ ...p, source: 'telegram' as const })),
                ...webPosts.map(wp => ({
                  id: wp.id,
                  channelId: wp.siteId,
                  channelTitle: wp.siteName,
                  channelUsername: new URL(wp.siteUrl).hostname,
                  text: `${wp.title}\n\n${wp.content}`,
                  mediaType: wp.imageUrl ? 'photo' as const : 'text' as const,
                  mediaUrl: wp.imageUrl,
                  views: Math.floor(Math.random() * 10000),
                  date: wp.date,
                  parsedAt: wp.parsedAt,
                  status: wp.status,
                  hashtags: wp.keywords.map(k => `#${k}`),
                  hasMedia: !!wp.imageUrl,
                  source: 'web' as const,
                })),
              ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())}
              channels={channels}
              sites={sites}
              onNavigate={(tab) => setActiveTab(tab as TabType)}
            />
          )}
          {activeTab === 'channels' && (
            <ChannelsList
              channels={channels}
              onAdd={handleAddChannel}
              onRemove={handleRemoveChannel}
              onToggle={handleToggleChannel}
            />
          )}
          {activeTab === 'sites' && (
            <SitesManager
              sites={sites}
              onAdd={handleAddSite}
              onRemove={handleRemoveSite}
              onToggle={handleToggleSite}
              onUpdate={handleUpdateSite}
              onParse={handleParse}
              isParsing={isParsing}
            />
          )}
          {activeTab === 'posts' && (
            <PostsList
              posts={[
                ...posts.map(p => ({ ...p, source: 'telegram' as const })),
                ...webPosts.map(wp => ({
                  id: wp.id,
                  channelId: wp.siteId,
                  channelTitle: wp.siteName,
                  channelUsername: new URL(wp.siteUrl).hostname,
                  text: `${wp.title}\n\n${wp.content}`,
                  mediaType: wp.imageUrl ? 'photo' as const : 'text' as const,
                  mediaUrl: wp.imageUrl,
                  views: Math.floor(Math.random() * 10000),
                  date: wp.date,
                  parsedAt: wp.parsedAt,
                  status: wp.status,
                  hashtags: wp.keywords.map(k => `#${k}`),
                  hasMedia: !!wp.imageUrl,
                  source: 'web' as const,
                })),
              ]}
              channels={[
                ...channels.map(ch => ({ id: ch.id, title: ch.title, topics: ch.topics, keywords: ch.keywords })),
                ...sites.map(s => ({ id: s.id, title: s.name, topics: s.topics, keywords: s.keywords })),
              ]}
              onUpdateStatus={(id, status) => {
                const isWebPost = webPosts.some(wp => wp.id === id);
                if (isWebPost) {
                  handleUpdateWebPostStatus(id, status);
                } else {
                  handleUpdatePostStatus(id, status);
                }
              }}
              onBulkUpdate={(ids, status) => {
                const webPostIds = ids.filter(id => webPosts.some(wp => wp.id === id));
                const telegramPostIds = ids.filter(id => posts.some(p => p.id === id));
                if (webPostIds.length > 0) handleBulkUpdateWebPosts(webPostIds, status);
                if (telegramPostIds.length > 0) handleBulkUpdate(telegramPostIds, status);
              }}
            />
          )}
          {activeTab === 'publish' && (
            <PublishQueue
              posts={[
                ...posts,
                ...webPosts.map(wp => ({
                  id: wp.id,
                  channelId: wp.siteId,
                  channelTitle: wp.siteName,
                  channelUsername: new URL(wp.siteUrl).hostname,
                  text: `${wp.title}\n\n${wp.content}`,
                  mediaType: wp.imageUrl ? 'photo' as const : 'text' as const,
                  mediaUrl: wp.imageUrl,
                  views: Math.floor(Math.random() * 10000),
                  date: wp.date,
                  parsedAt: wp.parsedAt,
                  status: wp.status,
                  hashtags: wp.keywords.map(k => `#${k}`),
                  hasMedia: !!wp.imageUrl,
                })),
              ]}
              onUpdateStatus={(id, status) => {
                const isWebPost = webPosts.some(wp => wp.id === id);
                if (isWebPost) {
                  handleUpdateWebPostStatus(id, status);
                } else {
                  handleUpdatePostStatus(id, status);
                }
              }}
              onBulkUpdate={(ids, status) => {
                const webPostIds = ids.filter(id => webPosts.some(wp => wp.id === id));
                const telegramPostIds = ids.filter(id => posts.some(p => p.id === id));
                if (webPostIds.length > 0) handleBulkUpdateWebPosts(webPostIds, status);
                if (telegramPostIds.length > 0) handleBulkUpdate(telegramPostIds, status);
              }}
            />
          )}
          {activeTab === 'settings' && (
            <Settings
              settings={settings}
              onSave={handleSaveSettings}
              onReset={handleReset}
            />
          )}
        </div>
      </main>
    </div>
  );
}
