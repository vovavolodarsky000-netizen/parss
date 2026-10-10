/**
 * Миграция данных из старых версий localStorage
 * Решает проблему с отсутствием полей topics/keywords в старых данных
 */

interface LegacyChannel {
  id: string;
  username: string;
  title: string;
  subscribers: number;
  isActive: boolean;
  lastParsed: string | null;
  avatar: string;
  category: string;
  addedAt: string;
  // Старые версии могли не иметь этих полей
  topics?: string[];
  keywords?: string[];
}

interface LegacyWebSite {
  id: string;
  name: string;
  url: string;
  isActive: boolean;
  lastParsed: string | null;
  addedAt: string;
  topics?: string[];
  keywords?: string[];
  parseRules?: any[];
}

const MIGRATION_VERSION_KEY = 'tg_parser_migration_version';
const CURRENT_VERSION = 2;

export function runMigrations(): void {
  const currentVersion = parseInt(localStorage.getItem(MIGRATION_VERSION_KEY) || '0', 10);

  if (currentVersion >= CURRENT_VERSION) {
    return; // Миграция уже выполнена
  }

  console.log(`[Migration] Запуск миграции с версии ${currentVersion} до ${CURRENT_VERSION}`);

  try {
    // Миграция v1 -> v2: Добавление topics и keywords
    if (currentVersion < 2) {
      migrateV1toV2();
    }

    localStorage.setItem(MIGRATION_VERSION_KEY, CURRENT_VERSION.toString());
    console.log('[Migration] Миграция успешно завершена');
  } catch (error) {
    console.error('[Migration] Ошибка миграции:', error);
  }
}

function migrateV1toV2(): void {
  // Миграция каналов
  const channelsData = localStorage.getItem('tg_parser_channels');
  if (channelsData) {
    try {
      const channels: LegacyChannel[] = JSON.parse(channelsData);
      const migrated = channels.map((ch) => ({
        ...ch,
        topics: ch.topics || [ch.category || 'Другое'],
        keywords: ch.keywords || [],
      }));
      localStorage.setItem('tg_parser_channels', JSON.stringify(migrated));
      console.log(`[Migration] Мигрировано ${migrated.length} каналов`);
    } catch (e) {
      console.error('[Migration] Ошибка миграции каналов:', e);
    }
  }

  // Миграция веб-сайтов
  const sitesData = localStorage.getItem('tg_parser_sites');
  if (sitesData) {
    try {
      const sites: LegacyWebSite[] = JSON.parse(sitesData);
      const migrated = sites.map((s) => ({
        ...s,
        topics: s.topics || [],
        keywords: s.keywords || [],
        parseRules: s.parseRules || [],
      }));
      localStorage.setItem('tg_parser_sites', JSON.stringify(migrated));
      console.log(`[Migration] Мигрировано ${migrated.length} сайтов`);
    } catch (e) {
      console.error('[Migration] Ошибка миграции сайтов:', e);
    }
  }
}

export function getMigrationVersion(): number {
  return parseInt(localStorage.getItem(MIGRATION_VERSION_KEY) || '0', 10);
}
