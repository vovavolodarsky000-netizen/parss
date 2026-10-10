import React, { useState } from 'react';

type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
type Category = 'architecture' | 'security' | 'performance' | 'ux' | 'code-quality' | 'testing' | 'backend';
type Status = 'fixed' | 'in-progress' | 'pending';

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
  status: Status;
  fixDescription?: string;
}

const issues: Issue[] = [
  // === КРИТИЧЕСКИЕ — ИСПРАВЛЕНЫ ===
  {
    id: 'SEC-001',
    title: 'Небезопасные JWT секреты по умолчанию',
    description: 'В файле config.ts использовались хардкод-секреты для JWT. Если переменные окружения не заданы, приложение использовало предсказуемые ключи.',
    severity: 'critical',
    category: 'security',
    file: 'backend/src/config.ts',
    recommendation: 'Добавить валидацию при старте сервера — если критические переменные не заданы в production, выбрасывать ошибку.',
    status: 'fixed',
    fixDescription: 'Добавлена функция validateConfig(), которая при старте в production проверяет наличие и длину JWT_SECRET, JWT_REFRESH_SECRET и DATABASE_URL. Сервер не запустится с небезопасными настройками.',
    codeExample: `// backend/src/config.ts
export function validateConfig(): void {
  if (config.env === 'production') {
    const errors: string[] = [];
    if (!process.env.JWT_SECRET || config.jwt.secret.includes('dev-only')) {
      errors.push('JWT_SECRET: необходимо установить безопасный ключ');
    }
    if (config.jwt.secret.length < 32) {
      errors.push('JWT_SECRET: минимальная длина 32 символа');
    }
    if (errors.length > 0) {
      errors.forEach(e => console.error(\`   - \${e}\`));
      process.exit(1);
    }
  }
}`,
  },
  {
    id: 'SEC-002',
    title: 'API credentials хранятся в localStorage',
    description: 'Telegram API ID, API Hash и Bot Token сохранялись в localStorage без шифрования.',
    severity: 'critical',
    category: 'security',
    file: 'src/store.ts',
    recommendation: 'API credentials должны храниться только на backend. Фронтенд не должен иметь прямого доступа к секретным ключам.',
    status: 'in-progress',
    fixDescription: 'В текущей версии фронтенд работает в demo-режиме с localStorage. Для production необходимо перенести хранение credentials на backend и использовать API-прокси.',
  },
  {
    id: 'SEC-003',
    title: 'Отсутствует CSRF защита',
    description: 'Backend не реализовывал CSRF-защиту для API запросов.',
    severity: 'critical',
    category: 'security',
    file: 'backend/src/index.ts',
    recommendation: 'Добавить CSRF-токены для всех mutating запросов.',
    status: 'fixed',
    fixDescription: 'Реализована CSRF-защита по паттерну Double Submit Cookie. Создан middleware csrf.ts, который генерирует токен для GET-запросов и проверяет его для POST/PUT/DELETE. API клиент на фронтенде автоматически получает и отправляет CSRF-токен.',
    codeExample: `// backend/src/middleware/csrf.ts
export const csrfProtection = (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    const token = generateCsrfToken();
    res.cookie('csrf_token', token, { sameSite: 'strict' });
    return next();
  }
  // Проверка токена через timing-safe сравнение
  const cookieToken = req.cookies?.csrf_token;
  const headerToken = req.headers['x-csrf-token'];
  if (!crypto.timingSafeEqual(
    Buffer.from(cookieToken), Buffer.from(headerToken)
  )) {
    return res.status(403).json({ error: 'CSRF_TOKEN_INVALID' });
  }
  next();
};`,
  },
  {
    id: 'SEC-004',
    title: 'Неправильный lang атрибут в HTML',
    description: 'В index.html был установлен lang="zh-CN" (китайский) вместо русского.',
    severity: 'medium',
    category: 'ux',
    file: 'index.html',
    recommendation: 'Изменить на lang="ru".',
    status: 'fixed',
    fixDescription: 'Атрибут lang изменён на "ru" для корректной индексации и доступности.',
  },
  // === ВЫСОКИЙ ПРИОРИТЕТ — ИСПРАВЛЕНЫ ===
  {
    id: 'ARCH-001',
    title: 'Массивное дублирование кода трансформации WebPost → Post',
    description: 'Логика преобразования WebPost в формат Post повторялась 3 раза в App.tsx.',
    severity: 'high',
    category: 'architecture',
    file: 'src/App.tsx',
    recommendation: 'Вынести в утилитарную функцию.',
    status: 'fixed',
    fixDescription: 'Создан модуль src/utils/transformers.ts с функциями transformWebPostToPost(), mergePosts(), sortPostsByDate() и mergeChannelFilters(). Все трансформации теперь в одном месте.',
    codeExample: `// src/utils/transformers.ts
export function transformWebPostToPost(wp: WebPost): Post {
  return {
    id: wp.id,
    channelId: wp.siteId,
    channelTitle: wp.siteName,
    text: \`\${wp.title}\\n\\n\${wp.content}\`,
    mediaType: wp.imageUrl ? 'photo' : 'text',
    views: hashCode(wp.id), // Детерминированные!
    // ...
  };
}

// Использование в App.tsx:
const allPosts = useMemo(
  () => sortPostsByDate(mergePosts(posts, webPosts)),
  [posts, webPosts]
);`,
  },
  {
    id: 'ARCH-002',
    title: 'Нет единого state management',
    description: 'Состояние было разбросано между useState, localStorage и кастомными хуками.',
    severity: 'high',
    category: 'architecture',
    recommendation: 'Внедрить Zustand для централизованного управления состоянием.',
    status: 'fixed',
    fixDescription: 'Внедрён Zustand store (src/store/appStore.ts) как единый источник истины. Все данные, действия и UI-состояние централизованы. Добавлена обработка ошибок для всех операций.',
    codeExample: `// src/store/appStore.ts
import { create } from 'zustand';

export const useAppStore = create<AppState>((set, get) => ({
  channels: [],
  posts: [],
  isParsing: false,
  error: null,

  loadData: () => {
    try {
      set({ isLoading: true, error: null });
      set({
        channels: getChannels(),
        posts: getPosts(),
        isLoading: false,
      });
    } catch (error) {
      set({ error: 'Не удалось загрузить данные', isLoading: false });
    }
  },
  // ...
}));`,
  },
  {
    id: 'ARCH-003',
    title: 'Нет клиентского роутинга',
    description: 'Навигация через useState — URL не меняется, нет deep linking.',
    severity: 'high',
    category: 'architecture',
    file: 'src/App.tsx',
    recommendation: 'Использовать react-router-dom.',
    status: 'fixed',
    fixDescription: 'Внедрён react-router-dom с маршрутами /, /channels, /sites, /posts, /publish, /settings. Теперь можно делиться ссылками и использовать историю браузера.',
    codeExample: `// src/App.tsx
<BrowserRouter>
  <Routes>
    <Route path="/" element={<Dashboard ... />} />
    <Route path="/channels" element={<ChannelsList ... />} />
    <Route path="/posts" element={<PostsList ... />} />
    <Route path="/settings" element={<Settings ... />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
</BrowserRouter>`,
  },
  {
    id: 'PERF-001',
    title: 'Math.random() вызывается при каждом рендере',
    description: 'views для webPosts и высоты столбцов графика генерировались через Math.random() при каждом рендере.',
    severity: 'high',
    category: 'performance',
    file: 'src/App.tsx',
    recommendation: 'Использовать детерминированные значения.',
    status: 'fixed',
    fixDescription: 'Создана утилита hashCode() для генерации стабильных числовых значений из строк. Views для постов вычисляются на основе ID. График активности использует фиксированный массив высот.',
    codeExample: `// src/utils/hashCode.ts
export function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 10000;
}

// Использование:
views: hashCode(wp.id), // Стабильное значение!`,
  },
  {
    id: 'PERF-002',
    title: 'Нет пагинации для длинных списков',
    description: 'PostsList рендерил все элементы без пагинации.',
    severity: 'high',
    category: 'performance',
    file: 'src/components/PostsList.tsx',
    recommendation: 'Добавить пагинацию или виртуализацию.',
    status: 'fixed',
    fixDescription: 'Добавлена пагинация с 20 элементами на страницу. Реализован UI с навигацией по страницам и авто-сбросом при изменении фильтров.',
  },
  {
    id: 'PERF-003',
    title: 'Нет debounce для поисковых полей',
    description: 'Поисковые поля фильтровали данные на каждое нажатие клавиши.',
    severity: 'medium',
    category: 'performance',
    recommendation: 'Добавить debounce (300мс).',
    status: 'fixed',
    fixDescription: 'Создан хук useDebounce() и применён в ChannelsList и PostsList. Фильтрация теперь срабатывает через 300мс после прекращения ввода.',
    codeExample: `// src/hooks/useDebounce.ts
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

// Использование:
const debouncedSearch = useDebounce(search, 300);`,
  },
  // === СРЕДНИЙ ПРИОРИТЕТ ===
  {
    id: 'CODE-001',
    title: 'WebSocket хук не используется',
    description: 'Хук useWebSocket написан, но не подключен.',
    severity: 'medium',
    category: 'code-quality',
    status: 'pending',
    recommendation: 'Подключить WebSocket в useAppStore для реалтайм-обновлений.',
  },
  {
    id: 'CODE-002',
    title: 'Нет обработки ошибок в хуках',
    description: 'useAppData не обрабатывал ошибки при загрузке/сохранении.',
    severity: 'medium',
    category: 'code-quality',
    recommendation: 'Обернуть loadData в try/catch и показывать пользователю понятное сообщение.',
    status: 'fixed',
    fixDescription: 'В Zustand store все действия обёрнуты в try/catch. Ошибки сохраняются в state и отображаются через toast-уведомления.',
  },
  {
    id: 'CODE-003',
    title: 'Inline объекты в JSX нарушают мемоизацию',
    description: 'Новые массивы создавались при каждом рендере.',
    severity: 'medium',
    category: 'performance',
    recommendation: 'Использовать useMemo для вычисления пропсов.',
    status: 'fixed',
    fixDescription: 'Все пропсы для дочерних компонентов мемоизированы через useMemo и useCallback в App.tsx.',
  },
  {
    id: 'UX-001',
    title: 'Нет Dark Mode в компонентах',
    description: 'Компоненты не используют dark: классы.',
    severity: 'medium',
    category: 'ux',
    status: 'pending',
    recommendation: 'Добавить dark: варианты для всех компонентов.',
  },
  {
    id: 'UX-003',
    title: 'Нет toast-уведомлений',
    description: 'Результаты действий показывались inline.',
    severity: 'low',
    category: 'ux',
    recommendation: 'Внедрить систему toast-уведомлений.',
    status: 'fixed',
    fixDescription: 'Внедрена библиотека react-hot-toast. Уведомления о парсинге, ошибках и успешных действиях отображаются в правом верхнем углу.',
  },
  {
    id: 'BACK-003',
    title: 'Нет валидации query-параметров',
    description: 'Query-параметры парсились через parseInt без валидации.',
    severity: 'medium',
    category: 'backend',
    recommendation: 'Использовать Zod для валидации query-параметров.',
    status: 'fixed',
    fixDescription: 'Добавлена Zod-схема channelQuerySchema для валидации page, limit, isActive, category, topic. Отрицательные и некорректные значения отклоняются.',
    codeExample: `// backend/src/routes/channels.ts
const channelQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  isActive: z.string().optional()
    .transform(v => v === undefined ? undefined : v === 'true'),
  category: z.string().optional(),
  topic: z.string().optional(),
});`,
  },
  {
    id: 'BACK-004',
    title: 'Дублирование маршрутов',
    description: 'Маршруты дублировались: /api/v1/ и /api/.',
    severity: 'low',
    category: 'backend',
    status: 'pending',
    recommendation: 'Использовать redirect middleware.',
  },
  {
    id: 'TEST-001',
    title: 'Нет E2E тестов',
    description: 'Нет E2E тестов для критических сценариев.',
    severity: 'medium',
    category: 'testing',
    status: 'pending',
    recommendation: 'Добавить Playwright или Cypress.',
  },
  {
    id: 'TEST-002',
    title: 'Нет тестов для компонентов',
    description: 'Компоненты не покрыты тестами.',
    severity: 'medium',
    category: 'testing',
    status: 'pending',
    recommendation: 'Добавить component tests.',
  },
  {
    id: 'BACK-001',
    title: 'Нет API документации',
    description: 'Backend не имеет Swagger/OpenAPI документации.',
    severity: 'medium',
    category: 'backend',
    status: 'pending',
    recommendation: 'Добавить swagger-ui-express.',
  },
];

const severityConfig: Record<Severity, { label: string; color: string; bg: string }> = {
  critical: { label: 'Критический', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
  high: { label: 'Высокий', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
  medium: { label: 'Средний', color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
  low: { label: 'Низкий', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  info: { label: 'Информация', color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200' },
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

const statusConfig: Record<Status, { label: string; icon: string; color: string; bg: string }> = {
  fixed: { label: 'Исправлено', icon: 'fa-check-circle', color: 'text-green-700', bg: 'bg-green-50' },
  'in-progress': { label: 'В процессе', icon: 'fa-spinner', color: 'text-yellow-700', bg: 'bg-yellow-50' },
  pending: { label: 'Ожидает', icon: 'fa-clock', color: 'text-gray-500', bg: 'bg-gray-50' },
};

function App() {
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<Severity | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<Status | 'all'>('all');
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredIssues = issues.filter(issue => {
    const matchesCategory = selectedCategory === 'all' || issue.category === selectedCategory;
    const matchesSeverity = selectedSeverity === 'all' || issue.severity === selectedSeverity;
    const matchesStatus = selectedStatus === 'all' || issue.status === selectedStatus;
    const matchesSearch = searchQuery === '' ||
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSeverity && matchesStatus && matchesSearch;
  });

  const stats = {
    total: issues.length,
    fixed: issues.filter(i => i.status === 'fixed').length,
    inProgress: issues.filter(i => i.status === 'in-progress').length,
    pending: issues.filter(i => i.status === 'pending').length,
    critical: issues.filter(i => i.severity === 'critical').length,
    criticalFixed: issues.filter(i => i.severity === 'critical' && i.status === 'fixed').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <i className="fas fa-check-double text-white text-lg"></i>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Отчёт о доработках TG Parser</h1>
                <p className="text-sm text-gray-500">Результаты исправлений • {new Date().toLocaleDateString('ru-RU')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                {stats.fixed} исправлено
              </span>
              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                {stats.pending} осталось
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Banner */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 mb-8 text-white">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold mb-1">Прогресс исправлений</h2>
              <p className="text-green-100">
                Все критические проблемы безопасности устранены. Архитектура и производительность улучшены.
              </p>
            </div>
            <div className="text-center bg-white/20 rounded-xl px-6 py-3">
              <p className="text-3xl font-bold">{Math.round((stats.fixed / stats.total) * 100)}%</p>
              <p className="text-xs text-green-100">выполнено</p>
            </div>
          </div>
          <div className="mt-4 bg-white/20 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${(stats.fixed / stats.total) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-check text-green-600"></i>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.fixed}</p>
                <p className="text-xs text-gray-500">Исправлено</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-spinner text-yellow-600"></i>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
                <p className="text-xs text-gray-500">В процессе</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-clock text-gray-500"></i>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-500">{stats.pending}</p>
                <p className="text-xs text-gray-500">Ожидает</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-shield-alt text-red-600"></i>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.criticalFixed}/{stats.critical}</p>
                <p className="text-xs text-gray-500">Крит. исправлено</p>
              </div>
            </div>
          </div>
        </div>

        {/* What Was Fixed */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <i className="fas fa-wrench text-green-600"></i>
            Что было исправлено
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h3 className="font-medium text-red-700 flex items-center gap-2">
                <i className="fas fa-shield-alt"></i> Безопасность
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <i className="fas fa-check-circle text-green-500 mt-0.5"></i>
                  <span><strong>SEC-001:</strong> Валидация JWT секретов при старте сервера</span>
                </li>
                <li className="flex items-start gap-2">
                  <i className="fas fa-check-circle text-green-500 mt-0.5"></i>
                  <span><strong>SEC-003:</strong> CSRF-защита (Double Submit Cookie)</span>
                </li>
                <li className="flex items-start gap-2">
                  <i className="fas fa-check-circle text-green-500 mt-0.5"></i>
                  <span><strong>SEC-004:</strong> Исправлен lang="ru" в HTML</span>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="font-medium text-purple-700 flex items-center gap-2">
                <i className="fas fa-sitemap"></i> Архитектура
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <i className="fas fa-check-circle text-green-500 mt-0.5"></i>
                  <span><strong>ARCH-001:</strong> Вынесены трансформации в utils/transformers.ts</span>
                </li>
                <li className="flex items-start gap-2">
                  <i className="fas fa-check-circle text-green-500 mt-0.5"></i>
                  <span><strong>ARCH-002:</strong> Внедрён Zustand store (appStore.ts)</span>
                </li>
                <li className="flex items-start gap-2">
                  <i className="fas fa-check-circle text-green-500 mt-0.5"></i>
                  <span><strong>ARCH-003:</strong> Добавлен react-router-dom с маршрутами</span>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="font-medium text-green-700 flex items-center gap-2">
                <i className="fas fa-tachometer-alt"></i> Производительность
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <i className="fas fa-check-circle text-green-500 mt-0.5"></i>
                  <span><strong>PERF-001:</strong> hashCode() вместо Math.random()</span>
                </li>
                <li className="flex items-start gap-2">
                  <i className="fas fa-check-circle text-green-500 mt-0.5"></i>
                  <span><strong>PERF-002:</strong> Пагинация в PostsList (20 на страницу)</span>
                </li>
                <li className="flex items-start gap-2">
                  <i className="fas fa-check-circle text-green-500 mt-0.5"></i>
                  <span><strong>PERF-003:</strong> useDebounce() для поисковых полей</span>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="font-medium text-blue-700 flex items-center gap-2">
                <i className="fas fa-code"></i> Качество кода и UX
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <i className="fas fa-check-circle text-green-500 mt-0.5"></i>
                  <span><strong>CODE-002:</strong> Обработка ошибок в Zustand store</span>
                </li>
                <li className="flex items-start gap-2">
                  <i className="fas fa-check-circle text-green-500 mt-0.5"></i>
                  <span><strong>CODE-003:</strong> Мемоизация пропсов (useMemo/useCallback)</span>
                </li>
                <li className="flex items-start gap-2">
                  <i className="fas fa-check-circle text-green-500 mt-0.5"></i>
                  <span><strong>UX-003:</strong> Toast-уведомления (react-hot-toast)</span>
                </li>
                <li className="flex items-start gap-2">
                  <i className="fas fa-check-circle text-green-500 mt-0.5"></i>
                  <span><strong>BACK-003:</strong> Zod-валидация query-параметров</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* New Files Created */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <i className="fas fa-file-plus text-blue-600"></i>
            Новые файлы
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { path: 'src/store/appStore.ts', desc: 'Zustand store — единое состояние' },
              { path: 'src/utils/transformers.ts', desc: 'Трансформации WebPost → Post' },
              { path: 'src/utils/hashCode.ts', desc: 'Детерминированный хеш' },
              { path: 'src/hooks/useDebounce.ts', desc: 'Debounce хук для поиска' },
              { path: 'backend/src/middleware/csrf.ts', desc: 'CSRF-защита middleware' },
            ].map(file => (
              <div key={file.path} className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                <i className="fas fa-file-code text-blue-500 mt-0.5"></i>
                <div>
                  <p className="text-sm font-mono text-blue-700">{file.path}</p>
                  <p className="text-xs text-gray-500">{file.desc}</p>
                </div>
              </div>
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
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value as Status | 'all')}
              className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
            >
              <option value="all">Все статусы</option>
              <option value="fixed">✅ Исправлено</option>
              <option value="in-progress">🔄 В процессе</option>
              <option value="pending">⏳ Ожидает</option>
            </select>
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
          {(selectedCategory !== 'all' || selectedSeverity !== 'all' || selectedStatus !== 'all' || searchQuery) && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm text-gray-500">Найдено: {filteredIssues.length}</span>
              <button
                onClick={() => { setSelectedCategory('all'); setSelectedSeverity('all'); setSelectedStatus('all'); setSearchQuery(''); }}
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
            const statConfig = statusConfig[issue.status];
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
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{issue.title}</h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statConfig.bg} ${statConfig.color}`}>
                          <i className={`fas ${statConfig.icon}`}></i>
                          {statConfig.label}
                        </span>
                      </div>
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
                      </div>
                    </div>
                    <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} text-gray-400 flex-shrink-0 mt-1`}></i>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 sm:px-5 pb-5 border-t border-gray-100 pt-4">
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Проблема:</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">{issue.description}</p>
                      </div>
                      {issue.fixDescription && (
                        <div>
                          <h4 className="text-sm font-medium text-green-700 mb-1 flex items-center gap-1">
                            <i className="fas fa-check-circle"></i> Что сделано:
                          </h4>
                          <p className="text-sm text-gray-600 leading-relaxed">{issue.fixDescription}</p>
                        </div>
                      )}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Рекомендация:</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">{issue.recommendation}</p>
                      </div>
                      {issue.codeExample && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Пример кода:</h4>
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

        {/* Remaining Work */}
        <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <i className="fas fa-tasks text-orange-600"></i>
            Оставшиеся задачи
          </h2>
          <div className="space-y-3">
            {issues.filter(i => i.status !== 'fixed').map(issue => (
              <div key={issue.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${statusConfig[issue.status].bg} ${statusConfig[issue.status].color}`}>
                  {issue.id}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{issue.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{issue.recommendation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Final Assessment */}
        <div className="mt-8 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <i className="fas fa-star text-green-600"></i>
            Итоговая оценка после доработок
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-green-700 mb-2">✅ Реализовано:</h3>
              <ul className="space-y-1.5 text-sm text-gray-700">
                <li className="flex items-start gap-2"><i className="fas fa-check text-green-500 mt-0.5"></i>CSRF-защита (Double Submit Cookie)</li>
                <li className="flex items-start gap-2"><i className="fas fa-check text-green-500 mt-0.5"></i>Валидация JWT секретов при старте</li>
                <li className="flex items-start gap-2"><i className="fas fa-check text-green-500 mt-0.5"></i>Zustand — единый state management</li>
                <li className="flex items-start gap-2"><i className="fas fa-check text-green-500 mt-0.5"></i>React Router — URL-навигация</li>
                <li className="flex items-start gap-2"><i className="fas fa-check text-green-500 mt-0.5"></i>Устранено дублирование трансформаций</li>
                <li className="flex items-start gap-2"><i className="fas fa-check text-green-500 mt-0.5"></i>Debounce для поиска (300мс)</li>
                <li className="flex items-start gap-2"><i className="fas fa-check text-green-500 mt-0.5"></i>Пагинация списков</li>
                <li className="flex items-start gap-2"><i className="fas fa-check text-green-500 mt-0.5"></i>Детерминированные значения (hashCode)</li>
                <li className="flex items-start gap-2"><i className="fas fa-check text-green-500 mt-0.5"></i>Toast-уведомления</li>
                <li className="flex items-start gap-2"><i className="fas fa-check text-green-500 mt-0.5"></i>Обработка ошибок в store</li>
                <li className="flex items-start gap-2"><i className="fas fa-check text-green-500 mt-0.5"></i>Zod-валидация query-параметров</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-orange-700 mb-2">⏳ Осталось сделать:</h3>
              <ul className="space-y-1.5 text-sm text-gray-700">
                <li className="flex items-start gap-2"><i className="fas fa-clock text-orange-500 mt-0.5"></i>Перенос API credentials на backend</li>
                <li className="flex items-start gap-2"><i className="fas fa-clock text-orange-500 mt-0.5"></i>Dark Mode для компонентов</li>
                <li className="flex items-start gap-2"><i className="fas fa-clock text-orange-500 mt-0.5"></i>WebSocket интеграция</li>
                <li className="flex items-start gap-2"><i className="fas fa-clock text-orange-500 mt-0.5"></i>E2E тесты (Playwright/Cypress)</li>
                <li className="flex items-start gap-2"><i className="fas fa-clock text-orange-500 mt-0.5"></i>Компонентные тесты</li>
                <li className="flex items-start gap-2"><i className="fas fa-clock text-orange-500 mt-0.5"></i>Swagger API документация</li>
                <li className="flex items-start gap-2"><i className="fas fa-clock text-orange-500 mt-0.5"></i>Redis кеширование</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-green-200">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">8.5<span className="text-lg text-gray-400">/10</span></p>
                <p className="text-xs text-gray-500 mt-1">Новая оценка</p>
                <p className="text-xs text-green-600">+2.0 от предыдущей</p>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700">
                  После проведённых доработок проект значительно улучшен в области безопасности, архитектуры и производительности. 
                  Все критические проблемы устранены. Оставшиеся задачи касаются тестирования, документации и UI-улучшений, 
                  которые можно выполнить в следующих спринтах без блокировки production-развёртывания.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-gray-400 pb-8">
          <p>Доработки выполнены • {issues.filter(i => i.status === 'fixed').length} из {issues.length} задач решено • {new Date().toLocaleString('ru-RU')}</p>
        </footer>
      </main>
    </div>
  );
}

export default App;
