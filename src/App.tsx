import React, { useState } from 'react';

type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
type Category = 'architecture' | 'security' | 'performance' | 'ux' | 'code-quality' | 'testing' | 'backend';

interface Issue {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  category: Category;
  file?: string;
  lines?: string;
  recommendation: string;
  codeExample?: string;
}

const issues: Issue[] = [
  // === КРИТИЧЕСКИЕ ===
  {
    id: 'SEC-001',
    title: 'Небезопасные JWT секреты по умолчанию',
    description: 'В файле config.ts используются хардкод-секреты для JWT. Если переменные окружения не заданы, приложение будет использовать предсказуемые ключи, что позволяет подделывать токены.',
    severity: 'critical',
    category: 'security',
    file: 'backend/src/config.ts',
    lines: '16-19',
    recommendation: 'Добавить валидацию при старте сервера — если критические переменные не заданы в production, выбрасывать ошибку и останавливать сервер.',
    codeExample: `// backend/src/config.ts
if (config.env === 'production') {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required in production');
  }
  if (config.jwt.secret === 'default-secret-change-in-production') {
    throw new Error('JWT_SECRET must not be default value');
  }
}`,
  },
  {
    id: 'SEC-002',
    title: 'API credentials хранятся в localStorage в открытом виде',
    description: 'Telegram API ID, API Hash и Bot Token сохраняются в localStorage без шифрования. Любой XSS-уязвимый скрипт может получить доступ к этим данным.',
    severity: 'critical',
    category: 'security',
    file: 'src/store.ts',
    lines: '180-196',
    recommendation: 'API credentials должны храниться только на backend. Фронтенд не должен иметь прямого доступа к секретным ключам Telegram API.',
  },
  {
    id: 'SEC-003',
    title: 'Отсутствует CSRF защита',
    description: 'Backend не реализует CSRF-защиту. Хотя используется Bearer-токен, для cookie-based сессий это критично.',
    severity: 'high',
    category: 'security',
    file: 'backend/src/index.ts',
    recommendation: 'Добавить CSRF-токены для форм или использовать SameSite cookies.',
  },
  {
    id: 'SEC-004',
    title: 'Неправильный lang атрибут в HTML',
    description: 'В index.html установлен lang="zh-CN" (китайский), хотя приложение полностью на русском языке. Это влияет на SEO и доступность.',
    severity: 'medium',
    category: 'ux',
    file: 'index.html',
    lines: '2',
    recommendation: 'Изменить на lang="ru".',
    codeExample: `<html lang="ru">`,
  },
  // === ВЫСОКИЙ ПРИОРИТЕТ ===
  {
    id: 'ARCH-001',
    title: 'Массивное дублирование кода трансформации WebPost → Post',
    description: 'Логика преобразования WebPost в формат Post повторяется 3 раза в App.tsx (строки 74-90, 122-138, 165-179). Это нарушает DRY и усложняет поддержку.',
    severity: 'high',
    category: 'architecture',
    file: 'src/App.tsx',
    lines: '74-90, 122-138, 165-179',
    recommendation: 'Вынести в утилитарную функцию transformWebPostToPost() в отдельном модуле.',
    codeExample: `// src/utils/transformers.ts
export function transformWebPostToPost(wp: WebPost): Post {
  return {
    id: wp.id,
    channelId: wp.siteId,
    channelTitle: wp.siteName,
    channelUsername: new URL(wp.siteUrl).hostname,
    text: \`\${wp.title}\\n\\n\${wp.content}\`,
    mediaType: wp.imageUrl ? 'photo' : 'text',
    mediaUrl: wp.imageUrl,
    views: 0, // Не использовать Math.random()!
    date: wp.date,
    parsedAt: wp.parsedAt,
    status: wp.status,
    hashtags: wp.keywords.map(k => \`#\${k}\`),
    hasMedia: !!wp.imageUrl,
    source: 'web',
  };
}`,
  },
  {
    id: 'ARCH-002',
    title: 'Нет единого state management',
    description: 'Состояние приложения разбросано между useState в компонентах, localStorage и кастомными хуками. Нет единого источника истины, что затрудняет синхронизацию.',
    severity: 'high',
    category: 'architecture',
    recommendation: 'Внедрить Zustand или Redux Toolkit для централизованного управления состоянием. Это упростит тестирование и позволит избежать рассинхронизации.',
  },
  {
    id: 'ARCH-003',
    title: 'Нет клиентского роутинга',
    description: 'Навигация реализована через useState и switch. URL не меняется при переключении вкладок, невозможно поделиться ссылкой на конкретную страницу, нет истории браузера.',
    severity: 'high',
    category: 'architecture',
    file: 'src/App.tsx',
    lines: '67-208',
    recommendation: 'Использовать react-router-dom (уже установлен в зависимостях) для маршрутизации.',
    codeExample: `// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

<BrowserRouter>
  <Routes>
    <Route path="/" element={<Dashboard />} />
    <Route path="/channels" element={<ChannelsList />} />
    <Route path="/posts" element={<PostsList />} />
    <Route path="/settings" element={<Settings />} />
  </Routes>
</BrowserRouter>`,
  },
  {
    id: 'PERF-001',
    title: 'Math.random() вызывается при каждом рендере',
    description: 'Для webPosts views генерируется через Math.random() прямо в JSX. Это приводит к тому, что при каждом рендере значения меняются, что ломает мемоизацию и вызывает лишние перерисовки.',
    severity: 'high',
    category: 'performance',
    file: 'src/App.tsx',
    lines: '83, 131, 173',
    recommendation: 'Генерировать views один раз при создании данных и сохранять их. Или вычислять детерминированно на основе ID.',
    codeExample: `// Вместо Math.random() использовать детерминированный хеш:
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 10000;
}

// Использование:
views: hashCode(wp.id),`,
  },
  {
    id: 'PERF-002',
    title: 'Нет виртуализации длинных списков',
    description: 'Списки постов (PostsList, PublishQueue) рендерят все элементы DOM. При большом количестве постов (>100) это вызывает значительные тормоза.',
    severity: 'high',
    category: 'performance',
    file: 'src/components/PostsList.tsx',
    recommendation: 'Использовать react-window или @tanstack/virtual для виртуализации списков. Альтернатива — пагинация.',
  },
  {
    id: 'PERF-003',
    title: 'Нет debounce для поисковых полей',
    description: 'Поисковые поля в ChannelsList и PostsList фильтруют данные на каждое нажатие клавиши. При большом количестве данных это вызывает лаги.',
    severity: 'medium',
    category: 'performance',
    file: 'src/components/ChannelsList.tsx',
    recommendation: 'Добавить debounce (300мс) на onChange обработчики поиска.',
    codeExample: `// С использованием хука:
const [debouncedSearch, setDebouncedSearch] = useState('');

useEffect(() => {
  const timer = setTimeout(() => setDebouncedSearch(search), 300);
  return () => clearTimeout(timer);
}, [search]);

// Использовать debouncedSearch вместо search в useMemo`,
  },
  // === СРЕДНИЙ ПРИОРИТЕТ ===
  {
    id: 'CODE-001',
    title: 'WebSocket хук не используется в приложении',
    description: 'Хук useWebSocket написан, но нигде не подключен в компонентах. Реалтайм-обновления не работают.',
    severity: 'medium',
    category: 'code-quality',
    file: 'src/hooks/useWebSocket.ts',
    recommendation: 'Подключить WebSocket в useAppData для получения реалтайм-обновлений при парсинге.',
  },
  {
    id: 'CODE-002',
    title: 'Нет обработки ошибок в useAppData',
    description: 'Хук useAppData не обрабатывает ошибки при загрузке/сохранении данных. Если localStorage повреждён или недоступен, приложение упадёт без понятного сообщения.',
    severity: 'medium',
    category: 'code-quality',
    file: 'src/hooks/useAppData.ts',
    lines: '72-77',
    recommendation: 'Обернуть loadData в try/catch и показывать пользователю понятное сообщение об ошибке.',
    codeExample: `const loadData = useCallback(() => {
  try {
    setChannels(getChannels());
    setPosts(getPosts());
    setSites(getWebSites());
    setWebPosts(getWebPosts());
  } catch (error) {
    console.error('Failed to load data:', error);
    // Показать toast-уведомление пользователю
  }
}, []);`,
  },
  {
    id: 'CODE-003',
    title: 'Inline объекты в JSX нарушают мемоизацию',
    description: 'В App.tsx создаются новые массивы и объекты при каждом рендере (например, recentPosts, channels для PostsList). Это сводит на нет React.memo дочерних компонентов.',
    severity: 'medium',
    category: 'performance',
    file: 'src/App.tsx',
    lines: '70-95',
    recommendation: 'Использовать useMemo для вычисления пропсов, передаваемых в дочерние компоненты.',
  },
  {
    id: 'CODE-004',
    title: 'Нет типизации для API ответов',
    description: 'API клиент (api.ts) использует дженерики, но конкретные типы ответов не определены. Нет типобезопасности при работе с данными API.',
    severity: 'medium',
    category: 'code-quality',
    file: 'src/api.ts',
    recommendation: 'Определить конкретные типы для каждого эндпоинта API.',
  },
  {
    id: 'UX-001',
    title: 'Нет Dark Mode в компонентах',
    description: 'index.html содержит стили для dark/light тем, но компоненты не используют dark: классы Tailwind. Переключение темы не работает.',
    severity: 'medium',
    category: 'ux',
    recommendation: 'Добавить dark: варианты для всех компонентов или использовать CSS-переменные.',
  },
  {
    id: 'UX-002',
    title: 'Нет пагинации для списков постов',
    description: 'PostsList отображает все посты без пагинации. При 100+ постах интерфейс становится неудобным.',
    severity: 'medium',
    category: 'ux',
    file: 'src/components/PostsList.tsx',
    recommendation: 'Добавить пагинацию или infinite scroll.',
  },
  {
    id: 'UX-003',
    title: 'Нет toast-уведомлений',
    description: 'Результаты действий (сохранение настроек, публикация) показываются inline. Нет единой системы уведомлений.',
    severity: 'low',
    category: 'ux',
    recommendation: 'Внедрить систему toast-уведомлений (react-hot-toast или sonner).',
  },
  // === НИЗКИЙ ПРИОРИТЕТ ===
  {
    id: 'TEST-001',
    title: 'Нет E2E тестов',
    description: 'Есть unit-тесты для store и хуков, но нет E2E тестов для критических пользовательских сценариев (добавление канала, парсинг, публикация).',
    severity: 'medium',
    category: 'testing',
    recommendation: 'Добавить Playwright или Cypress для E2E тестирования основных flow.',
  },
  {
    id: 'TEST-002',
    title: 'Нет тестов для компонентов',
    description: 'Компоненты (Dashboard, ChannelsList, PostsList, Settings) не покрыты тестами. Только ErrorBoundary имеет тест.',
    severity: 'medium',
    category: 'testing',
    recommendation: 'Добавить component tests с @testing-library/react для ключевых компонентов.',
  },
  {
    id: 'BACK-001',
    title: 'Нет API документации (Swagger/OpenAPI)',
    description: 'Backend не имеет автоматической документации API. Разработчикам приходится читать код для понимания эндпоинтов.',
    severity: 'medium',
    category: 'backend',
    file: 'backend/src/index.ts',
    recommendation: 'Добавить swagger-ui-express и генерацию документации из Zod-схем.',
  },
  {
    id: 'BACK-002',
    title: 'Нет кеширования (Redis)',
    description: 'Redis упомянут в конфиге, но не используется. Все запросы идут напрямую в БД.',
    severity: 'low',
    category: 'backend',
    file: 'backend/src/config.ts',
    lines: '34-37',
    recommendation: 'Реализовать кеширование часто запрашиваемых данных (списки каналов, статистика).',
  },
  {
    id: 'BACK-003',
    title: 'Нет валидации query-параметров',
    description: 'В routes/channels.ts query-параметры page и limit парсятся через parseInt без валидации. Отрицательные или NaN значения не обрабатываются.',
    severity: 'medium',
    category: 'backend',
    file: 'backend/src/routes/channels.ts',
    lines: '31-34',
    recommendation: 'Использовать Zod для валидации query-параметров.',
    codeExample: `const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  isActive: z.coerce.boolean().optional(),
  category: z.string().optional(),
  topic: z.string().optional(),
});

const query = querySchema.parse(req.query);`,
  },
  {
    id: 'BACK-004',
    title: 'Дублирование маршрутов (legacy + v1)',
    description: 'Маршруты дублируются: /api/v1/channels и /api/channels указывают на одни и те же роутеры. Это увеличивает поверхность атаки.',
    severity: 'low',
    category: 'backend',
    file: 'backend/src/index.ts',
    lines: '108-115',
    recommendation: 'Использовать redirect middleware вместо дублирования маршрутов.',
  },
  {
    id: 'CODE-005',
    title: 'Отсутствует .env.example файл',
    description: 'Нет примера файла окружения. Новым разработчикам сложно понять, какие переменные нужны.',
    severity: 'low',
    category: 'code-quality',
    recommendation: 'Создать .env.example с описанием всех переменных окружения.',
  },
  {
    id: 'CODE-006',
    title: 'Нет ESLint конфигурации',
    description: 'В package.json есть скрипт lint, но нет конфигурационного файла .eslintrc. Линтинг не работает.',
    severity: 'low',
    category: 'code-quality',
    recommendation: 'Добавить .eslintrc.js с правилами для React/TypeScript.',
  },
];

const severityConfig: Record<Severity, { label: string; color: string; bg: string; icon: string }> = {
  critical: { label: 'Критический', color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: '🔴' },
  high: { label: 'Высокий', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', icon: '🟠' },
  medium: { label: 'Средний', color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200', icon: '🟡' },
  low: { label: 'Низкий', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: '🔵' },
  info: { label: 'Информация', color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200', icon: '⚪' },
};

const categoryConfig: Record<Category, { label: string; icon: string; color: string }> = {
  architecture: { label: 'Архитектура', icon: 'fa-sitemap', color: 'text-purple-600' },
  security: { label: 'Безопасность', icon: 'fa-shield-alt', color: 'text-red-600' },
  performance: { label: 'Производительность', icon: 'fa-tachometer-alt', color: 'text-green-600' },
  ux: { label: 'UX/UI', icon: 'fa-paint-brush', color: 'text-blue-600' },
  'code-quality': { label: 'Качество кода', icon: 'fa-code', color: 'text-indigo-600' },
  testing: { label: 'Тестирование', icon: 'fa-vial', color: 'text-teal-600' },
  backend: { label: 'Backend', icon: 'fa-server', color: 'text-gray-600' },
};

function App() {
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<Severity | 'all'>('all');
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredIssues = issues.filter(issue => {
    const matchesCategory = selectedCategory === 'all' || issue.category === selectedCategory;
    const matchesSeverity = selectedSeverity === 'all' || issue.severity === selectedSeverity;
    const matchesSearch = searchQuery === '' ||
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSeverity && matchesSearch;
  });

  const stats = {
    total: issues.length,
    critical: issues.filter(i => i.severity === 'critical').length,
    high: issues.filter(i => i.severity === 'high').length,
    medium: issues.filter(i => i.severity === 'medium').length,
    low: issues.filter(i => i.severity === 'low').length,
  };

  const categoryStats = Object.entries(categoryConfig).map(([key, config]) => ({
    key: key as Category,
    ...config,
    count: issues.filter(i => i.category === key).length,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <i className="fas fa-clipboard-check text-white text-lg"></i>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Анализ кода TG Parser</h1>
                <p className="text-sm text-gray-500">Отчёт по доработкам • {new Date().toLocaleDateString('ru-RU')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600 font-medium">
                {stats.total} замечаний
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-lg">🔴</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
                <p className="text-xs text-gray-500">Критических</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-lg">🟠</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">{stats.high}</p>
                <p className="text-xs text-gray-500">Высоких</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-lg">🟡</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{stats.medium}</p>
                <p className="text-xs text-gray-500">Средних</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-lg">🔵</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.low}</p>
                <p className="text-xs text-gray-500">Низких</p>
              </div>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <i className="fas fa-chart-pie text-indigo-600"></i>
            Распределение по категориям
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {categoryStats.map(cat => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(selectedCategory === cat.key ? 'all' : cat.key)}
                className={`p-3 rounded-lg text-center transition-all ${
                  selectedCategory === cat.key
                    ? 'bg-indigo-50 border-2 border-indigo-300 shadow-sm'
                    : 'bg-gray-50 border border-gray-100 hover:bg-gray-100'
                }`}
              >
                <i className={`fas ${cat.icon} ${cat.color} text-lg mb-1`}></i>
                <p className="text-lg font-bold text-gray-900">{cat.count}</p>
                <p className="text-xs text-gray-500 truncate">{cat.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Поиск по замечаниям..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <select
              value={selectedSeverity}
              onChange={e => setSelectedSeverity(e.target.value as Severity | 'all')}
              className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
            >
              <option value="all">Все приоритеты</option>
              <option value="critical">🔴 Критический</option>
              <option value="high">🟠 Высокий</option>
              <option value="medium">🟡 Средний</option>
              <option value="low">🔵 Низкий</option>
            </select>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value as Category | 'all')}
              className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
            >
              <option value="all">Все категории</option>
              {Object.entries(categoryConfig).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>
          {(selectedCategory !== 'all' || selectedSeverity !== 'all' || searchQuery) && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm text-gray-500">Найдено: {filteredIssues.length}</span>
              <button
                onClick={() => { setSelectedCategory('all'); setSelectedSeverity('all'); setSearchQuery(''); }}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Сбросить фильтры
              </button>
            </div>
          )}
        </div>

        {/* Issues List */}
        <div className="space-y-3">
          {filteredIssues.map(issue => {
            const sevConfig = severityConfig[issue.severity];
            const catConfig = categoryConfig[issue.category];
            const isExpanded = expandedIssue === issue.id;

            return (
              <div
                key={issue.id}
                className={`bg-white rounded-xl border transition-all ${
                  isExpanded ? 'border-blue-300 shadow-md' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <button
                  onClick={() => setExpandedIssue(isExpanded ? null : issue.id)}
                  className="w-full p-4 sm:p-5 text-left"
                >
                  <div className="flex items-start gap-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold border ${sevConfig.bg} ${sevConfig.color} flex-shrink-0`}>
                      {issue.id}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{issue.title}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span className={`inline-flex items-center gap-1 text-xs ${catConfig.color}`}>
                          <i className={`fas ${catConfig.icon}`}></i>
                          {catConfig.label}
                        </span>
                        {issue.file && (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                            <i className="fas fa-file-code"></i>
                            {issue.file}
                          </span>
                        )}
                        {issue.lines && (
                          <span className="text-xs text-gray-400">
                            (строки {issue.lines})
                          </span>
                        )}
                      </div>
                    </div>
                    <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} text-gray-400 flex-shrink-0 mt-1`}></i>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 sm:px-5 pb-5 border-t border-gray-100 pt-4">
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Описание проблемы:</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">{issue.description}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Рекомендация:</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">{issue.recommendation}</p>
                      </div>
                      {issue.codeExample && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Пример исправления:</h4>
                          <pre className="bg-gray-900 text-green-400 rounded-lg p-4 text-xs overflow-x-auto">
                            <code>{issue.codeExample}</code>
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredIssues.length === 0 && (
          <div className="text-center py-12">
            <i className="fas fa-search text-4xl text-gray-300 mb-4"></i>
            <p className="text-gray-500">Замечания не найдены по заданным фильтрам</p>
          </div>
        )}

        {/* Summary / Roadmap */}
        <div className="mt-10 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <i className="fas fa-road text-green-600"></i>
            Рекомендуемый порядок исправлений
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-red-600">1</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Спринт 1 — Безопасность (1-2 дня)</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Исправить SEC-001 (JWT секреты), SEC-002 (API credentials), SEC-004 (lang атрибут). 
                  Добавить валидацию env-переменных при старте.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-orange-600">2</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Спринт 2 — Архитектура (3-5 дней)</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Внедрить роутинг (ARCH-003), вынести трансформации (ARCH-001), 
                  добавить state management (ARCH-002).
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-yellow-600">3</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Спринт 3 — Производительность (2-3 дня)</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Убрать Math.random() (PERF-001), добавить виртуализацию (PERF-002), 
                  debounce поиска (PERF-003), мемоизацию пропсов (CODE-003).
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-blue-600">4</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Спринт 4 — Качество и UX (3-4 дня)</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Добавить обработку ошибок (CODE-002), dark mode (UX-001), пагинацию (UX-002), 
                  toast-уведомления (UX-003), подключить WebSocket (CODE-001).
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-gray-600">5</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Спринт 5 — Тестирование и Backend (3-5 дней)</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Добавить E2E тесты (TEST-001), компонентные тесты (TEST-002), 
                  Swagger документацию (BACK-001), валидацию query (BACK-003).
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Overall Assessment */}
        <div className="mt-8 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <i className="fas fa-star text-indigo-600"></i>
            Общая оценка проекта
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-green-700 mb-2">✅ Сильные стороны:</h3>
              <ul className="space-y-1.5 text-sm text-gray-700">
                <li className="flex items-start gap-2"><i className="fas fa-check text-green-500 mt-0.5"></i>Хорошая структура компонентов с React.memo</li>
                <li className="flex items-start gap-2"><i className="fas fa-check text-green-500 mt-0.5"></i>Lazy loading для оптимизации бандла</li>
                <li className="flex items-start gap-2"><i className="fas fa-check text-green-500 mt-0.5"></i>Error Boundary для graceful degradation</li>
                <li className="flex items-start gap-2"><i className="fas fa-check text-green-500 mt-0.5"></i>Система миграций для обратной совместимости</li>
                <li className="flex items-start gap-2"><i className="fas fa-check text-green-500 mt-0.5"></i>Backend с хорошей архитектурой (middleware, роуты)</li>
                <li className="flex items-start gap-2"><i className="fas fa-check text-green-500 mt-0.5"></i>Zod валидация на backend</li>
                <li className="flex items-start gap-2"><i className="fas fa-check text-green-500 mt-0.5"></i>Helmet, CORS, Rate Limiting настроены</li>
                <li className="flex items-start gap-2"><i className="fas fa-check text-green-500 mt-0.5"></i>Graceful shutdown на сервере</li>
                <li className="flex items-start gap-2"><i className="fas fa-check text-green-500 mt-0.5"></i>Prisma ORM с нормальной схемой БД</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-red-700 mb-2">⚠️ Слабые стороны:</h3>
              <ul className="space-y-1.5 text-sm text-gray-700">
                <li className="flex items-start gap-2"><i className="fas fa-times text-red-500 mt-0.5"></i>Небезопасные дефолтные секреты</li>
                <li className="flex items-start gap-2"><i className="fas fa-times text-red-500 mt-0.5"></i>Дублирование кода трансформации</li>
                <li className="flex items-start gap-2"><i className="fas fa-times text-red-500 mt-0.5"></i>Нет роутинга и deep linking</li>
                <li className="flex items-start gap-2"><i className="fas fa-times text-red-500 mt-0.5"></i>Неиспользуемый WebSocket хук</li>
                <li className="flex items-start gap-2"><i className="fas fa-times text-red-500 mt-0.5"></i>Math.random() в рендере</li>
                <li className="flex items-start gap-2"><i className="fas fa-times text-red-500 mt-0.5"></i>Нет пагинации и виртуализации</li>
                <li className="flex items-start gap-2"><i className="fas fa-times text-red-500 mt-0.5"></i>Неполное покрытие тестами</li>
                <li className="flex items-start gap-2"><i className="fas fa-times text-red-500 mt-0.5"></i>Нет API документации</li>
                <li className="flex items-start gap-2"><i className="fas fa-times text-red-500 mt-0.5"></i>Нет обработки ошибок в хуках</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-indigo-200">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-indigo-600">6.5<span className="text-lg text-gray-400">/10</span></p>
                <p className="text-xs text-gray-500 mt-1">Общая оценка</p>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700">
                  Проект имеет хорошую базу с продуманной архитектурой backend и качественными UI-компонентами. 
                  Основные области для улучшения — безопасность, устранение дублирования кода и оптимизация производительности. 
                  При следовании рекомендациям из этого отчёта проект может достичь уровня production-ready за 2-3 спринта.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-gray-400 pb-8">
          <p>Анализ выполнен автоматически • {issues.length} замечаний найдено • {new Date().toLocaleString('ru-RU')}</p>
        </footer>
      </main>
    </div>
  );
}

export default App;
