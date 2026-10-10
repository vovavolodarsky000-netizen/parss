import React, { useState, useMemo, useCallback } from 'react';
import { WebSite, ParseRule, AVAILABLE_TOPICS } from '../types';
import { useDebounce } from '../hooks/useDebounce';

interface Props {
  /** Список веб-сайтов для отображения */
  sites: WebSite[];
  /** Функция добавления нового сайта */
  onAdd: (site: Omit<WebSite, 'id' | 'addedAt'>) => void;
  /** Функция удаления сайта */
  onRemove: (id: string) => void;
  /** Функция переключения активности сайта */
  onToggle: (id: string) => void;
  /** Функция обновления данных сайта */
  onUpdate: (id: string, updates: Partial<WebSite>) => void;
  /** Функция запуска парсинга */
  onParse?: () => void;
  /** Флаг активного парсинга */
  isParsing?: boolean;
}

/**
 * Компонент управления веб-сайтами
 * 
 * @description
 * Отображает список веб-сайтов для парсинга с фильтрацией по тематикам.
 * Позволяет добавлять, удалять, переключать активность и настраивать
 * правила парсинга для каждого сайта. Мемоизирован для оптимизации производительности.
 */
const SitesManager = React.memo(function SitesManager({ sites, onAdd, onRemove, onToggle, onUpdate, onParse, isParsing }: Props) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [editingSite, setEditingSite] = useState<WebSite | null>(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300); // PERF: debounce поиска
  const [filterTopic, setFilterTopic] = useState('all');

  const [newSite, setNewSite] = useState({
    name: '',
    url: '',
    topics: [] as string[],
    keywords: [] as string[],
    parseRules: [] as ParseRule[],
    isActive: true,
    lastParsed: null,
  });
  const [newKeyword, setNewKeyword] = useState('');

  const allTopics = useMemo(() => [...new Set(sites.flatMap(s => s.topics || []))], [sites]);

  const filtered = useMemo(() => {
    return sites.filter(s => {
      const topics = s.topics || [];
      const keywords = s.keywords || [];
      const matchesSearch = s.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        s.url.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        keywords.some(k => k.toLowerCase().includes(debouncedSearch.toLowerCase()));
      const matchesTopic = filterTopic === 'all' || topics.includes(filterTopic);
      return matchesSearch && matchesTopic;
    });
  }, [sites, debouncedSearch, filterTopic]);

  const handleAdd = useCallback(() => {
    if (!newSite.name || !newSite.url) return;
    onAdd(newSite);
    setNewSite({ name: '', url: '', topics: [], keywords: [], parseRules: [], isActive: true, lastParsed: null });
    setNewKeyword('');
    setShowAddModal(false);
  }, [newSite, onAdd]);

  const addKeyword = useCallback(() => {
    const kw = newKeyword.trim();
    if (kw && !newSite.keywords.includes(kw)) {
      setNewSite(prev => ({ ...prev, keywords: [...prev.keywords, kw] }));
      setNewKeyword('');
    }
  }, [newKeyword, newSite.keywords]);

  const removeKeyword = useCallback((keyword: string) => {
    setNewSite(prev => ({ 
      ...prev, 
      keywords: prev.keywords.filter(k => k !== keyword) 
    }));
  }, []);

  const toggleTopic = useCallback((topic: string) => {
    setNewSite(prev => ({
      ...prev,
      topics: prev.topics.includes(topic)
        ? prev.topics.filter(t => t !== topic)
        : [...prev.topics, topic],
    }));
  }, []);

  const openRulesModal = useCallback((site: WebSite) => {
    setEditingSite(site);
    setShowRulesModal(true);
  }, []);

  const addRule = useCallback(() => {
    if (!editingSite) return;
    const newRule: ParseRule = {
      id: `rule_${Date.now()}`,
      name: 'Новое правило',
      urlPattern: '/*',
      titleSelector: 'h1',
      contentSelector: 'article',
      maxItems: 10,
      isActive: true,
    };
    onUpdate(editingSite.id, { parseRules: [...editingSite.parseRules, newRule] });
  }, [editingSite, onUpdate]);

  const updateRule = useCallback((ruleId: string, updates: Partial<ParseRule>) => {
    if (!editingSite) return;
    const updatedRules = editingSite.parseRules.map(r =>
      r.id === ruleId ? { ...r, ...updates } : r
    );
    onUpdate(editingSite.id, { parseRules: updatedRules });
    setEditingSite({ ...editingSite, parseRules: updatedRules });
  }, [editingSite, onUpdate]);

  const removeRule = useCallback((ruleId: string) => {
    if (!editingSite) return;
    const updatedRules = editingSite.parseRules.filter(r => r.id !== ruleId);
    onUpdate(editingSite.id, { parseRules: updatedRules });
    setEditingSite({ ...editingSite, parseRules: updatedRules });
  }, [editingSite, onUpdate]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Веб-сайты</h1>
          <p className="text-gray-500 mt-1">Управление парсингом веб-сайтов</p>
        </div>
        <div className="flex items-center gap-2">
          {onParse && (
            <button
              onClick={onParse}
              disabled={isParsing}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isParsing ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Парсинг...
                </>
              ) : (
                <>
                  <i className="fas fa-sync-alt"></i>
                  Парсить сайты
                </>
              )}
            </button>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <i className="fas fa-plus"></i>
            Добавить сайт
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input
            type="text"
            placeholder="Поиск сайтов, ключевых слов..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
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

      {/* Sites Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(site => (
          <div key={site.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-globe text-white text-lg"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 truncate">{site.name}</h3>
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${site.isActive ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  </div>
                  <a href={site.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline truncate block">
                    {site.url}
                  </a>
                </div>
              </div>

              {/* Topics */}
              {(site.topics?.length ?? 0) > 0 && (
                <div className="mb-3">
                  <div className="flex items-center gap-1 mb-1.5">
                    <i className="fas fa-layer-group text-xs text-purple-500"></i>
                    <span className="text-xs font-medium text-gray-500">Тематики</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(site.topics || []).map(topic => (
                      <span key={topic} className="inline-flex items-center px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Keywords */}
              {(site.keywords?.length ?? 0) > 0 && (
                <div className="mb-3">
                  <div className="flex items-center gap-1 mb-1.5">
                    <i className="fas fa-key text-xs text-amber-500"></i>
                    <span className="text-xs font-medium text-gray-500">Ключевые слова</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(site.keywords || []).slice(0, 4).map(keyword => (
                      <span key={keyword} className="inline-flex items-center px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">
                        {keyword}
                      </span>
                    ))}
                    {(site.keywords?.length ?? 0) > 4 && (
                      <span className="text-xs text-gray-400">+{(site.keywords?.length ?? 0) - 4}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Parse Rules */}
              <div className="mb-3">
                <div className="flex items-center gap-1 mb-1.5">
                  <i className="fas fa-cog text-xs text-gray-500"></i>
                  <span className="text-xs font-medium text-gray-500">Правила парсинга</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">{site.parseRules.length}</span>
                  <span className="text-xs text-gray-500">правил</span>
                  <button
                    onClick={() => openRulesModal(site)}
                    className="ml-auto text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Настроить <i className="fas fa-arrow-right ml-1"></i>
                  </button>
                </div>
              </div>

              {site.lastParsed && (
                <div className="text-xs text-gray-400 flex items-center gap-1">
                  <i className="fas fa-clock"></i>
                  {new Date(site.lastParsed).toLocaleString('ru-RU')}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 px-5 py-3 border-t border-gray-100">
              <button
                onClick={() => onToggle(site.id)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  site.isActive
                    ? 'bg-green-50 text-green-700 hover:bg-green-100'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <i className={`fas ${site.isActive ? 'fa-pause' : 'fa-play'} mr-1`}></i>
                {site.isActive ? 'Активен' : 'Пауза'}
              </button>
              <button
                onClick={() => onRemove(site.id)}
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
          <i className="fas fa-globe text-4xl text-gray-300 mb-4"></i>
          <p className="text-gray-500">Сайты не найдены</p>
        </div>
      )}

      {/* Add Site Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Добавить сайт</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Название сайта</label>
                  <input
                    type="text"
                    value={newSite.name}
                    onChange={e => setNewSite({ ...newSite, name: e.target.value })}
                    placeholder="TechCrunch"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL сайта</label>
                  <input
                    type="url"
                    value={newSite.url}
                    onChange={e => setNewSite({ ...newSite, url: e.target.value })}
                    placeholder="https://example.com"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              {/* Topics */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <i className="fas fa-layer-group text-purple-500"></i>
                  Тематики
                </h3>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_TOPICS.map(topic => (
                    <button
                      key={topic}
                      onClick={() => toggleTopic(topic)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        newSite.topics.includes(topic)
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {newSite.topics.includes(topic) && <i className="fas fa-check mr-1 text-xs"></i>}
                      {topic}
                    </button>
                  ))}
                </div>
              </div>

              {/* Keywords */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <i className="fas fa-key text-amber-500"></i>
                  Ключевые слова
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newKeyword}
                    onChange={e => setNewKeyword(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addKeyword(); } }}
                    placeholder="Введите ключевое слово"
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                  <button
                    onClick={addKeyword}
                    disabled={!newKeyword.trim()}
                    className="px-4 py-2.5 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-50"
                  >
                    <i className="fas fa-plus"></i>
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {newSite.keywords.map(keyword => (
                    <span key={keyword} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-sm font-medium">
                      {keyword}
                      <button onClick={() => removeKeyword(keyword)} className="text-amber-400 hover:text-red-500">
                        <i className="fas fa-times text-xs"></i>
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={handleAdd}
                disabled={!newSite.name || !newSite.url}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
              >
                <i className="fas fa-plus mr-2"></i>
                Добавить сайт
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rules Modal */}
      {showRulesModal && editingSite && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Правила парсинга</h2>
                <p className="text-sm text-gray-500">{editingSite.name}</p>
              </div>
              <button onClick={() => setShowRulesModal(false)} className="text-gray-400 hover:text-gray-600">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <i className="fas fa-info-circle mr-1"></i>
                  Настройте CSS-селекторы для извлечения данных со страниц сайта. Используйте стандартные селекторы CSS (например, <code className="bg-blue-100 px-1 rounded">h1.title</code>, <code className="bg-blue-100 px-1 rounded">div.content</code>).
                </p>
              </div>

              {editingSite.parseRules.map((rule, index) => (
                <div key={rule.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Правило #{index + 1}</h3>
                    <button
                      onClick={() => removeRule(rule.id)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Название</label>
                      <input
                        type="text"
                        value={rule.name}
                        onChange={e => updateRule(rule.id, { name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">URL паттерн</label>
                      <input
                        type="text"
                        value={rule.urlPattern}
                        onChange={e => updateRule(rule.id, { urlPattern: e.target.value })}
                        placeholder="/news/*"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Селектор заголовка</label>
                      <input
                        type="text"
                        value={rule.titleSelector}
                        onChange={e => updateRule(rule.id, { titleSelector: e.target.value })}
                        placeholder="h1.title"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Селектор контента</label>
                      <input
                        type="text"
                        value={rule.contentSelector}
                        onChange={e => updateRule(rule.id, { contentSelector: e.target.value })}
                        placeholder="div.content"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Селектор даты</label>
                      <input
                        type="text"
                        value={rule.dateSelector || ''}
                        onChange={e => updateRule(rule.id, { dateSelector: e.target.value })}
                        placeholder="time.date"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Селектор изображения</label>
                      <input
                        type="text"
                        value={rule.imageSelector || ''}
                        onChange={e => updateRule(rule.id, { imageSelector: e.target.value })}
                        placeholder="img.hero"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Селектор автора</label>
                      <input
                        type="text"
                        value={rule.authorSelector || ''}
                        onChange={e => updateRule(rule.id, { authorSelector: e.target.value })}
                        placeholder="span.author"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Макс. элементов</label>
                      <input
                        type="number"
                        value={rule.maxItems}
                        onChange={e => updateRule(rule.id, { maxItems: parseInt(e.target.value) || 10 })}
                        min={1}
                        max={100}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rule.isActive}
                      onChange={e => updateRule(rule.id, { isActive: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700">Активно</span>
                  </label>
                </div>
              ))}

              <button
                onClick={addRule}
                className="w-full py-3 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-blue-500 hover:text-blue-600 transition-colors font-medium"
              >
                <i className="fas fa-plus mr-2"></i>
                Добавить правило
              </button>

              <button
                onClick={() => setShowRulesModal(false)}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Сохранить и закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default SitesManager;
