import React, { useState, useEffect, useCallback } from 'react';
import { Channel, Post, ParserSettings, DashboardStats, TabType } from './types';
import {
  getChannels, getPosts, getSettings, saveSettings,
  addChannel, removeChannel, toggleChannel,
  updatePostStatus, bulkUpdateStatus, simulateParsing, resetData
} from './store';
import Dashboard from './components/Dashboard';
import ChannelsList from './components/ChannelsList';
import PostsList from './components/PostsList';
import Settings from './components/Settings';
import PublishQueue from './components/PublishQueue';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [settings, setSettings] = useState<ParserSettings>(getSettings());
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const loadData = useCallback(() => {
    setChannels(getChannels());
    setPosts(getPosts());
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const stats: DashboardStats = {
    totalChannels: channels.length,
    activeChannels: channels.filter(ch => ch.isActive).length,
    totalPosts: posts.length,
    newPosts: posts.filter(p => p.status === 'new').length,
    approvedPosts: posts.filter(p => p.status === 'approved').length,
    publishedPosts: posts.filter(p => p.status === 'published').length,
    lastParseTime: channels.reduce((latest, ch) => {
      if (ch.lastParsed && (!latest || new Date(ch.lastParsed) > new Date(latest))) {
        return ch.lastParsed;
      }
      return latest;
    }, null as string | null),
    postsToday: posts.filter(p => {
      const today = new Date();
      const postDate = new Date(p.date);
      return postDate.toDateString() === today.toDateString();
    }).length,
  };

  const handleParse = () => {
    setIsParsing(true);
    setParseResult(null);
    
    // Simulate parsing delay
    setTimeout(() => {
      const newPosts = simulateParsing();
      loadData();
      setIsParsing(false);
      setParseResult(`Собрано ${newPosts.length} новых постов`);
      setTimeout(() => setParseResult(null), 3000);
    }, 2000);
  };

  const handleAddChannel = (channel: Omit<Channel, 'id' | 'addedAt'>) => {
    addChannel(channel);
    loadData();
  };

  const handleRemoveChannel = (id: string) => {
    removeChannel(id);
    loadData();
  };

  const handleToggleChannel = (id: string) => {
    toggleChannel(id);
    loadData();
  };

  const handleUpdatePostStatus = (id: string, status: Post['status']) => {
    updatePostStatus(id, status);
    loadData();
  };

  const handleBulkUpdate = (ids: string[], status: Post['status']) => {
    bulkUpdateStatus(ids, status);
    loadData();
  };

  const handleSaveSettings = (newSettings: ParserSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleReset = () => {
    resetData();
    loadData();
    setSettings(getSettings());
  };

  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: 'dashboard', label: 'Дашборд', icon: 'fa-chart-line' },
    { key: 'channels', label: 'Каналы', icon: 'fa-broadcast-tower' },
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
              recentPosts={posts}
              channels={channels}
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
          {activeTab === 'posts' && (
            <PostsList
              posts={posts}
              channels={channels.map(ch => ({ id: ch.id, title: ch.title, topics: ch.topics, keywords: ch.keywords }))}
              onUpdateStatus={handleUpdatePostStatus}
              onBulkUpdate={handleBulkUpdate}
            />
          )}
          {activeTab === 'publish' && (
            <PublishQueue
              posts={posts}
              onUpdateStatus={handleUpdatePostStatus}
              onBulkUpdate={handleBulkUpdate}
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
