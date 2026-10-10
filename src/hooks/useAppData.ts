import { useState, useCallback, useEffect } from 'react';
import { Channel, Post, WebSite, WebPost, ParserSettings } from '../types';
import {
  getChannels,
  getPosts,
  getSettings,
  saveSettings,
  addChannel,
  removeChannel,
  toggleChannel,
  updatePostStatus,
  bulkUpdateStatus,
  simulateParsing,
  resetData,
} from '../store';
import {
  getWebSites,
  getWebPosts,
  addWebSite,
  removeWebSite,
  toggleWebSite,
  updateWebSite,
  updateWebPostStatus,
  bulkUpdateWebPostStatus,
  simulateWebParsing,
} from '../webStore';

/**
 * Кастомный хук для управления всеми данными приложения
 * 
 * @description
 * Предоставляет централизованный доступ к данным каналов, постов, сайтов и веб-постов.
 * Включает функции для парсинга, добавления, удаления и обновления данных.
 * Все данные синхронизируются с localStorage.
 * 
 * @returns {Object} Объект с данными и функциями управления
 * @returns {Channel[]} channels - Список Telegram каналов
 * @returns {Post[]} posts - Список постов из каналов
 * @returns {WebSite[]} sites - Список веб-сайтов для парсинга
 * @returns {WebPost[]} webPosts - Список постов с веб-сайтов
 * @returns {ParserSettings} settings - Настройки парсера
 * @returns {boolean} isParsing - Флаг активного парсинга
 * @returns {string|null} parseResult - Результат последнего парсинга
 * 
 * @example
 * ```tsx
 * const { channels, posts, handleParse } = useAppData();
 * 
 * // Запуск парсинга
 * handleParse();
 * 
 * // Добавление канала
 * handleAddChannel({ username: 'durov', title: 'Durov', ... });
 * ```
 */
export function useAppData() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [sites, setSites] = useState<WebSite[]>([]);
  const [webPosts, setWebPosts] = useState<WebPost[]>([]);
  const [settings, setSettings] = useState<ParserSettings>(getSettings());
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<string | null>(null);

  /**
   * Загрузка всех данных из хранилища
   * 
   * @description
   * Синхронизирует состояние компонента с данными из localStorage.
   * Вызывается при монтировании компонента и после изменений данных.
   */
  const loadData = useCallback(() => {
    setChannels(getChannels());
    setPosts(getPosts());
    setSites(getWebSites());
    setWebPosts(getWebPosts());
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /**
   * Запуск парсинга всех активных каналов и сайтов
   * 
   * @description
   * Имитирует процесс парсинга с задержкой 2 секунды.
   * Собирает новые посты из Telegram каналов и веб-сайтов.
   * Обновляет результат парсинга и автоматически очищает его через 5 секунд.
   */
  const handleParse = useCallback(() => {
    setIsParsing(true);
    setParseResult(null);

    setTimeout(() => {
      const newPosts = simulateParsing();
      const newWebPosts = simulateWebParsing();
      loadData();
      setIsParsing(false);
      setParseResult(
        `Собрано ${newPosts.length + newWebPosts.length} новых постов (${newPosts.length} из каналов, ${newWebPosts.length} с сайтов)`
      );
      setTimeout(() => setParseResult(null), 5000);
    }, 2000);
  }, [loadData]);

  /**
   * Добавление нового Telegram канала
   * 
   * @param channel - Данные канала без id и addedAt (генерируются автоматически)
   * @description
   * Добавляет новый канал в хранилище и обновляет состояние.
   */
  const handleAddChannel = useCallback(
    (channel: Omit<Channel, 'id' | 'addedAt'>) => {
      addChannel(channel);
      loadData();
    },
    [loadData]
  );

  /**
   * Удаление Telegram канала
   * 
   * @param id - ID канала для удаления
   * @description
   * Удаляет канал из хранилища и обновляет состояние.
   */
  const handleRemoveChannel = useCallback(
    (id: string) => {
      removeChannel(id);
      loadData();
    },
    [loadData]
  );

  /**
   * Переключение активности канала
   * 
   * @param id - ID канала
   * @description
   * Включает или выключает канал для парсинга.
   */
  const handleToggleChannel = useCallback(
    (id: string) => {
      toggleChannel(id);
      loadData();
    },
    [loadData]
  );

  /**
   * Обновление статуса поста
   * 
   * @param id - ID поста
   * @param status - Новый статус (new, approved, published, rejected)
   * @description
   * Изменяет статус поста и обновляет состояние.
   */
  const handleUpdatePostStatus = useCallback(
    (id: string, status: Post['status']) => {
      updatePostStatus(id, status);
      loadData();
    },
    [loadData]
  );

  /**
   * Массовое обновление статусов постов
   * 
   * @param ids - Массив ID постов
   * @param status - Новый статус для всех постов
   * @description
   * Обновляет статус нескольких постов одновременно.
   */
  const handleBulkUpdate = useCallback(
    (ids: string[], status: Post['status']) => {
      bulkUpdateStatus(ids, status);
      loadData();
    },
    [loadData]
  );

  /**
   * Сохранение настроек парсера
   * 
   * @param newSettings - Новые настройки
   * @description
   * Сохраняет настройки в localStorage и обновляет состояние.
   */
  const handleSaveSettings = useCallback((newSettings: ParserSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  }, []);

  /**
   * Сброс всех данных
   * 
   * @description
   * Удаляет все данные из localStorage и восстанавливает начальное состояние.
   */
  const handleReset = useCallback(() => {
    resetData();
    localStorage.removeItem('tg_parser_sites');
    localStorage.removeItem('tg_parser_web_posts');
    loadData();
    setSettings(getSettings());
  }, [loadData]);

  /**
   * Добавление нового веб-сайта
   * 
   * @param site - Данные сайта без id и addedAt
   * @description
   * Добавляет новый сайт в хранилище и обновляет состояние.
   */
  const handleAddSite = useCallback(
    (site: Omit<WebSite, 'id' | 'addedAt'>) => {
      addWebSite(site);
      loadData();
    },
    [loadData]
  );

  /**
   * Удаление веб-сайта
   * 
   * @param id - ID сайта для удаления
   * @description
   * Удаляет сайт из хранилища и обновляет состояние.
   */
  const handleRemoveSite = useCallback(
    (id: string) => {
      removeWebSite(id);
      loadData();
    },
    [loadData]
  );

  /**
   * Переключение активности сайта
   * 
   * @param id - ID сайта
   * @description
   * Включает или выключает сайт для парсинга.
   */
  const handleToggleSite = useCallback(
    (id: string) => {
      toggleWebSite(id);
      loadData();
    },
    [loadData]
  );

  /**
   * Обновление данных сайта
   * 
   * @param id - ID сайта
   * @param updates - Объект с обновляемыми полями
   * @description
   * Обновляет указанные поля сайта и сохраняет изменения.
   */
  const handleUpdateSite = useCallback(
    (id: string, updates: Partial<WebSite>) => {
      updateWebSite(id, updates);
      loadData();
    },
    [loadData]
  );

  /**
   * Обновление статуса веб-поста
   * 
   * @param id - ID поста
   * @param status - Новый статус
   * @description
   * Изменяет статус поста с веб-сайта.
   */
  const handleUpdateWebPostStatus = useCallback(
    (id: string, status: WebPost['status']) => {
      updateWebPostStatus(id, status);
      loadData();
    },
    [loadData]
  );

  /**
   * Массовое обновление статусов веб-постов
   * 
   * @param ids - Массив ID постов
   * @param status - Новый статус для всех постов
   * @description
   * Обновляет статус нескольких веб-постов одновременно.
   */
  const handleBulkUpdateWebPosts = useCallback(
    (ids: string[], status: WebPost['status']) => {
      bulkUpdateWebPostStatus(ids, status);
      loadData();
    },
    [loadData]
  );

  return {
    // Data
    channels,
    posts,
    sites,
    webPosts,
    settings,
    isParsing,
    parseResult,

    // Actions
    loadData,
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
  };
}
