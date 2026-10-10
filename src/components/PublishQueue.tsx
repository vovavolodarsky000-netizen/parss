import React, { useState, useMemo, useCallback } from 'react';
import { Post } from '../types';

interface Props {
  /** Список постов для публикации */
  posts: Post[];
  /** Функция обновления статуса поста */
  onUpdateStatus: (id: string, status: Post['status']) => void;
  /** Функция массового обновления статусов */
  onBulkUpdate: (ids: string[], status: Post['status']) => void;
}

/**
 * Компонент очереди публикации
 * 
 * @description
 * Отображает очередь одобренных постов для публикации. Позволяет
 * выбирать посты, указывать целевой канал и запускать процесс публикации.
 * Включает лог публикации и историю опубликованных постов.
 * Мемоизирован для оптимизации производительности.
 */
const PublishQueue = React.memo(function PublishQueue({ posts, onUpdateStatus, onBulkUpdate }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [publishTarget, setPublishTarget] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [publishLog, setPublishLog] = useState<Array<{ time: string; message: string; type: 'success' | 'error' | 'info' }>>([]);

  const approvedPosts = useMemo(() => posts.filter(p => p.status === 'approved'), [posts]);
  const publishedPosts = useMemo(() => posts.filter(p => p.status === 'published'), [posts]);

  const toggleSelect = useCallback((id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }, []);

  const selectAll = useCallback(() => {
    setSelected(prev => {
      if (prev.length === approvedPosts.length) {
        return [];
      }
      return approvedPosts.map(p => p.id);
    });
  }, [approvedPosts]);

  const handlePublish = useCallback(() => {
    if (selected.length === 0) return;
    setPublishing(true);
    
    // Simulate publishing process
    const postsToPublish = approvedPosts.filter(p => selected.includes(p.id));
    let index = 0;

    const interval = setInterval(() => {
      if (index < postsToPublish.length) {
        const post = postsToPublish[index];
        setPublishLog(prev => [{
          time: new Date().toLocaleTimeString('ru-RU'),
          message: `✓ Пост из @${post.channelUsername} опубликован`,
          type: 'success'
        }, ...prev]);
        onUpdateStatus(post.id, 'published');
        index++;
      } else {
        clearInterval(interval);
        setPublishing(false);
        setSelected([]);
        setPublishLog(prev => [{
          time: new Date().toLocaleTimeString('ru-RU'),
          message: `Публикация завершена! Опубликовано ${postsToPublish.length} постов.`,
          type: 'info'
        }, ...prev]);
      }
    }, 500);
  }, [selected, approvedPosts, onUpdateStatus]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Публикация</h1>
          <p className="text-gray-500 mt-1">Очередь на публикацию одобренных постов</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">В очереди</p>
              <p className="text-3xl font-bold mt-1">{approvedPosts.length}</p>
            </div>
            <i className="fas fa-clock text-3xl text-green-200"></i>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Опубликовано</p>
              <p className="text-3xl font-bold mt-1">{publishedPosts.length}</p>
            </div>
            <i className="fas fa-paper-plane text-3xl text-purple-200"></i>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Выбрано</p>
              <p className="text-3xl font-bold mt-1">{selected.length}</p>
            </div>
            <i className="fas fa-check-circle text-3xl text-blue-200"></i>
          </div>
        </div>
      </div>

      {/* Publish Target */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <i className="fas fa-bullhorn text-blue-600"></i>
          Целевой канал для публикации
        </h3>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">@</span>
            <input
              type="text"
              value={publishTarget}
              onChange={e => setPublishTarget(e.target.value)}
              placeholder="your_channel"
              className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <button
            onClick={handlePublish}
            disabled={selected.length === 0 || publishing}
            className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {publishing ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Публикация...
              </>
            ) : (
              <>
                <i className="fas fa-paper-plane"></i>
                Опубликовать ({selected.length})
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Queue */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Очередь на публикацию</h3>
            <button onClick={selectAll} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              {selected.length === approvedPosts.length ? 'Снять всё' : 'Выбрать всё'}
            </button>
          </div>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {approvedPosts.map(post => (
              <div
                key={post.id}
                onClick={() => toggleSelect(post.id)}
                className={`p-3 rounded-lg cursor-pointer transition-all ${
                  selected.includes(post.id) 
                    ? 'bg-blue-50 border border-blue-200' 
                    : 'bg-gray-50 border border-transparent hover:bg-gray-100'
                }`}
              >
                <div className="flex items-start gap-3">
                  <i className={`fas ${selected.includes(post.id) ? 'fa-check-square text-blue-600' : 'fa-square text-gray-300'} mt-0.5`}></i>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">@{post.channelUsername}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">{new Date(post.date).toLocaleDateString('ru-RU')}</span>
                    </div>
                    <p className="text-sm text-gray-700 truncate mt-1">{post.text}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-400">
                        <i className="fas fa-eye mr-1"></i>{post.views.toLocaleString()}
                      </span>
                      {post.hasMedia && (
                        <span className="text-xs text-gray-400">
                          <i className="fas fa-image mr-1"></i>медиа
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {approvedPosts.length === 0 && (
              <div className="text-center py-8">
                <i className="fas fa-inbox text-3xl text-gray-300 mb-3"></i>
                <p className="text-gray-500 text-sm">Нет постов в очереди</p>
                <p className="text-gray-400 text-xs mt-1">Одобрите посты во вкладке "Посты"</p>
              </div>
            )}
          </div>
        </div>

        {/* Publish Log */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <i className="fas fa-terminal text-gray-600"></i>
            Лог публикации
          </h3>
          <div className="space-y-2 max-h-[500px] overflow-y-auto font-mono text-xs">
            {publishLog.length === 0 ? (
              <div className="text-center py-8">
                <i className="fas fa-file-alt text-2xl text-gray-300 mb-2"></i>
                <p className="text-gray-400">Лог пуст</p>
              </div>
            ) : (
              publishLog.map((log, i) => (
                <div key={i} className={`p-2 rounded ${
                  log.type === 'success' ? 'bg-green-50 text-green-700' :
                  log.type === 'error' ? 'bg-red-50 text-red-700' :
                  'bg-blue-50 text-blue-700'
                }`}>
                  <span className="text-gray-400">[{log.time}]</span> {log.message}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Published */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <i className="fas fa-history text-purple-600"></i>
          Недавно опубликованные
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {publishedPosts.slice(0, 6).map(post => (
            <div key={post.id} className="p-3 bg-purple-50 rounded-lg border border-purple-100">
              <div className="flex items-center gap-2 mb-1">
                <i className="fas fa-check-circle text-green-500 text-xs"></i>
                <span className="text-xs font-medium text-gray-900">@{post.channelUsername}</span>
              </div>
              <p className="text-xs text-gray-600 line-clamp-2">{post.text}</p>
              <p className="text-xs text-gray-400 mt-2">
                {new Date(post.parsedAt).toLocaleString('ru-RU')}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

export default PublishQueue;
