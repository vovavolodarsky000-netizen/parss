import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAppStore } from '../appStore';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useAppStore', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    // Сброс состояния store
    useAppStore.setState({
      channels: [],
      posts: [],
      sites: [],
      webPosts: [],
      settings: {
        parseInterval: 30,
        maxPostsPerChannel: 50,
        autoApprove: false,
        filterKeywords: [],
        filterTopics: [],
        filterMinViews: 0,
        filterMediaOnly: false,
        apiToken: '',
        apiId: '',
        apiHash: '',
      },
      isParsing: false,
      parseResult: null,
      error: null,
      isLoading: false,
    });
  });

  describe('loadData', () => {
    it('должен загружать данные из localStorage', () => {
      const mockChannels = [{ id: '1', title: 'Test', username: 'test' }];
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockChannels));

      useAppStore.getState().loadData();

      expect(useAppStore.getState().isLoading).toBe(false);
    });

    it('должен обрабатывать ошибки при загрузке', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      useAppStore.getState().loadData();

      expect(useAppStore.getState().error).toBe('Не удалось загрузить данные. Возможно, хранилище повреждено.');
      expect(useAppStore.getState().isLoading).toBe(false);
    });
  });

  describe('handleParse', () => {
    it('должен устанавливать isParsing в true при начале парсинга', () => {
      useAppStore.getState().handleParse();

      expect(useAppStore.getState().isParsing).toBe(true);
    });

    it('должен возвращать ID таймера для отмены', () => {
      const timeoutId = useAppStore.getState().handleParse();

      expect(timeoutId).toBeDefined();
      expect(typeof timeoutId).toBe('object'); // NodeJS.Timeout
    });
  });

  describe('cancelParse', () => {
    it('должен отменять парсинг', () => {
      const timeoutId = useAppStore.getState().handleParse();
      
      useAppStore.getState().cancelParse(timeoutId!);

      expect(useAppStore.getState().isParsing).toBe(false);
    });
  });

  describe('handleAddChannel', () => {
    it('должен добавлять канал', () => {
      const newChannel = {
        username: 'test',
        title: 'Test Channel',
        subscribers: 1000,
        category: 'Технологии',
        topics: [],
        keywords: [],
        isActive: true,
        lastParsed: null,
        avatar: '',
      };

      useAppStore.getState().handleAddChannel(newChannel);

      // Проверяем, что loadData был вызван
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('должен обрабатывать ошибки при добавлении', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const newChannel = {
        username: 'test',
        title: 'Test Channel',
        subscribers: 1000,
        category: 'Технологии',
        topics: [],
        keywords: [],
        isActive: true,
        lastParsed: null,
        avatar: '',
      };

      useAppStore.getState().handleAddChannel(newChannel);

      expect(useAppStore.getState().error).toBe('Не удалось добавить канал');
    });
  });

  describe('handleSaveSettings', () => {
    it('должен сохранять настройки', () => {
      const newSettings = {
        parseInterval: 60,
        maxPostsPerChannel: 100,
        autoApprove: true,
        filterKeywords: ['test'],
        filterTopics: ['Технологии'],
        filterMinViews: 1000,
        filterMediaOnly: true,
        apiToken: 'token',
        apiId: 'id',
        apiHash: 'hash',
      };

      useAppStore.getState().handleSaveSettings(newSettings);

      expect(useAppStore.getState().settings).toEqual(newSettings);
    });

    it('должен обрабатывать ошибки при сохранении', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const newSettings = {
        parseInterval: 60,
        maxPostsPerChannel: 100,
        autoApprove: true,
        filterKeywords: [],
        filterTopics: [],
        filterMinViews: 0,
        filterMediaOnly: false,
        apiToken: '',
        apiId: '',
        apiHash: '',
      };

      useAppStore.getState().handleSaveSettings(newSettings);

      expect(useAppStore.getState().error).toBe('Не удалось сохранить настройки');
    });
  });

  describe('clearError', () => {
    it('должен очищать ошибку', () => {
      useAppStore.setState({ error: 'Test error' });

      useAppStore.getState().clearError();

      expect(useAppStore.getState().error).toBeNull();
    });
  });

  describe('clearParseResult', () => {
    it('должен очищать результат парсинга', () => {
      useAppStore.setState({ parseResult: 'Test result' });

      useAppStore.getState().clearParseResult();

      expect(useAppStore.getState().parseResult).toBeNull();
    });
  });
});
