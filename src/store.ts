import { Channel, Post, ParserSettings } from './types';

const CHANNELS_KEY = 'tg_parser_channels';
const POSTS_KEY = 'tg_parser_posts';
const SETTINGS_KEY = 'tg_parser_settings';

const defaultSettings: ParserSettings = {
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
};

// Generate mock data
function generateMockChannels(): Channel[] {
  const channels = [
    { username: 'technews_ru', title: 'Технологии и Новости', subscribers: 145000, category: 'Технологии', topics: ['Технологии', 'Наука'], keywords: ['AI', 'блокчейн', 'стартап', 'инновации'] },
    { username: 'crypto_signals', title: 'Crypto Signals', subscribers: 89000, category: 'Крипто', topics: ['Крипто', 'Финансы'], keywords: ['bitcoin', 'ethereum', 'трейдинг', 'DeFi'] },
    { username: 'design_daily', title: 'Design Daily', subscribers: 67000, category: 'Дизайн', topics: ['Дизайн', 'Технологии'], keywords: ['UI', 'UX', 'Figma', 'типографика'] },
    { username: 'startup_news', title: 'Стартапы и Бизнес', subscribers: 234000, category: 'Бизнес', topics: ['Бизнес', 'Финансы', 'Маркетинг'], keywords: ['инвестиции', 'MVP', 'раунд', 'питч'] },
    { username: 'ai_machine_learning', title: 'AI & Machine Learning', subscribers: 178000, category: 'Технологии', topics: ['Технологии', 'Программирование', 'Наука'], keywords: ['нейросеть', 'GPT', 'ML', 'deep learning'] },
    { username: 'marketing_pro', title: 'Маркетинг PRO', subscribers: 56000, category: 'Маркетинг', topics: ['Маркетинг', 'Бизнес'], keywords: ['SMM', 'контент', 'таргет', 'воронка'] },
    { username: 'python_daily', title: 'Python Daily', subscribers: 92000, category: 'Программирование', topics: ['Программирование', 'Технологии'], keywords: ['Python', 'Django', 'FastAPI', 'data science'] },
    { username: 'world_news_24', title: 'Мировые Новости 24', subscribers: 312000, category: 'Новости', topics: ['Новости', 'Политика'], keywords: ['срочно', ' Breaking', 'геополитика', 'экономика'] },
  ];

  return channels.map((ch, i) => ({
    id: `ch_${i + 1}`,
    username: ch.username,
    title: ch.title,
    subscribers: ch.subscribers,
    isActive: i < 6,
    lastParsed: i < 4 ? new Date(Date.now() - Math.random() * 86400000).toISOString() : null,
    avatar: `https://api.dicebear.com/4.0/identicon/${ch.username}.png?size=80`,
    category: ch.category,
    topics: ch.topics,
    keywords: ch.keywords,
    addedAt: new Date(Date.now() - Math.random() * 2592000000).toISOString(),
  }));
}

function generateMockPosts(channels: Channel[]): Post[] {
  const posts: Post[] = [];
  const mediaTypes: Array<'text' | 'photo' | 'video' | 'document'> = ['text', 'photo', 'video', 'document'];
  const statuses: Array<'new' | 'approved' | 'published' | 'rejected'> = ['new', 'approved', 'published', 'rejected'];
  
  const sampleTexts = [
    '🚀 Новый релиз фреймворка! Обновление включает поддержку SSR, улучшенную типизацию и новые хуки для работы с состоянием. Подробности в документации.',
    '💰 Bitcoin преодолел отметку $100,000! Аналитики прогнозируют дальнейший рост. Основные факторы: институциональные инвестиции и халвинг.',
    '🎨 Тренды дизайна 2026: минимализм, 3D-графика, нейроморфизм и AI-генерация. Полный обзор с примерами.',
    '📊 Стартап привлёк $50M инвестиций на раунде Series B. Компания разрабатывает платформу для автоматизации бизнес-процессов.',
    '🤖 GPT-5 показал невероятные результаты на тестах. Новая модель способна решать задачи уровня PhD по математике.',
    '📱 Apple представила новый iPhone с революционным чипом. Время автономной работы увеличено на 40%.',
    '🔥 Топ-10 инструментов для продуктивности в 2026 году. Обзор лучших приложений для разработчиков и дизайнеров.',
    '💡 5 ошибок, которые совершают начинающие предприниматели. Как их избежать и построить успешный бизнес.',
    '🌍 Google объявил о новом алгоритме поиска. Вебмастерам нужно учитывать новые факторы ранжирования.',
    '⚡ React 20 вышел в стабильной версии! Server Components стали стандартом, а новый компилятор увеличивает производительность в 3 раза.',
    '🎯 Кейс: как мы увеличили конверсию лендинга на 340% за 2 недели. Подробный разбор стратегии.',
    '🔐 Новый уязвимость в OpenSSL затрагивает миллионы серверов. Срочно обновите зависимости!',
  ];

  const hashtagSets = [
    ['#tech', '#news', '#update'],
    ['#crypto', '#bitcoin', '#invest'],
    ['#design', '#ui', '#trends'],
    ['#startup', '#business', '#funding'],
    ['#ai', '#ml', '#gpt'],
    ['#apple', '#iphone', '#tech'],
    ['#tools', '#productivity', '#dev'],
    ['#business', '#tips', '#startup'],
    ['#google', '#seo', '#search'],
    ['#react', '#frontend', '#webdev'],
    ['#marketing', '#conversion', '#case'],
    ['#security', '#vulnerability', '#openssl'],
  ];

  const activeChannels = channels.filter(ch => ch.isActive);

  for (let i = 0; i < 48; i++) {
    const channel = activeChannels[i % activeChannels.length];
    const textIndex = i % sampleTexts.length;
    const mediaType = mediaTypes[Math.floor(Math.random() * mediaTypes.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const daysAgo = Math.floor(Math.random() * 7);
    const date = new Date(Date.now() - daysAgo * 86400000 - Math.random() * 86400000);

    posts.push({
      id: `post_${i + 1}`,
      channelId: channel.id,
      channelTitle: channel.title,
      channelUsername: channel.username,
      text: sampleTexts[textIndex],
      mediaType,
      mediaUrl: mediaType !== 'text' ? `https://picsum.photos/seed/${i}/400/300` : undefined,
      views: Math.floor(Math.random() * 50000) + 1000,
      date: date.toISOString(),
      parsedAt: new Date(date.getTime() + Math.random() * 3600000).toISOString(),
      status,
      hashtags: hashtagSets[textIndex],
      hasMedia: mediaType !== 'text',
    });
  }

  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getChannels(): Channel[] {
  const stored = localStorage.getItem(CHANNELS_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  const mock = generateMockChannels();
  localStorage.setItem(CHANNELS_KEY, JSON.stringify(mock));
  return mock;
}

export function saveChannels(channels: Channel[]): void {
  localStorage.setItem(CHANNELS_KEY, JSON.stringify(channels));
}

export function getPosts(): Post[] {
  const stored = localStorage.getItem(POSTS_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  const channels = getChannels();
  const mock = generateMockPosts(channels);
  localStorage.setItem(POSTS_KEY, JSON.stringify(mock));
  return mock;
}

export function savePosts(posts: Post[]): void {
  localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
}

export function getSettings(): ParserSettings {
  const stored = localStorage.getItem(SETTINGS_KEY);
  if (stored) {
    return { ...defaultSettings, ...JSON.parse(stored) };
  }
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaultSettings));
  return defaultSettings;
}

export function saveSettings(settings: ParserSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function addChannel(channel: Omit<Channel, 'id' | 'addedAt'>): Channel {
  const channels = getChannels();
  const newChannel: Channel = {
    ...channel,
    id: `ch_${Date.now()}`,
    addedAt: new Date().toISOString(),
  };
  channels.push(newChannel);
  saveChannels(channels);
  return newChannel;
}

export function removeChannel(id: string): void {
  const channels = getChannels().filter(ch => ch.id !== id);
  saveChannels(channels);
  const posts = getPosts().filter(p => p.channelId !== id);
  savePosts(posts);
}

export function toggleChannel(id: string): void {
  const channels = getChannels().map(ch => 
    ch.id === id ? { ...ch, isActive: !ch.isActive } : ch
  );
  saveChannels(channels);
}

export function updatePostStatus(id: string, status: Post['status']): void {
  const posts = getPosts().map(p => 
    p.id === id ? { ...p, status } : p
  );
  savePosts(posts);
}

export function bulkUpdateStatus(ids: string[], status: Post['status']): void {
  const posts = getPosts().map(p => 
    ids.includes(p.id) ? { ...p, status } : p
  );
  savePosts(posts);
}

export function simulateParsing(): Post[] {
  const channels = getChannels().filter(ch => ch.isActive);
  const posts = getPosts();
  const newPosts: Post[] = [];

  const sampleTexts = [
    '🔥 Горячая новость из мира технологий! Крупнейшая компания объявила о слиянии стоимостью $10 млрд.',
    '📈 Рынок криптовалют показывает рост на 15% за последние сутки. Эксперты связывают это с одобрением ETF.',
    '🎯 Новый подход к UX-дизайну: как данные о пользователях меняют индустрию.',
    '💡 Инсайдерская информация: крупный технологический гигант готовит революционный продукт.',
    '🌐 Интернет вещей достиг нового рубежа: более 50 млрд подключённых устройств по всему миру.',
    '🚀 Новый AI-фреймворк ускоряет разработку в 10 раз. Поддерживает нейросеть, GPT и deep learning.',
    '💰 Bitcoin преодолел $100K! DeFi и трейдинг на пике. Институциональные инвестиции растут.',
    '🎨 UI/UX тренды: Figma представила новые инструменты для дизайна. Типографика и минимализм.',
    '📊 Стартап привлёк инвестиции на раунде Series B. MVP показал рост конверсии на 200%.',
    '📱 SMM стратегия 2026: контент-маркетинг и таргетированная реклама через воронку продаж.',
  ];

  channels.forEach(channel => {
    const numNewPosts = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < numNewPosts; i++) {
      const text = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
      const mediaTypes: Array<'text' | 'photo' | 'video'> = ['text', 'photo', 'video'];
      const mediaType = mediaTypes[Math.floor(Math.random() * mediaTypes.length)];
      
      newPosts.push({
        id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        channelId: channel.id,
        channelTitle: channel.title,
        channelUsername: channel.username,
        text,
        mediaType,
        mediaUrl: mediaType !== 'text' ? `https://picsum.photos/seed/${Date.now()}_${i}/400/300` : undefined,
        views: Math.floor(Math.random() * 30000) + 500,
        date: new Date().toISOString(),
        parsedAt: new Date().toISOString(),
        status: 'new',
        hashtags: ['#new', '#trending'],
        hasMedia: mediaType !== 'text',
      });
    }

    channel.lastParsed = new Date().toISOString();
  });

  saveChannels(channels);
  const allPosts = [...newPosts, ...posts];
  savePosts(allPosts);
  return newPosts;
}

export function resetData(): void {
  localStorage.removeItem(CHANNELS_KEY);
  localStorage.removeItem(POSTS_KEY);
  localStorage.removeItem(SETTINGS_KEY);
}
