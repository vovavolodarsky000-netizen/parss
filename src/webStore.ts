import { WebSite, ParseRule, WebPost } from './types';

const SITES_KEY = 'tg_parser_sites';
const WEB_POSTS_KEY = 'tg_parser_web_posts';

function generateMockRules(): ParseRule[] {
  return [
    {
      id: 'rule_1',
      name: 'Новости технологий',
      urlPattern: '/news/tech/*',
      titleSelector: 'h1.article-title',
      contentSelector: 'div.article-content p',
      dateSelector: 'time.published-date',
      imageSelector: 'img.article-hero',
      authorSelector: 'span.author-name',
      maxItems: 20,
      isActive: true,
    },
    {
      id: 'rule_2',
      name: 'Статьи блога',
      urlPattern: '/blog/*',
      titleSelector: 'h1.post-title',
      contentSelector: 'div.post-body',
      dateSelector: 'time.post-date',
      imageSelector: 'img.post-thumbnail',
      maxItems: 10,
      isActive: true,
    },
  ];
}

function generateMockSites(): WebSite[] {
  const sites = [
    {
      name: 'TechCrunch',
      url: 'https://techcrunch.com',
      topics: ['Технологии', 'Стартапы'],
      keywords: ['startup', 'funding', 'AI', 'tech'],
    },
    {
      name: 'Hacker News',
      url: 'https://news.ycombinator.com',
      topics: ['Технологии', 'Программирование'],
      keywords: ['programming', 'hacker', 'show HN', 'launch'],
    },
    {
      name: 'The Verge',
      url: 'https://www.theverge.com',
      topics: ['Технологии', 'Дизайн'],
      keywords: ['gadget', 'review', 'Apple', 'Google'],
    },
    {
      name: 'Product Hunt',
      url: 'https://www.producthunt.com',
      topics: ['Стартапы', 'Бизнес', 'Технологии'],
      keywords: ['product', 'launch', 'SaaS', 'tool'],
    },
    {
      name: 'Dev.to',
      url: 'https://dev.to',
      topics: ['Программирование', 'Технологии'],
      keywords: ['tutorial', 'code', 'javascript', 'python'],
    },
    {
      name: 'Medium Tech',
      url: 'https://medium.com/topic/technology',
      topics: ['Технологии', 'Программирование', 'Наука'],
      keywords: ['engineering', 'architecture', 'cloud', 'data'],
    },
  ];

  return sites.map((site, i) => ({
    id: `site_${i + 1}`,
    name: site.name,
    url: site.url,
    isActive: i < 4,
    lastParsed: i < 3 ? new Date(Date.now() - (i * 86400000)).toISOString() : null,
    topics: site.topics,
    keywords: site.keywords,
    parseRules: generateMockRules().slice(0, i % 2 + 1),
    addedAt: new Date(Date.now() - (i * 86400000 * 3)).toISOString(),
  }));
}

function generateMockWebPosts(sites: WebSite[]): WebPost[] {
  const posts: WebPost[] = [];
  const statuses: Array<'new' | 'approved' | 'published' | 'rejected'> = ['new', 'approved', 'published', 'rejected'];

  const sampleArticles = [
    {
      title: 'Как AI меняет индустрию разработки в 2026 году',
      content: 'Искусственный интеллект продолжает трансформировать процесс разработки программного обеспечения. Новые инструменты на базе GPT-моделей позволяют разработчикам писать код в 3 раза быстрее, а автоматическое тестирование стало умнее благодаря машинному обучению.',
      author: 'Алексей Петров',
    },
    {
      title: 'Топ-10 фреймворков для веб-разработки',
      content: 'В 2026 году ландшафт веб-разработки продолжает эволюционировать. React остаётся лидером, но новые игроки如 Astro и Qwik набирают популярность благодаря серверному рендерингу и оптимизации производительности.',
      author: 'Мария Иванова',
    },
    {
      title: 'Стартап привлёк $50M на развитие AI-платформы',
      content: 'Компания NeuralFlow объявила о закрытии раунда Series B. Инвестиции пойдут на расширение команды и выход на европейский рынок. Платформа использует нейросети для автоматизации бизнес-процессов.',
      author: 'Дмитрий Козлов',
    },
    {
      title: 'Новый подход к UX-дизайну: данные решают всё',
      content: 'Современные UX-дизайнеры всё чаще полагаются на данные A/B тестов и аналитику поведения пользователей. Figma представила новые AI-инструменты для генерации прототипов на основе описания.',
      author: 'Елена Смирнова',
    },
    {
      title: 'Блокчейн за пределами криптовалют: реальные кейсы',
      content: 'Технология распределённого реестра находит применение в логистике, медицине и государственном управлении. Крупнейшие банки внедряют блокчейн для международных переводов.',
      author: 'Сергей Волков',
    },
    {
      title: 'Kubernetes vs Docker Swarm: что выбрать в 2026',
      content: 'Оркестрация контейнеров остаётся ключевой задачей для DevOps-команд. Kubernetes продолжает доминировать, но Docker Swarm предлагает более простой порог входа для небольших проектов.',
      author: 'Андрей Новиков',
    },
    {
      title: 'Cybersecurity тренды: защита от AI-атак',
      content: 'С развитием AI хакеры получили новые инструменты для создания фишинговых атак и вредоносного кода. Компании вынуждены инвестировать в AI-based системы защиты.',
      author: 'Ольга Белова',
    },
    {
      title: 'React 20: что нового и как мигрировать',
      content: 'Вышла стабильная версия React 20 с революционными изменениями. Server Components стали стандартом, новый компилятор увеличивает производительность, а API значительно упрощён.',
      author: 'Игорь Фёдоров',
    },
    {
      title: 'Edge Computing: будущее распределённых вычислений',
      content: 'Перенос вычислений на периферию сети снижает задержки и улучшает производительность. Cloudflare Workers и Deno Deploy лидируют в этой области.',
      author: 'Наталья Кузнецова',
    },
    {
      title: 'No-code/Low-code платформы: обзор рынка',
      content: 'Рынок no-code решений вырос на 40% за последний год. Платформы позволяют создавать сложные приложения без написания кода, что особенно востребовано в малом бизнесе.',
      author: 'Виктор Морозов',
    },
  ];

  const activeSites = sites.filter(s => s.isActive);

  for (let i = 0; i < 36; i++) {
    const site = activeSites[i % activeSites.length];
    const article = sampleArticles[i % sampleArticles.length];
    const status = statuses[i % statuses.length];
    const daysAgo = i % 14;
    const date = new Date(Date.now() - daysAgo * 86400000 - (i * 3600000));

    posts.push({
      id: `web_post_${i + 1}`,
      siteId: site.id,
      siteName: site.name,
      siteUrl: site.url,
      title: article.title,
      content: article.content,
      url: `${site.url}/article/${i + 1}`,
      imageUrl: `https://picsum.photos/seed/web${i}/600/400`,
      author: article.author,
      date: date.toISOString(),
      parsedAt: new Date(date.getTime() + (i * 60000)).toISOString(),
      status,
      topics: site.topics,
      keywords: site.keywords.slice(0, 3),
    });
  }

  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Получение списка всех веб-сайтов
 * 
 * @returns {WebSite[]} Массив веб-сайтов
 * @description
 * Загружает сайты из localStorage. Если данных нет, создаёт моковые данные.
 * Гарантирует наличие полей topics, keywords и parseRules для обратной совместимости.
 */
export function getWebSites(): WebSite[] {
  const stored = localStorage.getItem(SITES_KEY);
  if (stored) {
    try {
      const sites = JSON.parse(stored);
      // Гарантируем наличие полей topics и keywords для обратной совместимости
      return sites.map((s: WebSite) => ({
        ...s,
        topics: s.topics || [],
        keywords: s.keywords || [],
        parseRules: s.parseRules || [],
      }));
    } catch (error) {
      console.error('Ошибка парсинга сайтов из localStorage:', error);
      const mock = generateMockSites();
      localStorage.setItem(SITES_KEY, JSON.stringify(mock));
      return mock;
    }
  }
  const mock = generateMockSites();
  localStorage.setItem(SITES_KEY, JSON.stringify(mock));
  return mock;
}

/**
 * Сохранение списка веб-сайтов в localStorage
 * 
 * @param sites - Массив сайтов для сохранения
 */
export function saveWebSites(sites: WebSite[]): void {
  localStorage.setItem(SITES_KEY, JSON.stringify(sites));
}

/**
 * Получение списка всех постов с веб-сайтов
 * 
 * @returns {WebPost[]} Массив постов
 * @description
 * Загружает посты из localStorage. Если данных нет, создаёт моковые данные.
 */
export function getWebPosts(): WebPost[] {
  const stored = localStorage.getItem(WEB_POSTS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error('Ошибка парсинга веб-постов из localStorage:', error);
      const sites = getWebSites();
      const mock = generateMockWebPosts(sites);
      localStorage.setItem(WEB_POSTS_KEY, JSON.stringify(mock));
      return mock;
    }
  }
  const sites = getWebSites();
  const mock = generateMockWebPosts(sites);
  localStorage.setItem(WEB_POSTS_KEY, JSON.stringify(mock));
  return mock;
}

/**
 * Сохранение списка постов с веб-сайтов в localStorage
 * 
 * @param posts - Массив постов для сохранения
 */
export function saveWebPosts(posts: WebPost[]): void {
  localStorage.setItem(WEB_POSTS_KEY, JSON.stringify(posts));
}

/**
 * Добавление нового веб-сайта
 * 
 * @param site - Данные сайта без id и addedAt
 * @returns {WebSite} Созданный сайт с id и addedAt
 * @description
 * Создаёт новый сайт с уникальным id и временной меткой, сохраняет в localStorage.
 */
export function addWebSite(site: Omit<WebSite, 'id' | 'addedAt'>): WebSite {
  const sites = getWebSites();
  const newSite: WebSite = {
    ...site,
    id: `site_${Date.now()}`,
    addedAt: new Date().toISOString(),
  };
  sites.push(newSite);
  saveWebSites(sites);
  return newSite;
}

/**
 * Удаление веб-сайта и всех его постов
 * 
 * @param id - ID сайта для удаления
 * @description
 * Удаляет сайт из хранилища и все связанные с ним посты.
 */
export function removeWebSite(id: string): void {
  const sites = getWebSites().filter(s => s.id !== id);
  saveWebSites(sites);
  const posts = getWebPosts().filter(p => p.siteId !== id);
  saveWebPosts(posts);
}

/**
 * Переключение активности веб-сайта
 * 
 * @param id - ID сайта
 * @description
 * Включает или выключает сайт для парсинга.
 */
export function toggleWebSite(id: string): void {
  const sites = getWebSites().map(s => 
    s.id === id ? { ...s, isActive: !s.isActive } : s
  );
  saveWebSites(sites);
}

/**
 * Обновление данных веб-сайта
 * 
 * @param id - ID сайта
 * @param updates - Объект с обновляемыми полями
 * @description
 * Обновляет указанные поля сайта и сохраняет изменения.
 */
export function updateWebSite(id: string, updates: Partial<WebSite>): void {
  const sites = getWebSites().map(s => 
    s.id === id ? { ...s, ...updates } : s
  );
  saveWebSites(sites);
}

/**
 * Обновление статуса поста с веб-сайта
 * 
 * @param id - ID поста
 * @param status - Новый статус (new, approved, published, rejected)
 * @description
 * Изменяет статус поста и сохраняет изменения в localStorage.
 */
export function updateWebPostStatus(id: string, status: WebPost['status']): void {
  const posts = getWebPosts().map(p => 
    p.id === id ? { ...p, status } : p
  );
  saveWebPosts(posts);
}

/**
 * Массовое обновление статусов постов с веб-сайтов
 * 
 * @param ids - Массив ID постов для обновления
 * @param status - Новый статус для всех указанных постов
 * @description
 * Обновляет статус нескольких постов одновременно.
 */
export function bulkUpdateWebPostStatus(ids: string[], status: WebPost['status']): void {
  const posts = getWebPosts().map(p => 
    ids.includes(p.id) ? { ...p, status } : p
  );
  saveWebPosts(posts);
}
/**
 * Симуляция процесса парсинга веб-сайтов
 * 
 * @returns {WebPost[]} Массив новых постов
 * @description
 * Генерирует новые посты для всех активных веб-сайтов.
 * Используется для демонстрации и тестирования.
 */
export function simulateWebParsing(): WebPost[] {
  const sites = getWebSites().filter(s => s.isActive);
  const posts = getWebPosts();
  const newPosts: WebPost[] = [];

  const sampleArticles = [
    {
      title: 'Прорыв в квантовых вычислениях: новый рекорд',
      content: 'Исследователи из Google Quantum AI достигли нового рубежа — 1000 кубитов с низкой ошибкой. Это открывает путь к практическому применению квантовых компьютеров.',
      author: 'Научный отдел',
    },
    {
      title: 'WebAssembly 3.0: революция в браузере',
      content: 'Новая спецификация WebAssembly brings garbage collection и threads. Это позволяет запускать сложные приложения на уровне нативной производительности.',
      author: 'Техническая редакция',
    },
    {
      title: 'OpenAI выпустила GPT-5 с мультимодальностью',
      content: 'Новая модель способна обрабатывать текст, изображения, видео и аудио одновременно. Качество генерации кода выросло на 60%.',
      author: 'AI Lab',
    },
    {
      title: 'TypeScript 6.0: что нового',
      content: 'Релиз включает pattern matching, improved type inference и нативную поддержку декораторов. Миграция с JS стала ещё проще.',
      author: 'Dev Community',
    },
    {
      title: 'Стартапы AI-безопасности привлекли $2B',
      content: 'Инвестиции в компании, разрабатывающие инструменты для безопасного использования AI, выросли в 5 раз. Регуляторы усиливают контроль.',
      author: 'Venture Beat',
    },
  ];

  sites.forEach((site, siteIndex) => {
    // Детерминированное количество постов на основе индекса сайта
    const numNewPosts = (siteIndex % 3) + 1;
    for (let i = 0; i < numNewPosts; i++) {
      // Детерминированный выбор статьи
      const articleIndex = (siteIndex + i) % sampleArticles.length;
      const article = sampleArticles[articleIndex];

      // Детерминированный ID на основе индексов
      const postId = `web_post_${Date.now()}_${siteIndex}_${i}`;

      newPosts.push({
        id: postId,
        siteId: site.id,
        siteName: site.name,
        siteUrl: site.url,
        title: article.title,
        content: article.content,
        url: `${site.url}/article/${siteIndex}_${i}`,
        imageUrl: `https://picsum.photos/seed/web${siteIndex}_${i}/600/400`,
        author: article.author,
        date: new Date().toISOString(),
        parsedAt: new Date().toISOString(),
        status: 'new',
        topics: site.topics,
        keywords: site.keywords.slice(0, 3),
      });
    }

    site.lastParsed = new Date().toISOString();
  });

  saveWebSites(sites);
  const allPosts = [...newPosts, ...posts];
  saveWebPosts(allPosts);
  return newPosts;
}
