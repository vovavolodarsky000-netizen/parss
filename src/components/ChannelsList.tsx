import React, { useState } from 'react';
import { Channel } from '../types';

interface Props {
  channels: Channel[];
  onAdd: (channel: Omit<Channel, 'id' | 'addedAt'>) => void;
  onRemove: (id: string) => void;
  onToggle: (id: string) => void;
}

export default function ChannelsList({ channels, onAdd, onRemove, onToggle }: Props) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [newChannel, setNewChannel] = useState({
    username: '',
    title: '',
    subscribers: 0,
    category: '',
  });

  const categories = [...new Set(channels.map(ch => ch.category))];
  
  const filtered = channels.filter(ch => {
    const matchesSearch = ch.title.toLowerCase().includes(search.toLowerCase()) ||
      ch.username.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory === 'all' || ch.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAdd = () => {
    if (!newChannel.username || !newChannel.title) return;
    onAdd({
      ...newChannel,
      isActive: true,
      lastParsed: null,
      avatar: `https://api.dicebear.com/4.0/identicon/${newChannel.username}.png?size=80`,
    });
    setNewChannel({ username: '', title: '', subscribers: 0, category: '' });
    setShowAddModal(false);
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
            placeholder="Поиск каналов..."
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
      </div>

      {/* Channels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(channel => (
          <div key={channel.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all">
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
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
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
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Добавить канал</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            <div className="space-y-4">
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Категория</label>
                <input
                  type="text"
                  value={newChannel.category}
                  onChange={e => setNewChannel({...newChannel, category: e.target.value})}
                  placeholder="Технологии, Крипто, Дизайн..."
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
              <button
                onClick={handleAdd}
                disabled={!newChannel.username || !newChannel.title}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Добавить канал
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
