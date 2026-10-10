import React, { useState, useMemo, useCallback } from 'react';
import { Channel, AVAILABLE_TOPICS } from '../types';

interface Props {
  /** Список каналов для отображения */
  channels: Channel[];
  /** Функция добавления нового канала */
  onAdd: (channel: Omit<Channel, 'id' | 'addedAt'>) => void;
  /** Функция удаления канала */
  onRemove: (id: string) => void;
  /** Функция переключения активности канала */
  onToggle: (id: string) => void;
}

/**
 * Компонент списка каналов
 * 
 * @description
 * Отображает список Telegram каналов с фильтрацией по категориям и тематикам.
 * Позволяет добавлять, удалять и переключать активность каналов.
 * Поддерживает выбор тематик и ключевых слов для каждого канала.
 * Мемоизирован для оптимизации производительности.
 */
const ChannelsList = React.memo(function ChannelsList({ channels, onAdd, onRemove, onToggle }: Props) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterTopic, setFilterTopic] = useState('all');
  const [expandedChannel, setExpandedChannel] = useState<string | null>(null);
  const [newChannel, setNewChannel] = useState({
    username: '',
    title: '',
    subscribers: 0,
    category: '',
    topics: [] as string[],
    keywords: [] as string[],
  });
  const [newKeyword, setNewKeyword] = useState('');

  const categories = useMemo(() => [...new Set(channels.map(ch => ch.category))], [channels]);
  const allTopics = useMemo(() => [...new Set(channels.flatMap(ch => ch.topics || []))], [channels]);
  
  const filtered = useMemo(() => {
    return channels.filter(ch => {
      const topics = ch.topics || [];
      const keywords = ch.keywords || [];
      const matchesSearch = ch.title.toLowerCase().includes(search.toLowerCase()) ||
        ch.username.toLowerCase().includes(search.toLowerCase()) ||
        keywords.some(k => k.toLowerCase().includes(search.toLowerCase()));
      const matchesCategory = filterCategory === 'all' || ch.category === filterCategory;
      const matchesTopic = filterTopic === 'all' || topics.includes(filterTopic);
      return matchesSearch && matchesCategory && matchesTopic;
    });
  }, [channels, search, filterCategory, filterTopic]);

  const handleAdd = () => {
    if (!newChannel.username || !newChannel.title) return;
    onAdd({
      ...newChannel,
      isActive: true,
      lastParsed: null,
      avatar: `https://api.dicebear.com/4.0/identicon/${newChannel.username}.png?size=80`,
    });
    setNewChannel({ username: '', title: '', subscribers: 0, category: '', topics: [], keywords: [] });
    setNewKeyword('');
    setShowAddModal(false);
  };

  const addKeyword = () => {
    const kw = newKeyword.trim();
    if (kw && !newChannel.keywords.includes(kw)) {
      setNewChannel({ ...newChannel, keywords: [...newChannel.keywords, kw] });
      setNewKeyword('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setNewChannel({ ...newChannel, keywords: newChannel.keywords.filter(k => k !== keyword) });
  };

  const toggleTopic = (topic: string) => {
    setNewChannel(prev => ({
      ...prev,
      topics: prev.topics.includes(topic)
        ? prev.topics.filter(t => t !== topic)
        : [...prev.topics, topic],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Каналы</h1>
          <p className="text-gray-500 mt-1">Управление каналами для парсинга</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <i className="fas fa-plus"></i>
          Добавить канал
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input
            type="text"
            placeholder="Поиск каналов, ключевых слов..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
        >
          <option value="all">Все категории</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
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
      </div>

      {/* Channels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(channel => (
          <div key={channel.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="p-5">
              <div className="flex items-start gap-4">
                <img src={channel.avatar} alt="" className="w-14 h-14 rounded-full ring-2 ring-gray-100" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 truncate">{channel.title}</h3>
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${channel.isActive ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  </div>
                  <p className="text-sm text-gray-500">@{channel.username}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <i className="fas fa-users"></i>
                      {(channel.subscribers / 1000).toFixed(1)}K
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <i className="fas fa-tag"></i>
                      {channel.category}
                    </span>
                    {channel.lastParsed && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <i className="fas fa-clock"></i>
                        {new Date(channel.lastParsed).toLocaleDateString('ru-RU')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Topics */}
              {(channel.topics?.length ?? 0) > 0 && (
                <div className="mt-3">
                  <div className="flex items-center gap-1 mb-1.5">
                    <i className="fas fa-layer-group text-xs text-purple-500"></i>
                    <span className="text-xs font-medium text-gray-500">Тематики</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(channel.topics || []).map(topic => (
                      <span key={topic} className="inline-flex items-center px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Keywords */}
              {(channel.keywords?.length ?? 0) > 0 && (
                <div className="mt-3">
                  <div className="flex items-center gap-1 mb-1.5">
                    <i className="fas fa-key text-xs text-amber-500"></i>
                    <span className="text-xs font-medium text-gray-500">Ключевые слова</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(channel.keywords || []).slice(0, expandedChannel === channel.id ? undefined : 5).map(keyword => (
                      <span key={keyword} className="inline-flex items-center px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">
                        {keyword}
                      </span>
                    ))}
                    {(channel.keywords?.length ?? 0) > 5 && expandedChannel !== channel.id && (
                      <button
                        onClick={() => setExpandedChannel(channel.id)}
                        className="text-xs text-blue-600 hover:text-blue-700 px-1"
                      >
                        +{(channel.keywords?.length ?? 0) - 5} ещё
                      </button>
                    )}
                    {expandedChannel === channel.id && (channel.keywords?.length ?? 0) > 5 && (
                      <button
                        onClick={() => setExpandedChannel(null)}
                        className="text-xs text-blue-600 hover:text-blue-700 px-1"
                      >
                        свернуть
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 px-5 py-3 border-t border-gray-100">
              <button
                onClick={() => onToggle(channel.id)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  channel.isActive 
                    ? 'bg-green-50 text-green-700 hover:bg-green-100' 
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <i className={`fas ${channel.isActive ? 'fa-pause' : 'fa-play'} mr-1`}></i>
                {channel.isActive ? 'Активен' : 'Пауза'}
              </button>
              <button
                onClick={() => onRemove(channel.id)}
                className="px-3 py-2 rounded-lg text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
              >
                <i className="fas fa-trash"></i>
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <i className="fas fa-search text-4xl text-gray-300 mb-4"></i>
          <p className="text-gray-500">Каналы не найдены</p>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Добавить канал</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            <div className="p-6 space-y-5">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <i className="fas fa-info-circle text-blue-500"></i>
                  Основная информация
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username канала</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                    <input
                      type="text"
                      value={newChannel.username}
                      onChange={e => setNewChannel({...newChannel, username: e.target.value})}
                      placeholder="channel_name"
                      className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
                  <input
                    type="text"
                    value={newChannel.title}
                    onChange={e => setNewChannel({...newChannel, title: e.target.value})}
                    placeholder="Название канала"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Категория</label>
                    <input
                      type="text"
                      value={newChannel.category}
                      onChange={e => setNewChannel({...newChannel, category: e.target.value})}
                      placeholder="Технологии, Крипто..."
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Подписчики</label>
                    <input
                      type="number"
                      value={newChannel.subscribers || ''}
                      onChange={e => setNewChannel({...newChannel, subscribers: parseInt(e.target.value) || 0})}
                      placeholder="10000"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Topics Selection */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <i className="fas fa-layer-group text-purple-500"></i>
                  Тематики
                  <span className="text-xs font-normal text-gray-400">(выберите одну или несколько)</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_TOPICS.map(topic => (
                    <button
                      key={topic}
                      onClick={() => toggleTopic(topic)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        newChannel.topics.includes(topic)
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {newChannel.topics.includes(topic) && <i className="fas fa-check mr-1 text-xs"></i>}
                      {topic}
                    </button>
                  ))}
                </div>
                {newChannel.topics.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <i className="fas fa-check-circle text-purple-500"></i>
                    Выбрано: {newChannel.topics.length} тематик
                  </div>
                )}
              </div>

              {/* Keywords */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <i className="fas fa-key text-amber-500"></i>
                  Ключевые слова
                  <span className="text-xs font-normal text-gray-400">(для фильтрации контента)</span>
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newKeyword}
                    onChange={e => setNewKeyword(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addKeyword(); } }}
                    placeholder="Введите ключевое слово и нажмите Enter"
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                  <button
                    onClick={addKeyword}
                    disabled={!newKeyword.trim()}
                    className="px-4 py-2.5 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <i className="fas fa-plus"></i>
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {newChannel.keywords.map(keyword => (
                    <span key={keyword} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-sm font-medium">
                      {keyword}
                      <button onClick={() => removeKeyword(keyword)} className="text-amber-400 hover:text-red-500 transition-colors">
                        <i className="fas fa-times text-xs"></i>
                      </button>
                    </span>
                  ))}
                </div>
                {newChannel.keywords.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <i className="fas fa-check-circle text-amber-500"></i>
                    Добавлено: {newChannel.keywords.length} ключевых слов
                  </div>
                )}
              </div>

              {/* Summary */}
              {(newChannel.topics.length > 0 || newChannel.keywords.length > 0) && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <h4 className="text-sm font-semibold text-gray-700">Итоговая конфигурация:</h4>
                  {newChannel.topics.length > 0 && (
                    <div className="flex items-start gap-2">
                      <i className="fas fa-layer-group text-purple-500 mt-0.5 text-xs"></i>
                      <div className="flex flex-wrap gap-1">
                        {newChannel.topics.map(t => (
                          <span key={t} className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {newChannel.keywords.length > 0 && (
                    <div className="flex items-start gap-2">
                      <i className="fas fa-key text-amber-500 mt-0.5 text-xs"></i>
                      <div className="flex flex-wrap gap-1">
                        {newChannel.keywords.map(k => (
                          <span key={k} className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{k}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={handleAdd}
                disabled={!newChannel.username || !newChannel.title}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="fas fa-plus mr-2"></i>
                Добавить канал
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default ChannelsList;
