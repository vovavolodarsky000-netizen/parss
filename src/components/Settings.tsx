import React, { useState } from 'react';
import { ParserSettings, AVAILABLE_TOPICS } from '../types';

interface Props {
  settings: ParserSettings;
  onSave: (settings: ParserSettings) => void;
  onReset: () => void;
}

export default function Settings({ settings, onSave, onReset }: Props) {
  const [local, setLocal] = useState<ParserSettings>({ ...settings });
  const [newKeyword, setNewKeyword] = useState('');
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSave(local);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !local.filterKeywords.includes(newKeyword.trim())) {
      setLocal({ ...local, filterKeywords: [...local.filterKeywords, newKeyword.trim()] });
      setNewKeyword('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setLocal({ ...local, filterKeywords: local.filterKeywords.filter(k => k !== keyword) });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Настройки</h1>
          <p className="text-gray-500 mt-1">Конфигурация парсера и фильтров</p>
        </div>
        <button
          onClick={handleSave}
          className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
            saved ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <i className={`fas ${saved ? 'fa-check' : 'fa-save'}`}></i>
          {saved ? 'Сохранено!' : 'Сохранить'}
        </button>
      </div>

      {/* API Configuration */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <i className="fas fa-key text-blue-600"></i>
          Telegram API
        </h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-yellow-800">
            <i className="fas fa-info-circle mr-1"></i>
            Для работы парсера необходимо получить API credentials на <a href="https://my.telegram.org" target="_blank" rel="noopener noreferrer" className="underline font-medium">my.telegram.org</a>. 
            Создайте приложение и скопируйте api_id и api_hash.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API ID</label>
            <input
              type="text"
              value={local.apiId}
              onChange={e => setLocal({ ...local, apiId: e.target.value })}
              placeholder="12345678"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API Hash</label>
            <input
              type="password"
              value={local.apiHash}
              onChange={e => setLocal({ ...local, apiHash: e.target.value })}
              placeholder="••••••••••••••••"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Bot Token (опционально)</label>
            <input
              type="password"
              value={local.apiToken}
              onChange={e => setLocal({ ...local, apiToken: e.target.value })}
              placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono"
            />
          </div>
        </div>
      </div>

      {/* Parsing Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <i className="fas fa-cog text-purple-600"></i>
          Параметры парсинга
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Интервал парсинга (минуты)</label>
            <input
              type="number"
              value={local.parseInterval}
              onChange={e => setLocal({ ...local, parseInterval: parseInt(e.target.value) || 30 })}
              min={5}
              max={1440}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">Как часто проверять каналы на новые посты</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Макс. постов за раз</label>
            <input
              type="number"
              value={local.maxPostsPerChannel}
              onChange={e => setLocal({ ...local, maxPostsPerChannel: parseInt(e.target.value) || 50 })}
              min={1}
              max={200}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">Максимальное количество постов с одного канала</p>
          </div>
        </div>
        <div className="mt-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={local.autoApprove}
              onChange={e => setLocal({ ...local, autoApprove: e.target.checked })}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-700">Авто-одобрение постов</span>
              <p className="text-xs text-gray-500">Автоматически отмечать новые посты как одобренные</p>
            </div>
          </label>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <i className="fas fa-filter text-green-600"></i>
          Фильтры
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Мин. количество просмотров</label>
            <input
              type="number"
              value={local.filterMinViews}
              onChange={e => setLocal({ ...local, filterMinViews: parseInt(e.target.value) || 0 })}
              min={0}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">Игнорировать посты с меньшим числом просмотров</p>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-3 cursor-pointer pb-2">
              <input
                type="checkbox"
                checked={local.filterMediaOnly}
                onChange={e => setLocal({ ...local, filterMediaOnly: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">Только с медиа</span>
                <p className="text-xs text-gray-500">Собирать только посты с фото/видео</p>
              </div>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ключевые слова (фильтр)</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newKeyword}
              onChange={e => setNewKeyword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addKeyword()}
              placeholder="Добавить ключевое слово..."
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <button
              onClick={addKeyword}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <i className="fas fa-plus"></i>
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {local.filterKeywords.map(keyword => (
              <span key={keyword} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                {keyword}
                <button onClick={() => removeKeyword(keyword)} className="text-gray-400 hover:text-red-500">
                  <i className="fas fa-times text-xs"></i>
                </button>
              </span>
            ))}
            {local.filterKeywords.length === 0 && (
              <span className="text-sm text-gray-400">Ключевые слова не добавлены</span>
            )}
          </div>
        </div>

        {/* Global Topics Filter */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <i className="fas fa-layer-group text-purple-500 mr-1"></i>
            Глобальные тематики (фильтр для всех каналов)
          </label>
          <p className="text-xs text-gray-500 mb-3">Посты будут собираться только из каналов, относящихся к выбранным тематикам. Если не выбрано ни одной — собираются все.</p>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_TOPICS.map(topic => (
              <button
                key={topic}
                onClick={() => {
                  const current = local.filterTopics || [];
                  const updated = current.includes(topic)
                    ? current.filter(t => t !== topic)
                    : [...current, topic];
                  setLocal({ ...local, filterTopics: updated });
                }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  (local.filterTopics || []).includes(topic)
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {(local.filterTopics || []).includes(topic) && <i className="fas fa-check mr-1 text-xs"></i>}
                {topic}
              </button>
            ))}
          </div>
          {(local.filterTopics || []).length > 0 && (
            <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
              <i className="fas fa-check-circle text-purple-500"></i>
              Выбрано тематик: {(local.filterTopics || []).length} из {AVAILABLE_TOPICS.length}
            </div>
          )}
        </div>
      </div>

      {/* Export/Import */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <i className="fas fa-database text-indigo-600"></i>
          Данные
        </h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              const data = {
                channels: localStorage.getItem('tg_parser_channels'),
                posts: localStorage.getItem('tg_parser_posts'),
                settings: localStorage.getItem('tg_parser_settings'),
              };
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'tg_parser_backup.json';
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors font-medium"
          >
            <i className="fas fa-download mr-2"></i>Экспорт данных
          </button>
          <button
            onClick={() => setShowConfirmReset(true)}
            className="px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium"
          >
            <i className="fas fa-trash mr-2"></i>Сбросить все данные
          </button>
        </div>
      </div>

      {/* Reset Confirmation */}
      {showConfirmReset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-exclamation-triangle text-2xl text-red-600"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Сбросить все данные?</h3>
              <p className="text-sm text-gray-500 mb-6">Все каналы, посты и настройки будут удалены. Это действие нельзя отменить.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmReset(false)}
                  className="flex-1 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Отмена
                </button>
                <button
                  onClick={() => { onReset(); setShowConfirmReset(false); }}
                  className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                  Удалить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
