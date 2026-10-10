import React, { useState } from 'react';

type Severity = 'critical' | 'high' | 'medium' | 'low';
type Category = 'bug' | 'security' | 'performance' | 'architecture' | 'testing' | 'code-quality' | 'ux';

interface Issue {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  category: Category;
  file: string;
  line?: string;
  impact: string;
  recommendation: string;
  codeExample?: string;
}

const issues: Issue[] = [
  // === КРИТИЧЕСКИЕ ===
  {
    id: 'SEC-002',
    title: 'API credentials хранятся в localStorage',
    description: 'В файле api.ts токены доступа хранятся в localStorage (строки 32-33). Это делает приложение уязвимым к XSS-атакам - любой вредоносный скрипт может получить доступ к токенам.',
    severity: 'critical',
    category: 'security',
    file: 'src/api.ts',
    line: '32-33',
    impact: 'При XSS-атаке злоумышленник может украсть токены и получить полный доступ к аккаунту пользователя.',
    recommendation: 'Использовать httpOnly cookies для хранения токенов. Токены не должны быть доступны из JavaScript.',
    codeExample: `// Вместо localStorage использовать cookies:
// Backend устанавливает:
res.cookie('access_token', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 3600000
});

// Frontend автоматически отправляет cookie с credentials: 'include'`,
  },

  {
    id: 'PERF-001',
    title: 'Двойной вызов set() в loadData',
    description: 'В appStore.ts функция loadData() вызывает set() дважды подряд (строки 82 и 83-89). Это вызывает двойной рендер компонентов, использующих store.',
    severity: 'high',
    category: 'performance',
    file: 'src/store/appStore.ts',
    line: '82-89',
    impact: 'Лишние рендеры при загрузке данных. При большом количестве компонентов это может вызвать заметные лаги.',
    recommendation: 'Объединить оба вызова set() в один.',
    codeExample: `// Неправильно:
set({ isLoading: true, error: null });
set({
  channels: getChannels(),
  posts: getPosts(),
  // ...
  isLoading: false,
});

// Правильно:
set({
  isLoading: true,
  error: null,
  channels: getChannels(),
  posts: getPosts(),
  sites: getWebSites(),
  webPosts: getWebPosts(),
});`,
  },

  {
    id: 'PERF-002',
    title: 'topChannels не мемоизирован в Dashboard',
    description: 'В Dashboard.tsx массив topChannels пересчитывается при каждом рендере (строки 35-37), хотя зависит только от channels.',
    severity: 'medium',
    category: 'performance',
    file: 'src/components/Dashboard.tsx',
    line: '35-37',
    impact: 'Лишние вычисления при каждом рендере дашборда. Сортировка массива - O(n log n) операция.',
    recommendation: 'Обернуть topChannels в useMemo.',
    codeExample: `const topChannels = useMemo(() => 
  [...channels]
    .sort((a, b) => b.subscribers - a.subscribers)
    .slice(0, 5),
  [channels]
);`,
  },

  {
    id: 'PERF-003',
    title: 'IIFE в JSX для topicCounts',
    description: 'В Dashboard.tsx используется IIFE (Immediately Invoked Function Expression) прямо в JSX для вычисления topicCounts (строки 180-192). Это выполняется при каждом рендере.',
    severity: 'medium',
    category: 'performance',
    file: 'src/components/Dashboard.tsx',
    line: '180-192',
    impact: 'Лишние вычисления при каждом рендере. Итерация по всем каналам и их тематикам.',
    recommendation: 'Вынести вычисление topicCounts в useMemo.',
    codeExample: `const topicCounts = useMemo(() => {
  const counts: Record<string, number> = {};
  channels.forEach(ch => 
    (ch.topics || []).forEach(t => { 
      counts[t] = (counts[t] || 0) + 1; 
    })
  );
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
}, [channels]);

// В JSX:
{topicCounts.map(([topic, count]) => (...))}`,
  },

  {
    id: 'CODE-001',
    title: 'Использование index как key в map',
    description: 'В Dashboard.tsx при рендере statCards используется index как key (строка 57). Это плохая практика, которая может привести к проблемам с reconciliation.',
    severity: 'low',
    category: 'code-quality',
    file: 'src/components/Dashboard.tsx',
    line: '57',
    impact: 'При изменении порядка элементов React может неправильно обновлять DOM, что приводит к багам с фокусом и состоянием.',
    recommendation: 'Использовать уникальные идентификаторы из данных.',
    codeExample: `// Неправильно:
{statCards.map((card, i) => (
  <div key={i}>...</div>
))}

// Правильно:
{statCards.map((card) => (
  <div key={card.label}>...</div>
))}`,
  },

  {
    id: 'CODE-002',
    title: 'Мёртвый код: allTopics в PostsList',
    description: 'В PostsList.tsx вычисляется allTopics (строка 37), но нигде не используется в компоненте.',
    severity: 'low',
    category: 'code-quality',
    file: 'src/components/PostsList.tsx',
    line: '37',
    impact: 'Лишние вычисления при каждом рендере. Увеличивает размер кода.',
    recommendation: 'Удалить неиспользуемую переменную.',
    codeExample: `// Удалить эту строку:
const allTopics = useMemo(() => [...new Set(allChannels.flatMap(ch => ch.topics || []))], [allChannels]);`,
  },

  {
    id: 'CODE-003',
    title: 'Функции toggleSelect и selectAll не мемоизированы',
    description: 'В PostsList.tsx функции toggleSelect и selectAll (строки 69-79) создаются заново при каждом рендере.',
    severity: 'medium',
    category: 'performance',
    file: 'src/components/PostsList.tsx',
    line: '69-79',
    impact: 'Если эти функции передаются в дочерние компоненты, они будут вызывать лишние рендеры.',
    recommendation: 'Обернуть в useCallback.',
    codeExample: `const toggleSelect = useCallback((id: string) => {
  setSelected(prev => 
    prev.includes(id) 
      ? prev.filter(i => i !== id) 
      : [...prev, id]
  );
}, []);

const selectAll = useCallback(() => {
  if (selected.length === filtered.length) {
    setSelected([]);
  } else {
    setSelected(filtered.map(p => p.id));
  }
}, [selected.length, filtered]);`,
  },

  {
    id: 'CODE-004',
    title: 'Функции handleAdd, addKeyword и др. не мемоизированы',
    description: 'В ChannelsList.tsx функции handleAdd, addKeyword, removeKeyword, toggleTopic (строки 58-90) создаются заново при каждом рендере.',
    severity: 'medium',
    category: 'performance',
    file: 'src/components/ChannelsList.tsx',
    line: '58-90',
    impact: 'Лишние пересоздания функций при каждом рендере.',
    recommendation: 'Обернуть в useCallback с правильными зависимостями.',
    codeExample: `const handleAdd = useCallback(() => {
  if (!newChannel.username || !newChannel.title) return;
  onAdd({
    ...newChannel,
    isActive: true,
    lastParsed: null,
    avatar: \`https://api.dicebear.com/4.0/identicon/\${newChannel.username}.png?size=80\`,
  });
  setNewChannel({ username: '', title: '', subscribers: 0, category: '', topics: [], keywords: [] });
  setNewKeyword('');
  setShowAddModal(false);
}, [newChannel, onAdd]);`,
  },

  {
    id: 'BUG-001',
    title: 'Нет пагинации в ChannelsList',
    description: 'Компонент ChannelsList отображает все каналы без пагинации. При большом количестве каналов (50+) это может вызвать проблемы с производительностью.',
    severity: 'medium',
    category: 'performance',
    file: 'src/components/ChannelsList.tsx',
    impact: 'Замедление интерфейса при большом количестве каналов. Пользователю неудобно прокручивать длинный список.',
    recommendation: 'Добавить пагинацию аналогично PostsList.',
  },

  {
    id: 'BUG-002',
    title: 'Нет обработки ошибок при retry в api.ts',
    description: 'В api.ts при retry запросе после обновления CSRF токена (строки 103-112) не проверяется статус ответа. Если retry тоже неудачен, ошибка не обрабатывается.',
    severity: 'medium',
    category: 'bug',
    file: 'src/api.ts',
    line: '103-112',
    impact: 'При повторной ошибке пользователь не получает понятное сообщение об ошибке.',
    recommendation: 'Проверять статус retry ответа и возвращать ошибку.',
    codeExample: `if (response.status === 403 && data.error?.code === 'CSRF_TOKEN_INVALID') {
  csrfToken = null;
  const newToken = await fetchCsrfToken();
  if (newToken) {
    (headers as Record<string, string>)['X-CSRF-Token'] = newToken;
    const retryResponse = await fetch(url, { ...options, headers });
    const retryData = await retryResponse.json();
    
    // Проверяем статус retry
    if (!retryResponse.ok) {
      return {
        success: false,
        error: retryData.error || {
          code: 'RETRY_FAILED',
          message: 'Повторный запрос не удался',
        },
      };
    }
    return retryData;
  }
}`,
  },

  {
    id: 'BUG-003',
    title: 'CSRF токен теряется при перезагрузке',
    description: 'В api.ts CSRF токен хранится в переменной модуля (строка 36). При перезагрузке страницы токен теряется, и первый запрос может упасть.',
    severity: 'medium',
    category: 'bug',
    file: 'src/api.ts',
    line: '36',
    impact: 'После перезагрузки страницы первый mutating запрос может получить ошибку 403.',
    recommendation: 'Получать CSRF токен при инициализации приложения или хранить в sessionStorage.',
    codeExample: `// Вариант 1: Получать токен при старте
export async function initApi() {
  await fetchCsrfToken();
}

// В main.tsx:
await initApi();
ReactDOM.createRoot(...).render(...);

// Вариант 2: Хранить в sessionStorage
let csrfToken = sessionStorage.getItem('csrf_token');

async function fetchCsrfToken() {
  // ...
  if (token) {
    csrfToken = token;
    sessionStorage.setItem('csrf_token', token);
  }
}`,
  },

  {
    id: 'BUG-004',
    title: 'setTimeout в handleParse не отменяется',
    description: 'В appStore.ts функция handleParse использует setTimeout (строка 103), но не отменяет таймер при размонтировании компонента.',
    severity: 'low',
    category: 'bug',
    file: 'src/store/appStore.ts',
    line: '103',
    impact: 'Если пользователь быстро покинет страницу, setTimeout всё равно выполнится и может вызвать ошибки.',
    recommendation: 'Сохранять ID таймера и отменять его при необходимости.',
    codeExample: `let parseTimeout: NodeJS.Timeout | null = null;

handleParse: () => {
  set({ isParsing: true, parseResult: null, error: null });
  
  parseTimeout = setTimeout(() => {
    try {
      // ... логика парсинга
    } catch (error) {
      // ... обработка ошибок
    }
  }, 2000);
},

// Добавить метод отмены:
cancelParse: () => {
  if (parseTimeout) {
    clearTimeout(parseTimeout);
    parseTimeout = null;
    set({ isParsing: false });
  }
}`,
  },

  {
    id: 'CODE-005',
    title: 'WebSocket хук не интегрирован',
    description: 'Хук useWebSocket.ts создан, но не используется в приложении. Реалтайм-обновления не работают.',
    severity: 'medium',
    category: 'architecture',
    file: 'src/hooks/useWebSocket.ts',
    impact: 'Пользователь не видит новые посты без ручного обновления страницы.',
    recommendation: 'Интегрировать WebSocket в appStore для получения уведомлений о новых постах.',
  },

  {
    id: 'UX-001',
    title: 'Нет индикатора загрузки при loadData',
    description: 'При вызове loadData() в appStore устанавливается isLoading: true, но компоненты не отображают индикатор загрузки.',
    severity: 'medium',
    category: 'ux',
    file: 'src/store/appStore.ts',
    impact: 'Пользователь не видит, что данные загружаются. Интерфейс может казаться зависшим.',
    recommendation: 'Добавить отображение loading-состояния в контейнерах.',
    codeExample: `// В DashboardContainer.tsx:
const { channels, posts, sites, webPosts, isLoading } = useAppStore();

if (isLoading) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}`,
  },

  {
    id: 'TEST-001',
    title: 'Нет тестов для новых модулей',
    description: 'Новые модули (appStore.ts, transformers.ts, hashCode.ts, useDebounce.ts) не покрыты тестами.',
    severity: 'medium',
    category: 'testing',
    file: 'src/store/appStore.ts, src/utils/transformers.ts, src/utils/hashCode.ts, src/hooks/useDebounce.ts',
    impact: 'Регрессии в критических модулях могут остаться незамеченными.',
    recommendation: 'Добавить unit-тесты для всех новых модулей.',
  },

  {
    id: 'TEST-002',
    title: 'Нет E2E тестов',
    description: 'Отсутствуют E2E тесты для критических пользовательских сценариев (добавление канала, парсинг, публикация).',
    severity: 'medium',
    category: 'testing',
    file: 'e2e/',
    impact: 'Регрессии в пользовательских сценариях могут остаться незамеченными до production.',
    recommendation: 'Добавить Playwright или Cypress для E2E тестирования.',
  },

  {
    id: 'BACK-001',
    title: 'Нет Swagger документации',
    description: 'Backend не имеет автоматической API документации.',
    severity: 'low',
    category: 'code-quality',
    file: 'backend/src/index.ts',
    impact: 'Затрудняет интеграцию с фронтендом и внешними сервисами.',
    recommendation: 'Добавить swagger-ui-express и генерацию документации из Zod-схем.',
  },

  {
    id: 'CODE-006',
    title: 'Нет ESLint и Prettier конфигурации',
    description: 'В package.json есть скрипты lint и format, но нет конфигурационных файлов .eslintrc и .prettierrc.',
    severity: 'low',
    category: 'code-quality',
    file: 'package.json',
    impact: 'Линтинг и форматирование не работают. Код может иметь несогласованный стиль.',
    recommendation: 'Добавить .eslintrc.js и .prettierrc с правилами для React/TypeScript.',
  },

  {
    id: 'UX-002',
    title: 'Нет Dark Mode в компонентах',
    description: 'index.html содержит стили для dark/light тем, но компоненты не используют dark: классы Tailwind.',
    severity: 'medium',
    category: 'ux',
    file: 'src/components/',
    impact: 'Переключение темы не работает. Пользователи не могут использовать тёмную тему.',
    recommendation: 'Добавить dark: варианты для всех компонентов.',
  },

  {
    id: 'PERF-004',
    title: 'Нет кеширования Redis',
    description: 'Redis упомянут в конфиге, но не используется. Все запросы идут напрямую в БД.',
    severity: 'low',
    category: 'performance',
    file: 'backend/src/config.ts',
    line: '34-37',
    impact: 'Излишняя нагрузка на БД при частых запросах.',
    recommendation: 'Реализовать кеширование часто запрашиваемых данных.',
  },
];

const severityConfig: Record<Severity, { label: string; color: string; bg: string }> = {
  critical: { label: 'Критический', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
  high: { label: 'Высокий', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
  medium: { label: 'Средний', color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
  low: { label: 'Низкий', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
};

const categoryConfig: Record<Category, { label: string; icon: string; color: string }> = {
  bug: { label: 'Баги', icon: 'fa-bug', color: 'text-red-600' },
  security: { label: 'Безопасность', icon: 'fa-shield-alt', color: 'text-red-600' },
  performance: { label: 'Производительность', icon: 'fa-tachometer-alt', color: 'text-green-600' },
  architecture: { label: 'Архитектура', icon: 'fa-sitemap', color: 'text-purple-600' },
  testing: { label: 'Тестирование', icon: 'fa-vial', color: 'text-teal-600' },
  'code-quality': { label: 'Качество кода', icon: 'fa-code', color: 'text-indigo-600' },
  ux: { label: 'UX/UI', icon: 'fa-paint-brush', color: 'text-blue-600' },
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
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <i className="fas fa-clipboard-list text-white text-xl"></i>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Повторный анализ кода</h1>
                <p className="text-sm text-gray-500">Полный список ошибок • {new Date().toLocaleDateString('ru-RU')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                {stats.total} ошибок
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🔴</span>
              </div>
              <div>
                <p className="text-3xl font-bold text-red-600">{stats.critical}</p>
                <p className="text-xs text-gray-500 font-medium">Критических</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🟠</span>
              </div>
              <div>
                <p className="text-3xl font-bold text-orange-600">{stats.high}</p>
                <p className="text-xs text-gray-500 font-medium">Высоких</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🟡</span>
              </div>
              <div>
                <p className="text-3xl font-bold text-yellow-600">{stats.medium}</p>
                <p className="text-xs text-gray-500 font-medium">Средних</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🔵</span>
              </div>
              <div>
                <p className="text-3xl font-bold text-blue-600">{stats.low}</p>
                <p className="text-xs text-gray-500 font-medium">Низких</p>
              </div>
            </div>
          </div>
        </div>

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

        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Поиск по ошибкам..."
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
        </div>

        <div className="space-y-3">
          {filteredIssues.map(issue => {
            const sevConfig = severityConfig[issue.severity];
            const catConfig = categoryConfig[issue.category];
            const isExpanded = expandedIssue === issue.id;

            return (
              <div
                key={issue.id}
                className={`bg-white rounded-xl border transition-all ${
                  isExpanded ? 'border-blue-300 shadow-lg' : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                <button
                  onClick={() => setExpandedIssue(isExpanded ? null : issue.id)}
                  className="w-full p-4 sm:p-5 text-left"
                >
                  <div className="flex items-start gap-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${sevConfig.bg} ${sevConfig.color} flex-shrink-0`}>
                      {issue.id}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{issue.title}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span className={`inline-flex items-center gap-1 text-xs ${catConfig.color}`}>
                          <i className={`fas ${catConfig.icon}`}></i>
                          {catConfig.label}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                          <i className="fas fa-file-code"></i>
                          {issue.file}
                        </span>
                        {issue.line && (
                          <span className="text-xs text-gray-400">
                            (строка {issue.line})
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
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Описание:</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">{issue.description}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-red-700 mb-1 flex items-center gap-1">
                          <i className="fas fa-exclamation-triangle"></i> Влияние:
                        </h4>
                        <p className="text-sm text-gray-600 leading-relaxed">{issue.impact}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-green-700 mb-1 flex items-center gap-1">
                          <i className="fas fa-check-circle"></i> Рекомендация:
                        </h4>
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
            <p className="text-gray-500">Ошибки не найдены по заданным фильтрам</p>
          </div>
        )}

        <footer className="mt-8 text-center text-sm text-gray-400 pb-8">
          <p>Повторный анализ выполнен • {issues.length} ошибок найдено • {new Date().toLocaleString('ru-RU')}</p>
        </footer>
      </main>
    </div>
  );
}

export default App;
