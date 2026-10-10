import React, { useState, useMemo, useCallback } from 'react';
import { Post } from '../types';

interface Props {
  posts: Post[];
  channels?: Array<{ id: string; title: string; topics: string[]; keywords: string[] }>;
  onUpdateStatus: (id: string, status: Post['status']) => void;
  onBulkUpdate: (ids: string[], status: Post['status']) => void;
}

const PostsList = React.memo(function PostsList({ posts, channels: allChannels = [], onUpdateStatus, onBulkUpdate }: Props) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterChannel, setFilterChannel] = useState<string>('all');
  const [filterTopic, setFilterTopic] = useState<string>('all');
  const [selected, setSelected] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [expandedPost, setExpandedPost] = useState<string | null>(null);

  const channels = useMemo(() => [...new Set(posts.map(p => p.channelTitle))], [posts]);
  const allTopics = useMemo(() => [...new Set(allChannels.flatMap(ch => ch.topics || []))], [allChannels]);

  // Map channel title to channel data
  const getChannelData = useCallback((channelTitle: string) => {
    return allChannels.find(ch => ch.title === channelTitle);
  }, [allChannels]);

  const filtered = useMemo(() => {
    return posts.filter(p => {
      const matchesSearch = p.text.toLowerCase().includes(search.toLowerCase()) ||
        p.channelTitle.toLowerCase().includes(search.toLowerCase()) ||
        p.hashtags.some(h => h.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
      const matchesChannel = filterChannel === 'all' || p.channelTitle === filterChannel;
      const channelData = getChannelData(p.channelTitle);
      const matchesTopic = filterTopic === 'all' || (channelData && (channelData.topics || []).includes(filterTopic));
      return matchesSearch && matchesStatus && matchesChannel && matchesTopic;
    });
  }, [posts, search, filterStatus, filterChannel, filterTopic, getChannelData]);

  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const selectAll = () => {
    if (selected.length === filtered.length) {
      setSelected([]);
    } else {
      setSelected(filtered.map(p => p.id));
    }
  };

  const statusCounts = {
    all: posts.length,
    new: posts.filter(p => p.status === 'new').length,
    approved: posts.filter(p => p.status === 'approved').length,
    published: posts.filter(p => p.status === 'published').length,
    rejected: posts.filter(p => p.status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Посты</h1>
          <p className="text-gray-500 mt-1">Собранные посты из каналов</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <i className="fas fa-list"></i>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <i className="fas fa-th"></i>
          </button>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { key: 'all', label: 'Все', icon: 'fa-layer-group' },
          { key: 'new', label: 'Новые', icon: 'fa-bell' },
          { key: 'approved', label: 'Одобренные', icon: 'fa-check' },
          { key: 'published', label: 'Опубликованные', icon: 'fa-paper-plane' },
          { key: 'rejected', label: 'Отклонённые', icon: 'fa-times' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilterStatus(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
              filterStatus === tab.key 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <i className={`fas ${tab.icon}`}></i>
            {tab.label}
            <span className={`px-1.5 py-0.5 rounded-full text-xs ${
              filterStatus === tab.key ? 'bg-white/20' : 'bg-gray-100'
            }`}>
              {statusCounts[tab.key as keyof typeof statusCounts]}
            </span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input
            type="text"
            placeholder="Поиск по тексту, каналу, хештегам, ключевым словам..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
        <select
          value={filterChannel}
          onChange={e => setFilterChannel(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
        >
          <option value="all">Все каналы</option>
          {channels.map(ch => (
            <option key={ch} value={ch}>{ch}</option>
          ))}
        </select>
        {allTopics.length > 0 && (
          <select
            value={filterTopic}
            onChange={e => setFilterTopic(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
          >
            <option value="all">Все тематики</option>
            {allTopics.map(topic => (
              <option key={topic} value={topic}>{topic}</option>
            ))}
          </select>
        )}
      </div>

      {/* Bulk Actions */}
      {selected.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
          <span className="text-sm text-blue-700 font-medium">Выбрано: {selected.length}</span>
          <div className="flex gap-2">
            <button
              onClick={() => { onBulkUpdate(selected, 'approved'); setSelected([]); }}
              className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
            >
              <i className="fas fa-check mr-1"></i> Одобрить
            </button>
            <button
              onClick={() => { onBulkUpdate(selected, 'published'); setSelected([]); }}
              className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
            >
              <i className="fas fa-paper-plane mr-1"></i> Опубликовать
            </button>
            <button
              onClick={() => { onBulkUpdate(selected, 'rejected'); setSelected([]); }}
              className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
            >
              <i className="fas fa-times mr-1"></i> Отклонить
            </button>
          </div>
        </div>
      )}

      {/* Select All */}
      <div className="flex items-center gap-2">
        <button onClick={selectAll} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          <i className={`fas ${selected.length === filtered.length ? 'fa-check-square' : 'fa-square'} mr-1`}></i>
          {selected.length === filtered.length ? 'Снять выделение' : 'Выбрать все'}
        </button>
        <span className="text-sm text-gray-400">({filtered.length} постов)</span>
      </div>

      {/* Posts */}
      {viewMode === 'list' ? (
        <div className="space-y-3">
          {filtered.map(post => (
            <div key={post.id} className={`bg-white rounded-xl shadow-sm border transition-all ${
              selected.includes(post.id) ? 'border-blue-300 bg-blue-50/30' : 'border-gray-100 hover:shadow-md'
            }`}>
              <div className="p-4">
                  <div className="flex items-start gap-3">
                  <button onClick={() => toggleSelect(post.id)} className="mt-1">
                    <i className={`fas ${selected.includes(post.id) ? 'fa-check-square text-blue-600' : 'fa-square text-gray-300'}`}></i>
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900">{post.channelTitle}</span>
                      {post.source === 'web' && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-medium">
                          <i className="fas fa-globe mr-0.5"></i>Web
                        </span>
                      )}
                      {post.source === 'telegram' && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-sky-50 text-sky-600 font-medium">
                          <i className="fab fa-telegram mr-0.5"></i>TG
                        </span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        post.status === 'new' ? 'bg-blue-100 text-blue-700' :
                        post.status === 'approved' ? 'bg-green-100 text-green-700' :
                        post.status === 'published' ? 'bg-purple-100 text-purple-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {post.status === 'new' ? 'Новый' : post.status === 'approved' ? 'Одобрен' : post.status === 'published' ? 'Опубликован' : 'Отклонён'}
                      </span>
                      {post.hasMedia && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          <i className={`fas ${post.mediaType === 'photo' ? 'fa-image' : post.mediaType === 'video' ? 'fa-video' : 'fa-file'} mr-1`}></i>
                          {post.mediaType}
                        </span>
                      )}
                      {(() => {
                        const chData = getChannelData(post.channelTitle);
                        if (chData && (chData.topics?.length ?? 0) > 0) {
                          return (chData.topics || []).slice(0, 2).map(t => (
                            <span key={t} className="text-xs px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-600">{t}</span>
                          ));
                        }
                        return null;
                      })()}
                    </div>                    <p className={`text-sm text-gray-700 ${expandedPost === post.id ? '' : 'line-clamp-2'}`}>
                      {post.text}
                    </p>
                    {post.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {post.hashtags.map(tag => (
                          <span key={tag} className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{tag}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-gray-400">
                        <i className="fas fa-eye mr-1"></i>{post.views.toLocaleString()}
                      </span>
                      <span className="text-xs text-gray-400">
                        <i className="fas fa-clock mr-1"></i>{new Date(post.date).toLocaleString('ru-RU')}
                      </span>
                      <button 
                        onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        {expandedPost === post.id ? 'Свернуть' : 'Подробнее'}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {post.status === 'new' && (
                      <>
                        <button
                          onClick={() => onUpdateStatus(post.id, 'approved')}
                          className="p-2 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
                          title="Одобрить"
                        >
                          <i className="fas fa-check"></i>
                        </button>
                        <button
                          onClick={() => onUpdateStatus(post.id, 'rejected')}
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                          title="Отклонить"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </>
                    )}
                    {post.status === 'approved' && (
                      <button
                        onClick={() => onUpdateStatus(post.id, 'published')}
                        className="p-2 rounded-lg text-purple-600 hover:bg-purple-50 transition-colors"
                        title="Опубликовать"
                      >
                        <i className="fas fa-paper-plane"></i>
                      </button>
                    )}
                  </div>
                </div>
              </div>
              {post.hasMedia && post.mediaUrl && expandedPost === post.id && (
                <div className="px-4 pb-4">
                  <img src={post.mediaUrl} alt="" className="w-full max-h-64 object-cover rounded-lg" />
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(post => (
            <div key={post.id} className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all hover:shadow-md ${
              selected.includes(post.id) ? 'border-blue-300' : 'border-gray-100'
            }`}>
              {post.hasMedia && post.mediaUrl && (
                <img src={post.mediaUrl} alt="" className="w-full h-40 object-cover" />
              )}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-gray-900 truncate">{post.channelTitle}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                    post.status === 'new' ? 'bg-blue-100 text-blue-700' :
                    post.status === 'approved' ? 'bg-green-100 text-green-700' :
                    post.status === 'published' ? 'bg-purple-100 text-purple-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {post.status === 'new' ? 'Новый' : post.status === 'approved' ? 'Одобрен' : post.status === 'published' ? 'Опубликован' : 'Отклонён'}
                  </span>
                </div>
                <p className="text-sm text-gray-700 line-clamp-3">{post.text}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-gray-400">
                    <i className="fas fa-eye mr-1"></i>{post.views.toLocaleString()}
                  </span>
                  <div className="flex gap-1">
                    {post.status === 'new' && (
                      <>
                        <button onClick={() => onUpdateStatus(post.id, 'approved')} className="p-1.5 rounded text-green-600 hover:bg-green-50">
                          <i className="fas fa-check text-xs"></i>
                        </button>
                        <button onClick={() => onUpdateStatus(post.id, 'rejected')} className="p-1.5 rounded text-red-600 hover:bg-red-50">
                          <i className="fas fa-times text-xs"></i>
                        </button>
                      </>
                    )}
                    {post.status === 'approved' && (
                      <button onClick={() => onUpdateStatus(post.id, 'published')} className="p-1.5 rounded text-purple-600 hover:bg-purple-50">
                        <i className="fas fa-paper-plane text-xs"></i>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <i className="fas fa-inbox text-4xl text-gray-300 mb-4"></i>
          <p className="text-gray-500">Посты не найдены</p>
        </div>
      )}
    </div>
  );
});

export default PostsList;
