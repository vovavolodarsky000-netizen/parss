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

export type TabType = 'dashboard' | 'channels' | 'posts' | 'settings' | 'publish';
