import React, { useMemo } from 'react';
import { DashboardStats, Post, Channel, WebSite } from '../types';

interface Props {
  /** Статистика дашборда */
  stats: DashboardStats;
  /** Последние посты для отображения */
  recentPosts: Post[];
  /** Список каналов */
  channels: Channel[];
  /** Список веб-сайтов */
  sites?: WebSite[];
  /** Функция навигации между вкладками */
  onNavigate: (tab: string) => void;
}

/**
 * Компонент дашборда
 * 
 * @description
 * Отображает общую статистику, последние посты, топ каналов и веб-сайтов.
 * Включает распределение по тематикам и график активности.
 * Мемоизирован для оптимизации производительности.
 */
const Dashboard = React.memo(function Dashboard({ stats, recentPosts, channels, sites = [], onNavigate }: Props) {
  const statCards = [
    { label: 'Всего каналов', value: stats.totalChannels, icon: 'fa-broadcast-tower', color: 'from-blue-500 to-blue-600' },
    { label: 'Активных', value: stats.activeChannels, icon: 'fa-check-circle', color: 'from-green-500 to-green-600' },
    { label: 'Всего постов', value: stats.totalPosts, icon: 'fa-newspaper', color: 'from-purple-500 to-purple-600' },
    { label: 'Новых постов', value: stats.newPosts, icon: 'fa-bell', color: 'from-orange-500 to-orange-600' },
    { label: 'Одобрено', value: stats.approvedPosts, icon: 'fa-thumbs-up', color: 'from-teal-500 to-teal-600' },
    { label: 'Опубликовано', value: stats.publishedPosts, icon: 'fa-paper-plane', color: 'from-indigo-500 to-indigo-600' },
  ];

  const topChannels = [...channels]
    .sort((a, b) => b.subscribers - a.subscribers)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Дашборд</h1>
          <p className="text-gray-500 mt-1">Обзор активности парсера</p>
        </div>
        <div className="text-sm text-gray-500">
          {stats.lastParseTime ? (
            <span>Последний парсинг: {new Date(stats.lastParseTime).toLocaleString('ru-RU')}</span>
          ) : (
            <span>Парсинг ещё не запускался</span>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">{card.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                <i className={`fas ${card.icon} text-white text-lg`}></i>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sites Info */}
      {sites.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <i className="fas fa-globe text-blue-600"></i>
              Веб-сайты
            </h2>
            <button onClick={() => onNavigate('sites')} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Все сайты →
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sites.slice(0, 6).map(site => (
              <div key={site.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-globe text-white text-xs"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{site.name}</p>
                  <p className="text-xs text-gray-500 truncate">{site.url}</p>
                </div>
                <div className={`w-2.5 h-2.5 rounded-full ${site.isActive ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Posts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Последние посты</h2>
            <button onClick={() => onNavigate('posts')} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Все посты →
            </button>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {recentPosts.slice(0, 8).map(post => (
              <div key={post.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-paper-plane text-white text-xs"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{post.channelTitle}</p>
                  <p className="text-sm text-gray-600 truncate">{post.text}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      post.status === 'new' ? 'bg-blue-100 text-blue-700' :
                      post.status === 'approved' ? 'bg-green-100 text-green-700' :
                      post.status === 'published' ? 'bg-purple-100 text-purple-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {post.status === 'new' ? 'Новый' : post.status === 'approved' ? 'Одобрен' : post.status === 'published' ? 'Опубликован' : 'Отклонён'}
                    </span>
                    <span className="text-xs text-gray-400">{new Date(post.date).toLocaleDateString('ru-RU')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Channels */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Топ каналов</h2>
            <button onClick={() => onNavigate('channels')} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Все каналы →
            </button>
          </div>
          <div className="space-y-3">
            {topChannels.map((channel, i) => (
              <div key={channel.id} className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-400 w-6">#{i + 1}</span>
                  <img src={channel.avatar} alt="" className="w-10 h-10 rounded-full" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{channel.title}</p>
                    <p className="text-xs text-gray-500">@{channel.username}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{(channel.subscribers / 1000).toFixed(1)}K</p>
                    <p className="text-xs text-gray-500">подписчиков</p>
                  </div>
                  <div className={`w-2.5 h-2.5 rounded-full ${channel.isActive ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                </div>
                {(channel.topics?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2 ml-9">
                    {(channel.topics || []).slice(0, 3).map(topic => (
                      <span key={topic} className="text-xs bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded-full">{topic}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Topics Distribution */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <i className="fas fa-layer-group text-purple-600"></i>
          Распределение по тематикам
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {(() => {
            const topicCounts: Record<string, number> = {};
            channels.forEach(ch => (ch.topics || []).forEach(t => { topicCounts[t] = (topicCounts[t] || 0) + 1; }));
            return Object.entries(topicCounts)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 10)
              .map(([topic, count]) => (
                <div key={topic} className="bg-purple-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-purple-600">{count}</p>
                  <p className="text-xs text-purple-700 font-medium mt-1">{topic}</p>
                </div>
              ));
          })()}
        </div>
      </div>

      {/* Activity Chart Placeholder */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Активность за неделю</h2>
        <div className="flex items-end gap-2 h-40">
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day, i) => {
            const height = 20 + Math.random() * 80;
            return (
              <div key={day} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col items-center justify-end h-32">
                  <div 
                    className="w-full max-w-[40px] bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-md transition-all hover:from-blue-600 hover:to-blue-500"
                    style={{ height: `${height}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500">{day}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

export default Dashboard;
