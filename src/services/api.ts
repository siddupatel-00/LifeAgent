import { getApiUrl } from '../utils/apiUrl';
import { safeStorage } from '../utils/safeStorage';

const getAuthHeaders = (): Record<string, string> => {
  const token = safeStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      fetchJson<{ token: string; user: any }>(getApiUrl('/api/auth/login'), {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    register: (data: { name: string; email: string; password: string }) =>
      fetchJson<{ token: string; user: any }>(getApiUrl('/api/auth/register'), {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    logout: () =>
      fetchJson<void>(getApiUrl('/api/auth/logout'), { method: 'POST' }),

    me: () =>
      fetchJson<any>(getApiUrl('/api/auth/me')),

    forgotPassword: (email: string) =>
      fetchJson<void>(getApiUrl('/api/auth/forgot-password'), {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),

    resetPassword: (token: string, password: string) =>
      fetchJson<void>(getApiUrl('/api/auth/reset-password'), {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      }),
  },

  settings: {
    get: () => fetchJson<any>(getApiUrl('/api/settings')),

    update: (data: Partial<any>) =>
      fetchJson<any>(getApiUrl('/api/settings'), {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    deleteAccount: () =>
      fetchJson<void>(getApiUrl('/api/settings/account'), { method: 'DELETE' }),

    resetData: () =>
      fetchJson<void>(getApiUrl('/api/settings/reset'), { method: 'POST' }),
  },

  habits: {
    list: () => fetchJson<any[]>(getApiUrl('/api/habits')),

    create: (data: Partial<any>) =>
      fetchJson<any>(getApiUrl('/api/habits'), {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: Partial<any>) =>
      fetchJson<any>(getApiUrl(`/api/habits/${id}`), {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      fetchJson<void>(getApiUrl(`/api/habits/${id}`), { method: 'DELETE' }),

    complete: (id: string, date: string) =>
      fetchJson<any>(getApiUrl(`/api/habits/${id}/complete`), {
        method: 'POST',
        body: JSON.stringify({ date }),
      }),

    uncomplete: (id: string, date: string) =>
      fetchJson<any>(getApiUrl(`/api/habits/${id}/uncomplete`), {
        method: 'POST',
        body: JSON.stringify({ date }),
      }),

    getStats: (id: string) =>
      fetchJson<any>(getApiUrl(`/api/habits/${id}/stats`)),
  },

  today: {
    list: (date?: string) => {
      const url = date ? getApiUrl(`/api/today?date=${date}`) : getApiUrl('/api/today');
      return fetchJson<any[]>(url);
    },

    create: (data: Partial<any>) =>
      fetchJson<any>(getApiUrl('/api/today'), {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: Partial<any>) =>
      fetchJson<any>(getApiUrl(`/api/today/${id}`), {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      fetchJson<void>(getApiUrl(`/api/today/${id}`), { method: 'DELETE' }),

    complete: (id: string) =>
      fetchJson<any>(getApiUrl(`/api/today/${id}/complete`), { method: 'POST' }),

    uncomplete: (id: string) =>
      fetchJson<any>(getApiUrl(`/api/today/${id}/uncomplete`), { method: 'POST' }),
  },

  transactions: {
    list: () => fetchJson<any[]>(getApiUrl('/api/transactions')),

    create: (data: Partial<any>) =>
      fetchJson<any>(getApiUrl('/api/transactions'), {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: Partial<any>) =>
      fetchJson<any>(getApiUrl(`/api/transactions/${id}`), {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      fetchJson<void>(getApiUrl(`/api/transactions/${id}`), { method: 'DELETE' }),
  },

  fitness: {
    workouts: {
      list: () => fetchJson<any[]>(getApiUrl('/api/fitness?type=workouts')),

      create: (data: Partial<any>) =>
        fetchJson<any>(getApiUrl('/api/fitness?type=workouts'), {
          method: 'POST',
          body: JSON.stringify(data),
        }),

      update: (id: string, data: Partial<any>) =>
        fetchJson<any>(getApiUrl(`/api/fitness?type=workouts&id=${id}`), {
          method: 'PUT',
          body: JSON.stringify(data),
        }),

      delete: (id: string) =>
        fetchJson<void>(getApiUrl(`/api/fitness?type=workouts&id=${id}`), { method: 'DELETE' }),
    },

    bodyStats: {
      list: () => fetchJson<any[]>(getApiUrl('/api/fitness?type=body-stats')),

      create: (data: Partial<any>) =>
        fetchJson<any>(getApiUrl('/api/fitness?type=body-stats'), {
          method: 'POST',
          body: JSON.stringify(data),
        }),

      update: (id: string, data: Partial<any>) =>
        fetchJson<any>(getApiUrl(`/api/fitness?type=body-stats&id=${id}`), {
          method: 'PUT',
          body: JSON.stringify(data),
        }),

      delete: (id: string) =>
        fetchJson<void>(getApiUrl(`/api/fitness?type=body-stats&id=${id}`), { method: 'DELETE' }),
    },

    sleep: {
      list: () => fetchJson<any[]>(getApiUrl('/api/fitness?type=sleep')),

      create: (data: Partial<any>) =>
        fetchJson<any>(getApiUrl('/api/fitness?type=sleep'), {
          method: 'POST',
          body: JSON.stringify(data),
        }),

      update: (id: string, data: Partial<any>) =>
        fetchJson<any>(getApiUrl(`/api/fitness?type=sleep&id=${id}`), {
          method: 'PUT',
          body: JSON.stringify(data),
        }),

      delete: (id: string) =>
        fetchJson<void>(getApiUrl(`/api/fitness?type=sleep&id=${id}`), { method: 'DELETE' }),
    },
  },

  calendar: {
    list: () => fetchJson<any[]>(getApiUrl('/api/calendar')),

    create: (data: Partial<any>) =>
      fetchJson<any>(getApiUrl('/api/calendar'), {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: Partial<any>) =>
      fetchJson<any>(getApiUrl(`/api/calendar/${id}`), {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      fetchJson<void>(getApiUrl(`/api/calendar/${id}`), { method: 'DELETE' }),
  },

  notes: {
    list: () => fetchJson<any[]>(getApiUrl('/api/notes')),

    create: (data: Partial<any>) =>
      fetchJson<any>(getApiUrl('/api/notes'), {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: Partial<any>) =>
      fetchJson<any>(getApiUrl(`/api/notes/${id}`), {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      fetchJson<void>(getApiUrl(`/api/notes/${id}`), { method: 'DELETE' }),

    togglePin: (id: string) =>
      fetchJson<any>(getApiUrl(`/api/notes/${id}/pin`), { method: 'POST' }),

    toggleArchive: (id: string) =>
      fetchJson<any>(getApiUrl(`/api/notes/${id}/archive`), { method: 'POST' }),
  },

  ai: {
    chat: (messages: any[], provider: string, apiKey: string) =>
      fetchJson<{ response: string }>(getApiUrl('/api/ai/chat'), {
        method: 'POST',
        body: JSON.stringify({ messages, provider, apiKey }),
      }),

    getHistory: () => fetchJson<any[]>(getApiUrl('/api/ai/history')),

    clearHistory: () =>
      fetchJson<void>(getApiUrl('/api/ai/history'), { method: 'DELETE' }),
  },

  founder: {
    submitMessage: (data: { name: string; email: string; message: string }) =>
      fetchJson<void>(getApiUrl('/api/founder/message'), {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    waitlist: (data: { name: string; email: string }) =>
      fetchJson<void>(getApiUrl('/api/founder/waitlist'), {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
};

export default api;