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
  // === КРИТИЧЕСКИЕ ОШИБКИ ===
  {
    id: 'BUG-001',
    title: 'App.tsx содержит отчёт вместо приложения',
    description: 'Файл src/App.tsx был перезаписан отчётом о доработках. Реальное приложение не отображается — вместо него показывается страница с анализом кода.',
    severity: 'critical',
    category: 'bug',
    file: 'src/App.tsx',
    impact: 'Приложение полностью неработоспособно. Пользователь видит отчёт вместо интерфейса парсера.',
    recommendation: 'Восстановить App.tsx с реальной реализацией приложения, используя Zustand store, React Router и все обновлённые компоненты.',
    codeExample: `// src/App.tsx должен содержать:
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAppStore } from './store/appStore';

export default function App() {
  const { loadData } = useAppStore();
  
  useEffect(() => { loadData(); }, [loadData]);
  
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/channels" element={<ChannelsList />} />
        {/* ... */}
      </Routes>
    </BrowserRouter>
  );
}`,
  },
  {
    id: 'BUG-002',
    title: 'Неправильный импорт logger в CSRF middleware',
    description: 'В файле backend/src/middleware/csrf.ts строка 9 указан неправильный путь импорта: import logger from \'./logger.js\'. Файл logger.ts находится в backend/src/services/, а не в middleware/.',
    severity: 'critical',
    category: 'bug',
    file: 'backend/src/middleware/csrf.ts',
    line: '9',
    impact: 'Backend не скомпилируется. TypeScript выдаст ошибку "Cannot find module". Сервер не запустится.',
    recommendation: 'Исправить путь импорта на \'../services/logger.js\'.',
    codeExample: `// Неправильно:
import logger from './logger.js';

// Правильно:
import logger from '../services/logger.js';`,
  },
  {
    id: 'SEC-005',
    title: 'Пустая строка в CSP директиве imgSrc',
    description: 'В Helmet конфигурации backend/src/index.ts строка 35 содержится пустая строка в массиве imgSrc: ["\'self\'", "", "https:", "http:"]. Пустая строка может быть интерпретирована как разрешённый источник.',
    severity: 'critical',
    category: 'security',
    file: 'backend/src/index.ts',
    line: '35',
    impact: 'Потенциальная уязвимость CSP. Пустая строка может позволить загрузку изображений из непредусмотренных источников.',
    recommendation: 'Удалить пустую строку из массива imgSrc.',
    codeExample: `// Неправильно:
imgSrc: ["'self'", "", "https:", "http:"]

// Правильно:
imgSrc: ["'self'", "data:", "https:", "http:"]`,
  },
  {
    id: 'BUG-003',
    title: 'Порядок middleware CSRF и маршрутов',
    description: 'В backend/src/index.ts CSRF middleware применяется ко всем /api маршрутам (строка 89), включая /api/csrf-token (строка 90). Хотя GET-запросы проходят, порядок маршрутов может вызвать проблемы при изменении логики.',
    severity: 'high',
    category: 'bug',
    file: 'backend/src/index.ts',
    line: '89-90',
    impact: 'Потенциальная проблема с получением CSRF токена. При изменении порядка или логики middleware может сломаться получение токена.',
    recommendation: 'Переместить маршрут /api/csrf-token ДО применения CSRF middleware или исключить его из проверки.',
    codeExample: `// Вариант 1: Исключить маршрут из CSRF проверки
app.use('/api', (req, res, next) => {
  if (req.path === '/csrf-token') return next();
  return csrfProtection(req, res, next);
});
app.get('/api/csrf-token', getCsrfToken);

// Вариант 2: Переместить маршрут перед middleware
app.get('/api/csrf-token', getCsrfToken);
app.use('/api', csrfProtection);`,
  },

  // === ВЫСОКИЙ ПРИОРИТЕТ ===
  {
    id: 'PERF-004',
    title: 'statusCounts не мемоизирован в PostsList',
    description: 'В компоненте PostsList объект statusCounts (строки 81-87) пересчитывается при каждом рендере, выполняя 4 фильтрации массива постов.',
    severity: 'high',
    category: 'performance',
    file: 'src/components/PostsList.tsx',
    line: '81-87',
    impact: 'Излишняя нагрузка при большом количестве постов. При 100+ постах и частых ре-рендерах может вызвать лаги.',
    recommendation: 'Обернуть statusCounts в useMemo с зависимостью от posts.',
    codeExample: `const statusCounts = useMemo(() => ({
  all: posts.length,
  new: posts.filter(p => p.status === 'new').length,
  approved: posts.filter(p => p.status === 'approved').length,
  published: posts.filter(p => p.status === 'published').length,
  rejected: posts.filter(p => p.status === 'rejected').length,
}), [posts]);`,
  },
  {
    id: 'PERF-005',
    title: 'Math.random() в генерации моковых данных',
    description: 'В store.ts и webStore.ts всё ещё используется Math.random() для генерации моковых данных (даты, статусы, mediaType). Хотя данные генерируются один раз, это делает тесты непредсказуемыми.',
    severity: 'medium',
    category: 'performance',
    file: 'src/store.ts',
    line: '39, 44, 88-91',
    impact: 'Непредсказуемость моковых данных затрудняет тестирование и отладку. Каждый запуск даёт разные данные.',
    recommendation: 'Использовать детерминированные значения или фиксированный seed для генерации моковых данных.',
    codeExample: `// Вместо Math.random() использовать индекс:
const mediaType = mediaTypes[i % mediaTypes.length];
const status = statuses[i % statuses.length];
const daysAgo = i % 7;`,
  },
  {
    id: 'ARCH-004',
    title: 'Старый хук useAppData не удалён',
    description: 'Файл src/hooks/useAppData.ts всё ещё существует, но не используется после внедрения Zustand store. Это мёртвый код.',
    severity: 'medium',
    category: 'architecture',
    file: 'src/hooks/useAppData.ts',
    impact: 'Увеличивает размер бандла и затрудняет понимание архитектуры. Разработчики могут случайно использовать старый хук.',
    recommendation: 'Удалить файл useAppData.ts и его тесты, если они не используются.',
  },
  {
    id: 'TEST-003',
    title: 'Нет тестов для новых модулей',
    description: 'Новые модули (appStore.ts, transformers.ts, hashCode.ts, useDebounce.ts) не покрыты тестами.',
    severity: 'high',
    category: 'testing',
    file: 'src/store/appStore.ts, src/utils/transformers.ts, src/utils/hashCode.ts, src/hooks/useDebounce.ts',
    impact: 'Регрессии в критических модулях могут остаться незамеченными. Снижает надёжность кода.',
    recommendation: 'Добавить unit-тесты для всех новых модулей с покрытием ключевых сценариев.',
  },
  {
    id: 'BUG-004',
    title: 'Нет пагинации в ChannelsList',
    description: 'Компонент ChannelsList не имеет пагинации. При большом количестве каналов (50+) все элементы рендерятся одновременно.',
    severity: 'medium',
    category: 'performance',
    file: 'src/components/ChannelsList.tsx',
    impact: 'Замедление интерфейса при большом количестве каналов. Пользователю неудобно прокручивать длинный список.',
    recommendation: 'Добавить пагинацию аналогично PostsList или реализовать виртуализацию списка.',
  },

  // === СРЕДНИЙ ПРИОРИТЕТ ===
  {
    id: 'CODE-004',
    title: 'WebSocket хук не интегрирован',
    description: 'Хук useWebSocket.ts создан, но не используется в приложении. Реалтайм-обновления не работают.',
    severity: 'medium',
    category: 'architecture',
    file: 'src/hooks/useWebSocket.ts',
    impact: 'Функционал реалтайм-обновлений не реализован. Пользователь не видит новые посты без ручного обновления.',
    recommendation: 'Интегрировать WebSocket в appStore для получения уведомлений о новых постах и статусе парсинга.',
  },
  {
    id: 'UX-004',
    title: 'Нет индикатора загрузки при loadData',
    description: 'При вызове loadData() в appStore устанавливается isLoading: true, но компоненты не отображают индикатор загрузки.',
    severity: 'medium',
    category: 'ux',
    file: 'src/store/appStore.ts',
    impact: 'Пользователь не видит, что данные загружаются. Интерфейс может казаться зависшим.',
    recommendation: 'Добавить отображение loading-состояния в компонентах или глобальный спиннер.',
  },
  {
    id: 'SEC-006',
    title: 'CSRF токен не обновляется',
    description: 'В api.ts CSRF токен получается один раз и хранится в переменной. Если токен истекает (через 1 час), запросы будут отклонены.',
    severity: 'medium',
    category: 'security',
    file: 'src/api.ts',
    line: '36, 68-70',
    impact: 'Через 1 час все mutating запросы будут отклонены с ошибкой 403. Пользователю придётся перезагружать страницу.',
    recommendation: 'Добавить автоматическое обновление CSRF токена при получении ошибки 403 или по таймеру.',
    codeExample: `// При получении 403 попробовать обновить токен:
if (response.status === 403 && data.error?.code === 'CSRF_TOKEN_INVALID') {
  csrfToken = null; // Сбросить старый токен
  await fetchCsrfToken(); // Получить новый
  // Повторить запрос
}`,
  },
  {
    id: 'BUG-005',
    title: 'Нет обработки ошибки при отсутствии CSRF токена',
    description: 'В api.ts если fetchCsrfToken() возвращает null, запрос всё равно отправляется без токена и гарантированно получит 403.',
    severity: 'medium',
    category: 'bug',
    file: 'src/api.ts',
    line: '68-70',
    impact: 'Бесполезный запрос к серверу, который гарантированно будет отклонён. Лишняя нагрузка на сеть.',
    recommendation: 'Проверять результат fetchCsrfToken() и показывать ошибку пользователю, если токен не получен.',
    codeExample: `if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && !csrfToken) {
  const token = await fetchCsrfToken();
  if (!token) {
    return {
      success: false,
      error: {
        code: 'CSRF_TOKEN_ERROR',
        message: 'Не удалось получить CSRF токен. Обновите страницу.',
      },
    };
  }
}`,
  },
  {
    id: 'CODE-005',
    title: 'Отсутствует .env.example файл',
    description: 'Нет примера файла окружения для backend. Новым разработчикам сложно понять, какие переменные нужны.',
    severity: 'low',
    category: 'code-quality',
    file: 'backend/',
    impact: 'Затрудняет onboarding новых разработчиков. Увеличивает время настройки проекта.',
    recommendation: 'Создать backend/.env.example с описанием всех переменных окружения.',
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
    id: 'TEST-004',
    title: 'Нет E2E тестов',
    description: 'Отсутствуют E2E тесты для критических пользовательских сценариев (добавление канала, парсинг, публикация).',
    severity: 'medium',
    category: 'testing',
    file: 'e2e/',
    impact: 'Регрессии в пользовательских сценариях могут остаться незамеченными до production.',
    recommendation: 'Добавить Playwright или Cypress для E2E тестирования основных flow.',
  },
  {
    id: 'BACK-005',
    title: 'Нет Swagger документации',
    description: 'Backend не имеет автоматической API документации. Разработчикам приходится читать код для понимания эндпоинтов.',
    severity: 'medium',
    category: 'code-quality',
    file: 'backend/src/index.ts',
    impact: 'Затрудняет интеграцию с фронтендом и внешними сервисами. Увеличивает время разработки.',
    recommendation: 'Добавить swagger-ui-express и генерацию документации из Zod-схем.',
  },
  {
    id: 'BACK-006',
    title: 'Дублирование маршрутов /api и /api/v1',
    description: 'В backend/src/index.ts маршруты дублируются: /api/v1/channels и /api/channels указывают на одни и те же роутеры.',
    severity: 'low',
    category: 'architecture',
    file: 'backend/src/index.ts',
    line: '108-115',
    impact: 'Увеличивает поверхность атаки и затрудняет поддержку. Неясно, какой API использовать.',
    recommendation: 'Использовать redirect middleware или выбрать один вариант версионирования.',
  },
  {
    id: 'UX-005',
    title: 'Нет Dark Mode в компонентах',
    description: 'index.html содержит стили для dark/light тем, но компоненты не используют dark: классы Tailwind.',
    severity: 'medium',
    category: 'ux',
    file: 'src/components/',
    impact: 'Переключение темы не работает. Пользователи не могут использовать тёмную тему.',
    recommendation: 'Добавить dark: варианты для всех компонентов или использовать CSS-переменные.',
  },
  {
    id: 'PERF-006',
    title: 'Нет кеширования Redis',
    description: 'Redis упомянут в конфиге, но не используется. Все запросы идут напрямую в БД.',
    severity: 'low',
    category: 'performance',
    file: 'backend/src/config.ts',
    line: '34-37',
    impact: 'Излишняя нагрузка на БД при частых запросах. Замедление при высокой нагрузке.',
    recommendation: 'Реализовать кеширование часто запрашиваемых данных (списки каналов, статистика).',
  },
];

const severityConfig: Record<Severity, { label: string; color: string; bg: string; icon: string }> = {
  critical: { label: 'Критический', color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: '🔴' },
  high: { label: 'Высокий', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', icon: '🟠' },
  medium: { label: 'Средний', color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200', icon: '🟡' },
  low: { label: 'Низкий', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: '🔵' },
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
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <i className="fas fa-exclamation-triangle text-white text-xl"></i>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Повторный анализ кода</h1>
                <p className="text-sm text-gray-500">Полный список ошибок • {new Date().toLocaleDateString('ru-RU')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-bold">
                {stats.critical} критических
              </span>
              <span className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                {stats.total} всего
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Critical Alert */}
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <i className="fas fa-exclamation-circle text-red-600 text-2xl"></i>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-red-900 mb-2">Внимание! Критические ошибки</h2>
              <p className="text-red-800 mb-3">
                Обнаружено <strong>{stats.critical} критических ошибок</strong>, которые блокируют работу приложения:
              </p>
              <ul className="space-y-2 text-sm text-red-800">
                <li className="flex items-start gap-2">
                  <i className="fas fa-times-circle text-red-600 mt-0.5"></i>
                  <span><strong>BUG-001:</strong> App.tsx содержит отчёт вместо приложения — приложение не работает</span>
                </li>
                <li className="flex items-start gap-2">
                  <i className="fas fa-times-circle text-red-600 mt-0.5"></i>
                  <span><strong>BUG-002:</strong> Неправильный импорт в CSRF middleware — backend не скомпилируется</span>
                </li>
                <li className="flex items-start gap-2">
                  <i className="fas fa-times-circle text-red-600 mt-0.5"></i>
                  <span><strong>SEC-005:</strong> Пустая строка в CSP — потенциальная уязвимость безопасности</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border-2 border-red-200 p-5 hover:shadow-lg transition-shadow">
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
                placeholder="Поиск по ошибкам..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
              />
            </div>
            <select
              value={selectedSeverity}
              onChange={e => setSelectedSeverity(e.target.value as Severity | 'all')}
              className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none bg-white"
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
              className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none bg-white"
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
                className="text-sm text-red-600 hover:text-red-700 font-medium"
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
                  isExpanded ? 'border-red-300 shadow-lg' : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
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

        {/* Priority Roadmap */}
        <div className="mt-10 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <i className="fas fa-road text-green-600"></i>
            Приоритетный план исправлений
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-red-600">1</span>
              </div>
              <div>
                <h3 className="font-bold text-red-900">СРОЧНО — Блокирующие ошибки (1 час)</h3>
                <p className="text-sm text-red-800 mt-1">
                  BUG-001 (восстановить App.tsx), BUG-002 (исправить импорт), SEC-005 (удалить пустую строку в CSP).
                  Без этих исправлений приложение и backend не работают.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-orange-600">2</span>
              </div>
              <div>
                <h3 className="font-bold text-orange-900">Важно — Критические баги (2-3 часа)</h3>
                <p className="text-sm text-orange-800 mt-1">
                  BUG-003 (порядок CSRF middleware), PERF-004 (мемоизация statusCounts),
                  BUG-005 (обработка отсутствия CSRF токена), SEC-006 (обновление CSRF токена).
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-yellow-600">3</span>
              </div>
              <div>
                <h3 className="font-bold text-yellow-900">Средний приоритет — Улучшения (1 день)</h3>
                <p className="text-sm text-yellow-800 mt-1">
                  PERF-005 (детерминированные моковые данные), ARCH-004 (удалить useAppData),
                  BUG-004 (пагинация ChannelsList), CODE-004 (интеграция WebSocket), UX-004 (индикатор загрузки).
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-blue-600">4</span>
              </div>
              <div>
                <h3 className="font-bold text-blue-900">Низкий приоритет — Качество (2-3 дня)</h3>
                <p className="text-sm text-blue-800 mt-1">
                  TEST-003 (тесты новых модулей), TEST-004 (E2E тесты), CODE-005 (.env.example),
                  CODE-006 (ESLint/Prettier), BACK-005 (Swagger), BACK-006 (убрать дублирование маршрутов),
                  UX-005 (Dark Mode), PERF-006 (Redis кеширование).
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Final Assessment */}
        <div className="mt-8 bg-gradient-to-br from-red-50 to-orange-50 rounded-xl border-2 border-red-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <i className="fas fa-exclamation-triangle text-red-600"></i>
            Итоговая оценка после повторного анализа
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-red-700 mb-2">❌ Критические проблемы:</h3>
              <ul className="space-y-1.5 text-sm text-gray-700">
                <li className="flex items-start gap-2"><i className="fas fa-times text-red-500 mt-0.5"></i>Приложение не работает (App.tsx содержит отчёт)</li>
                <li className="flex items-start gap-2"><i className="fas fa-times text-red-500 mt-0.5"></i>Backend не скомпилируется (неправильный импорт)</li>
                <li className="flex items-start gap-2"><i className="fas fa-times text-red-500 mt-0.5"></i>Уязвимость CSP (пустая строка в imgSrc)</li>
                <li className="flex items-start gap-2"><i className="fas fa-times text-red-500 mt-0.5"></i>Проблемы с порядком CSRF middleware</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-orange-700 mb-2">⚠️ Требуют внимания:</h3>
              <ul className="space-y-1.5 text-sm text-gray-700">
                <li className="flex items-start gap-2"><i className="fas fa-exclamation-triangle text-orange-500 mt-0.5"></i>Нет тестов для новых модулей</li>
                <li className="flex items-start gap-2"><i className="fas fa-exclamation-triangle text-orange-500 mt-0.5"></i>CSRF токен не обновляется автоматически</li>
                <li className="flex items-start gap-2"><i className="fas fa-exclamation-triangle text-orange-500 mt-0.5"></i>Неиспользуемый код (useAppData)</li>
                <li className="flex items-start gap-2"><i className="fas fa-exclamation-triangle text-orange-500 mt-0.5"></i>Нет пагинации в ChannelsList</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-red-200">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-red-600">3.0<span className="text-lg text-gray-400">/10</span></p>
                <p className="text-xs text-gray-500 mt-1">Текущая оценка</p>
                <p className="text-xs text-red-600 font-medium">-5.5 от предыдущей</p>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700">
                  <strong>Состояние проекта критическое.</strong> После предыдущих доработок App.tsx был перезаписан отчётом,
                  что полностью сломало приложение. Backend содержит критическую ошибку импорта, которая не позволит ему скомпилироваться.
                  Требуется немедленное исправление блокирующих ошибок перед продолжением работы.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-gray-400 pb-8">
          <p>Повторный анализ выполнен • {issues.length} ошибок найдено • {new Date().toLocaleString('ru-RU')}</p>
        </footer>
      </main>
    </div>
  );
}

export default App;
