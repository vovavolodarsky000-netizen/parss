/**
 * API клиент для взаимодействия с бэкендом
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// Типы
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
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

// Хранилище токенов
let accessToken: string | null = localStorage.getItem('access_token');
let refreshToken: string | null = localStorage.getItem('refresh_token');

/**
 * Базовый fetch с обработкой ошибок и автоматическим обновлением токена
 */
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (accessToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

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

  update: async (id: string, data: any) => {
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
