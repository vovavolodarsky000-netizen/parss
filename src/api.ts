/**
 * API клиент для взаимодействия с бэкендом
 * Поддерживает CSRF защиту (SEC-003)
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// Типы
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
}

// SEC-002: токены теперь хранятся в httpOnly cookies, не в localStorage
// Эти переменные используются только для отслеживания состояния
let accessToken: string | null = null;
let refreshToken: string | null = null;

// CSRF токен (SEC-003, BUG-003: сохраняем в sessionStorage)
let csrfToken: string | null = sessionStorage.getItem('csrf_token');

/**
 * Получение CSRF токена с сервера
 */
async function fetchCsrfToken(): Promise<string | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/csrf-token`, {
      credentials: 'include',
    });
    const data = await response.json();
    if (data.success && data.data?.csrfToken) {
      csrfToken = data.data.csrfToken;
      // BUG-003: сохраняем токен в sessionStorage
      sessionStorage.setItem('csrf_token', csrfToken!);
      return csrfToken;
    }
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
  }
  return null;
}

/**
 * Базовый fetch с обработкой ошибок и автоматическим обновлением токена
 */
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;

  // Получаем CSRF токен для небезопасных методов (SEC-003)
  const method = (options.method || 'GET').toUpperCase();
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && !csrfToken) {
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
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (accessToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
  }

  // Добавляем CSRF токен в заголовок (SEC-003)
  if (csrfToken && !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    (headers as Record<string, string>)['X-CSRF-Token'] = csrfToken;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // SEC-002: отправляем cookies с токенами
    });

    const data = await response.json();

    // Если CSRF токен недействителен, пробуем обновить (SEC-006, BUG-002)
    if (response.status === 403 && data.error?.code === 'CSRF_TOKEN_INVALID') {
      csrfToken = null;
      sessionStorage.removeItem('csrf_token');
      const newToken = await fetchCsrfToken();
      if (newToken) {
        (headers as Record<string, string>)['X-CSRF-Token'] = newToken;
        const retryResponse = await fetch(url, { ...options, headers });
        const retryData = await retryResponse.json();
        
        // BUG-002: проверяем статус retry
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
    }

    // Если токен истёк, пробуем обновить
    if (response.status === 401 && refreshToken) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        // Повторяем запрос с новым токеном
        (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
        const retryResponse = await fetch(url, { ...options, headers });
        return retryResponse.json();
      }
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Ошибка сети. Проверьте подключение.',
      },
    };
  }
}

/**
 * Обновление access токена
 */
async function refreshAccessToken(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await response.json();

    if (data.success && data.data?.tokens) {
      setTokens(data.data.tokens.accessToken, data.data.tokens.refreshToken);
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Установка токенов
 */
function setTokens(access: string, refresh: string) {
  accessToken = access;
  refreshToken = refresh;
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
}

/**
 * Очистка токенов
 */
function clearTokens() {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

// ============================================
// Auth API
// ============================================

export const authApi = {
  register: async (email: string, username: string, password: string) => {
    const response = await apiFetch<{ user: User; tokens: AuthTokens }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, username, password }),
    });

    if (response.success && response.data?.tokens) {
      setTokens(response.data.tokens.accessToken, response.data.tokens.refreshToken);
    }

    return response;
  },

  login: async (email: string, password: string) => {
    const response = await apiFetch<{ user: User; tokens: AuthTokens }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.success && response.data?.tokens) {
      setTokens(response.data.tokens.accessToken, response.data.tokens.refreshToken);
    }

    return response;
  },

  logout: async () => {
    const response = await apiFetch('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });

    clearTokens();
    return response;
  },

  me: async () => {
    return apiFetch<User>('/auth/me');
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    return apiFetch('/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },
};

// ============================================
// Channels API
// ============================================

export const channelsApi = {
  list: async (params?: { page?: number; limit?: number; isActive?: boolean; category?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.isActive !== undefined) searchParams.set('isActive', params.isActive.toString());
    if (params?.category) searchParams.set('category', params.category);

    return apiFetch('/channels?' + searchParams.toString());
  },

  get: async (id: string) => {
    return apiFetch(`/channels/${id}`);
  },

  create: async (data: { username: string; title: string; category: string; topics?: string[]; keywords?: string[] }) => {
    return apiFetch('/channels', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: Record<string, unknown>) => {
    return apiFetch(`/channels/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return apiFetch(`/channels/${id}`, {
      method: 'DELETE',
    });
  },

  parse: async (id: string, limit: number = 50) => {
    return apiFetch(`/channels/${id}/parse`, {
      method: 'POST',
      body: JSON.stringify({ limit }),
    });
  },
};

// ============================================
// Posts API
// ============================================

export const postsApi = {
  list: async (params?: { page?: number; limit?: number; status?: string; channelId?: string; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.status) searchParams.set('status', params.status);
    if (params?.channelId) searchParams.set('channelId', params.channelId);
    if (params?.search) searchParams.set('search', params.search);

    return apiFetch('/posts?' + searchParams.toString());
  },

  updateStatus: async (id: string, status: string) => {
    return apiFetch(`/posts/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  bulkUpdateStatus: async (ids: string[], status: string) => {
    return apiFetch('/posts/bulk-status', {
      method: 'PUT',
      body: JSON.stringify({ ids, status }),
    });
  },

  stats: async () => {
    return apiFetch('/posts/stats');
  },
};

// ============================================
// Утилиты
// ============================================

export const apiUtils = {
  isAuthenticated: () => !!accessToken,
  getToken: () => accessToken,
  clearAuth: clearTokens,
};

export default {
  auth: authApi,
  channels: channelsApi,
  posts: postsApi,
  utils: apiUtils,
};
