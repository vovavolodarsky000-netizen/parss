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

export function useAppData() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [sites, setSites] = useState<WebSite[]>([]);
  const [webPosts, setWebPosts] = useState<WebPost[]>([]);
  const [settings, setSettings] = useState<ParserSettings>(getSettings());
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<string | null>(null);

  const loadData = useCallback(() => {
    setChannels(getChannels());
    setPosts(getPosts());
    setSites(getWebSites());
    setWebPosts(getWebPosts());
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  const handleAddChannel = useCallback(
    (channel: Omit<Channel, 'id' | 'addedAt'>) => {
      addChannel(channel);
      loadData();
    },
    [loadData]
  );

  const handleRemoveChannel = useCallback(
    (id: string) => {
      removeChannel(id);
      loadData();
    },
    [loadData]
  );

  const handleToggleChannel = useCallback(
    (id: string) => {
      toggleChannel(id);
      loadData();
    },
    [loadData]
  );

  const handleUpdatePostStatus = useCallback(
    (id: string, status: Post['status']) => {
      updatePostStatus(id, status);
      loadData();
    },
    [loadData]
  );

  const handleBulkUpdate = useCallback(
    (ids: string[], status: Post['status']) => {
      bulkUpdateStatus(ids, status);
      loadData();
    },
    [loadData]
  );

  const handleSaveSettings = useCallback((newSettings: ParserSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  }, []);

  const handleReset = useCallback(() => {
    resetData();
    localStorage.removeItem('tg_parser_sites');
    localStorage.removeItem('tg_parser_web_posts');
    loadData();
    setSettings(getSettings());
  }, [loadData]);

  const handleAddSite = useCallback(
    (site: Omit<WebSite, 'id' | 'addedAt'>) => {
      addWebSite(site);
      loadData();
    },
    [loadData]
  );

  const handleRemoveSite = useCallback(
    (id: string) => {
      removeWebSite(id);
      loadData();
    },
    [loadData]
  );

  const handleToggleSite = useCallback(
    (id: string) => {
      toggleWebSite(id);
      loadData();
    },
    [loadData]
  );

  const handleUpdateSite = useCallback(
    (id: string, updates: Partial<WebSite>) => {
      updateWebSite(id, updates);
      loadData();
    },
    [loadData]
  );

  const handleUpdateWebPostStatus = useCallback(
    (id: string, status: WebPost['status']) => {
      updateWebPostStatus(id, status);
      loadData();
    },
    [loadData]
  );

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
