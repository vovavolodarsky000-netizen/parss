/**
 * Централизованное управление состоянием приложения (ARCH-002)
 * Использует Zustand для единого источника истины
 */

import { create } from 'zustand';
import { Channel, Post, WebSite, WebPost, ParserSettings } from '../types';
import {
  getChannels,
  getPosts,
  getSettings,
  saveSettings as saveSettingsToStorage,
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

interface AppState {
  // Данные
  channels: Channel[];
  posts: Post[];
  sites: WebSite[];
  webPosts: WebPost[];
  settings: ParserSettings;

  // UI состояние
  isParsing: boolean;
  parseResult: string | null;
  error: string | null;
  isLoading: boolean;

  // Действия
  loadData: () => void;
  handleParse: () => void;
  handleAddChannel: (channel: Omit<Channel, 'id' | 'addedAt'>) => void;
  handleRemoveChannel: (id: string) => void;
  handleToggleChannel: (id: string) => void;
  handleUpdatePostStatus: (id: string, status: Post['status']) => void;
  handleBulkUpdate: (ids: string[], status: Post['status']) => void;
  handleSaveSettings: (settings: ParserSettings) => void;
  handleReset: () => void;
  handleAddSite: (site: Omit<WebSite, 'id' | 'addedAt'>) => void;
  handleRemoveSite: (id: string) => void;
  handleToggleSite: (id: string) => void;
  handleUpdateSite: (id: string, site: Partial<WebSite>) => void;
  handleUpdateWebPostStatus: (id: string, status: WebPost['status']) => void;
  handleBulkUpdateWebPosts: (ids: string[], status: WebPost['status']) => void;
  clearError: () => void;
  clearParseResult: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Начальное состояние
  channels: [],
  posts: [],
  sites: [],
  webPosts: [],
  settings: getSettings(),
  isParsing: false,
  parseResult: null,
  error: null,
  isLoading: false,

  // Загрузка данных с обработкой ошибок (PERF-001: один set() вместо двух)
  loadData: () => {
    try {
      set({
        isLoading: true,
        error: null,
        channels: getChannels(),
        posts: getPosts(),
        sites: getWebSites(),
        webPosts: getWebPosts(),
      });
      // Устанавливаем isLoading в false после загрузки данных
      set({ isLoading: false });
    } catch (error) {
      console.error('[Store] Ошибка загрузки данных:', error);
      set({
        error: 'Не удалось загрузить данные. Возможно, хранилище повреждено.',
        isLoading: false,
      });
    }
  },

  // Парсинг с обработкой ошибок (BUG-004: сохраняем ID таймера для отмены)
  handleParse: () => {
    set({ isParsing: true, parseResult: null, error: null });

    const parseTimeout = setTimeout(() => {
      try {
        const newPosts = simulateParsing();
        const newWebPosts = simulateWebParsing();
        get().loadData();
        set({
          isParsing: false,
          parseResult: `Собрано ${newPosts.length + newWebPosts.length} новых постов (${newPosts.length} из каналов, ${newWebPosts.length} с сайтов)`,
        });
        // Автоочистка результата
        setTimeout(() => {
          set({ parseResult: null });
        }, 5000);
      } catch (error) {
        console.error('[Store] Ошибка парсинга:', error);
        set({
          isParsing: false,
          error: 'Ошибка при парсинге. Проверьте настройки API.',
        });
      }
    }, 2000);

    // Сохраняем ID таймера для возможности отмены
    return parseTimeout;
  },

  // Отмена парсинга (BUG-004)
  cancelParse: (timeoutId: NodeJS.Timeout) => {
    clearTimeout(timeoutId);
    set({ isParsing: false });
  },

  handleAddChannel: (channel) => {
    try {
      addChannel(channel);
      get().loadData();
    } catch (error) {
      set({ error: 'Не удалось добавить канал' });
    }
  },

  handleRemoveChannel: (id) => {
    try {
      removeChannel(id);
      get().loadData();
    } catch (error) {
      set({ error: 'Не удалось удалить канал' });
    }
  },

  handleToggleChannel: (id) => {
    try {
      toggleChannel(id);
      get().loadData();
    } catch (error) {
      set({ error: 'Не удалось переключить канал' });
    }
  },

  handleUpdatePostStatus: (id, status) => {
    try {
      updatePostStatus(id, status);
      get().loadData();
    } catch (error) {
      set({ error: 'Не удалось обновить статус поста' });
    }
  },

  handleBulkUpdate: (ids, status) => {
    try {
      bulkUpdateStatus(ids, status);
      get().loadData();
    } catch (error) {
      set({ error: 'Не удалось выполнить массовое обновление' });
    }
  },

  handleSaveSettings: (newSettings) => {
    try {
      saveSettingsToStorage(newSettings);
      set({ settings: newSettings });
    } catch (error) {
      set({ error: 'Не удалось сохранить настройки' });
    }
  },

  handleReset: () => {
    try {
      resetData();
      get().loadData();
    } catch (error) {
      set({ error: 'Не удалось сбросить данные' });
    }
  },

  handleAddSite: (site) => {
    try {
      addWebSite(site);
      get().loadData();
    } catch (error) {
      set({ error: 'Не удалось добавить сайт' });
    }
  },

  handleRemoveSite: (id) => {
    try {
      removeWebSite(id);
      get().loadData();
    } catch (error) {
      set({ error: 'Не удалось удалить сайт' });
    }
  },

  handleToggleSite: (id) => {
    try {
      toggleWebSite(id);
      get().loadData();
    } catch (error) {
      set({ error: 'Не удалось переключить сайт' });
    }
  },

  handleUpdateSite: (id, updates) => {
    try {
      updateWebSite(id, updates);
      get().loadData();
    } catch (error) {
      set({ error: 'Не удалось обновить сайт' });
    }
  },

  handleUpdateWebPostStatus: (id, status) => {
    try {
      updateWebPostStatus(id, status);
      get().loadData();
    } catch (error) {
      set({ error: 'Не удалось обновить статус веб-поста' });
    }
  },

  handleBulkUpdateWebPosts: (ids, status) => {
    try {
      bulkUpdateWebPostStatus(ids, status);
      get().loadData();
    } catch (error) {
      set({ error: 'Не удалось выполнить массовое обновление веб-постов' });
    }
  },

  clearError: () => set({ error: null }),
  clearParseResult: () => set({ parseResult: null }),
}));
