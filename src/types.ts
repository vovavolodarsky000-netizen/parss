export interface Channel {
  id: string;
  username: string;
  title: string;
  subscribers: number;
  isActive: boolean;
  lastParsed: string | null;
  avatar: string;
  category: string;
  topics: string[];
  keywords: string[];
  addedAt: string;
}

export const AVAILABLE_TOPICS = [
  'Технологии',
  'Крипто',
  'Дизайн',
  'Бизнес',
  'Маркетинг',
  'Программирование',
  'Новости',
  'Финансы',
  'Образование',
  'Медицина',
  'Спорт',
  'Путешествия',
  'Еда',
  'Наука',
  'Кино',
  'Музыка',
  'Автомобили',
  'Недвижимость',
  'Политика',
  'Развлечения',
];

export interface Post {
  id: string;
  channelId: string;
  channelTitle: string;
  channelUsername: string;
  text: string;
  mediaType: 'text' | 'photo' | 'video' | 'document';
  mediaUrl?: string;
  views: number;
  date: string;
  parsedAt: string;
  status: 'new' | 'approved' | 'published' | 'rejected';
  hashtags: string[];
  hasMedia: boolean;
  source?: 'telegram' | 'web';
}

export interface ParserSettings {
  parseInterval: number; // minutes
  maxPostsPerChannel: number;
  autoApprove: boolean;
  filterKeywords: string[];
  filterTopics: string[];
  filterMinViews: number;
  filterMediaOnly: boolean;
  apiToken: string;
  apiId: string;
  apiHash: string;
}

export interface DashboardStats {
  totalChannels: number;
  activeChannels: number;
  totalPosts: number;
  newPosts: number;
  approvedPosts: number;
  publishedPosts: number;
  lastParseTime: string | null;
  postsToday: number;
}

export interface WebSite {
  id: string;
  name: string;
  url: string;
  isActive: boolean;
  lastParsed: string | null;
  topics: string[];
  keywords: string[];
  parseRules: ParseRule[];
  addedAt: string;
}

export interface ParseRule {
  id: string;
  name: string;
  urlPattern: string; // URL pattern or regex
  titleSelector: string; // CSS selector for title
  contentSelector: string; // CSS selector for content
  dateSelector?: string; // CSS selector for date
  imageSelector?: string; // CSS selector for image
  authorSelector?: string; // CSS selector for author
  linkSelector?: string; // CSS selector for link
  maxItems: number;
  isActive: boolean;
}

export interface WebPost {
  id: string;
  siteId: string;
  siteName: string;
  siteUrl: string;
  title: string;
  content: string;
  url: string;
  imageUrl?: string;
  author?: string;
  date: string;
  parsedAt: string;
  status: 'new' | 'approved' | 'published' | 'rejected';
  topics: string[];
  keywords: string[];
}

export type TabType = 'dashboard' | 'channels' | 'posts' | 'sites' | 'settings' | 'publish';
