import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAppData } from '../useAppData';

// Мокируем функции из store и webStore
vi.mock('../../store', () => ({
  getChannels: vi.fn(() => []),
  getPosts: vi.fn(() => []),
  getSettings: vi.fn(() => ({
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
  })),
  saveSettings: vi.fn(),
  addChannel: vi.fn(),
  removeChannel: vi.fn(),
  toggleChannel: vi.fn(),
  updatePostStatus: vi.fn(),
  bulkUpdateStatus: vi.fn(),
  simulateParsing: vi.fn(() => []),
  resetData: vi.fn(),
}));

vi.mock('../../webStore', () => ({
  getWebSites: vi.fn(() => []),
  getWebPosts: vi.fn(() => []),
  addWebSite: vi.fn(),
  removeWebSite: vi.fn(),
  toggleWebSite: vi.fn(),
  updateWebSite: vi.fn(),
  updateWebPostStatus: vi.fn(),
  bulkUpdateWebPostStatus: vi.fn(),
  simulateWebParsing: vi.fn(() => []),
}));

describe('useAppData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('должен возвращать начальные данные', () => {
    const { result } = renderHook(() => useAppData());

    expect(result.current.channels).toEqual([]);
    expect(result.current.posts).toEqual([]);
    expect(result.current.sites).toEqual([]);
    expect(result.current.webPosts).toEqual([]);
    expect(result.current.isParsing).toBe(false);
    expect(result.current.parseResult).toBeNull();
  });

  it('должен предоставлять функции управления', () => {
    const { result } = renderHook(() => useAppData());

    expect(typeof result.current.handleParse).toBe('function');
    expect(typeof result.current.handleAddChannel).toBe('function');
    expect(typeof result.current.handleRemoveChannel).toBe('function');
    expect(typeof result.current.handleToggleChannel).toBe('function');
    expect(typeof result.current.handleUpdatePostStatus).toBe('function');
    expect(typeof result.current.handleBulkUpdate).toBe('function');
    expect(typeof result.current.handleSaveSettings).toBe('function');
    expect(typeof result.current.handleReset).toBe('function');
    expect(typeof result.current.handleAddSite).toBe('function');
    expect(typeof result.current.handleRemoveSite).toBe('function');
    expect(typeof result.current.handleToggleSite).toBe('function');
    expect(typeof result.current.handleUpdateSite).toBe('function');
    expect(typeof result.current.handleUpdateWebPostStatus).toBe('function');
    expect(typeof result.current.handleBulkUpdateWebPosts).toBe('function');
  });

  it('должен загружать данные при монтировании', () => {
    renderHook(() => useAppData());

    const { getChannels, getPosts, getWebSites, getWebPosts } = require('../../store');
    const { getWebSites: getWebSitesMock, getWebPosts: getWebPostsMock } = require('../../webStore');

    expect(getChannels).toHaveBeenCalled();
    expect(getPosts).toHaveBeenCalled();
    expect(getWebSitesMock).toHaveBeenCalled();
    expect(getWebPostsMock).toHaveBeenCalled();
  });

  it('должен вызывать addChannel при handleAddChannel', () => {
    const { result } = renderHook(() => useAppData());
    const { addChannel } = require('../../store');

    const newChannel = {
      username: 'test',
      title: 'Test Channel',
      subscribers: 1000,
      isActive: true,
      lastParsed: null,
      avatar: 'test.png',
      category: 'Test',
      topics: ['Технологии'],
      keywords: ['test'],
    };

    act(() => {
      result.current.handleAddChannel(newChannel);
    });

    expect(addChannel).toHaveBeenCalledWith(newChannel);
  });

  it('должен вызывать removeChannel при handleRemoveChannel', () => {
    const { result } = renderHook(() => useAppData());
    const { removeChannel } = require('../../store');

    act(() => {
      result.current.handleRemoveChannel('ch_1');
    });

    expect(removeChannel).toHaveBeenCalledWith('ch_1');
  });

  it('должен вызывать toggleChannel при handleToggleChannel', () => {
    const { result } = renderHook(() => useAppData());
    const { toggleChannel } = require('../../store');

    act(() => {
      result.current.handleToggleChannel('ch_1');
    });

    expect(toggleChannel).toHaveBeenCalledWith('ch_1');
  });

  it('должен вызывать updatePostStatus при handleUpdatePostStatus', () => {
    const { result } = renderHook(() => useAppData());
    const { updatePostStatus } = require('../../store');

    act(() => {
      result.current.handleUpdatePostStatus('post_1', 'approved');
    });

    expect(updatePostStatus).toHaveBeenCalledWith('post_1', 'approved');
  });

  it('должен вызывать bulkUpdateStatus при handleBulkUpdate', () => {
    const { result } = renderHook(() => useAppData());
    const { bulkUpdateStatus } = require('../../store');

    act(() => {
      result.current.handleBulkUpdate(['post_1', 'post_2'], 'approved');
    });

    expect(bulkUpdateStatus).toHaveBeenCalledWith(['post_1', 'post_2'], 'approved');
  });

  it('должен вызывать saveSettings при handleSaveSettings', () => {
    const { result } = renderHook(() => useAppData());
    const { saveSettings } = require('../../store');

    const newSettings = {
      parseInterval: 60,
      maxPostsPerChannel: 100,
      autoApprove: true,
      filterKeywords: ['test'],
      filterTopics: ['Технологии'],
      filterMinViews: 100,
      filterMediaOnly: false,
      apiToken: 'token',
      apiId: 'id',
      apiHash: 'hash',
    };

    act(() => {
      result.current.handleSaveSettings(newSettings);
    });

    expect(saveSettings).toHaveBeenCalledWith(newSettings);
  });

  it('должен вызывать resetData при handleReset', () => {
    const { result } = renderHook(() => useAppData());
    const { resetData } = require('../../store');

    act(() => {
      result.current.handleReset();
    });

    expect(resetData).toHaveBeenCalled();
  });
});
