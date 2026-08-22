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
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || body.message || `Request failed (${response.status})`);
  }

  return response.json();
}

/** Build a resource URL with an id (and optional extra) query param. */
const idUrl = (path: string, id: string | number, extra = ''): string =>
  getApiUrl(`${path}?id=${encodeURIComponent(String(id))}${extra}`);

export const api = {
  auth: {
    login: (email: string, password: string) =>
      fetchJson<{ token: string; user: any }>(getApiUrl('/api/auth'), {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    register: (data: { name: string; email: string; password: string }) =>
      fetchJson<{ token: string; user: any }>(getApiUrl('/api/auth?action=register'), {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    me: () =>
      fetchJson<{ user: any }>(getApiUrl('/api/auth?action=me')),

    forgotPassword: (emailOrHandle: string) =>
      fetchJson<{ message: string }>(getApiUrl('/api/auth?action=forgot-password'), {
        method: 'POST',
        body: JSON.stringify({ emailOrHandle }),
      }),

    verifyResetCode: (emailOrHandle: string, code: string) =>
      fetchJson<{ message: string }>(getApiUrl('/api/auth?action=verify-reset-code'), {
        method: 'POST',
        body: JSON.stringify({ emailOrHandle, code }),
      }),

    resetPassword: (emailOrHandle: string, code: string, newPassword: string) =>
      fetchJson<{ message: string }>(getApiUrl('/api/auth?action=reset-password'), {
        method: 'POST',
        body: JSON.stringify({ emailOrHandle, code, newPassword }),
      }),
  },

  settings: {
    get: () => fetchJson<any>(getApiUrl('/api/settings')),

    update: (data: Record<string, unknown>) =>
      fetchJson<{ success: boolean }>(getApiUrl('/api/settings'), {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    deleteAccount: () =>
      fetchJson<void>(getApiUrl('/api/settings?action=delete-account'), { method: 'POST' }),

    resetData: () =>
      fetchJson<void>(getApiUrl('/api/settings?action=reset-all'), { method: 'POST' }),
  },

  habits: {
    list: () => fetchJson<any[]>(getApiUrl('/api/habits')),

    create: (data: Record<string, unknown>) =>
      fetchJson<any>(getApiUrl('/api/habits'), {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string | number, data: Record<string, unknown>) => {
      // Server expects PUT /api/habits with { id, ...fields }
      return fetchJson<any>(getApiUrl('/api/habits'), {
        method: 'PUT',
        body: JSON.stringify({ ...data, id }),
      });
    },

    delete: (id: string | number) =>
      fetchJson<void>(idUrl('/api/habits', id), { method: 'DELETE' }),
  },

  today: {
    list: (date?: string) => {
      const url = date ? getApiUrl(`/api/today?client_date=${encodeURIComponent(date)}`) : getApiUrl('/api/today');
      return fetchJson<any[]>(url);
    },

    create: (data: Record<string, unknown>) =>
      fetchJson<any>(getApiUrl('/api/today'), {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string | number, data: Record<string, unknown>) =>
      fetchJson<any>(idUrl('/api/today', id), {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: string | number) =>
      fetchJson<void>(idUrl('/api/today', id), { method: 'DELETE' }),
  },

  transactions: {
    list: () => fetchJson<any[]>(getApiUrl('/api/transactions')),

    create: (data: Record<string, unknown>) =>
      fetchJson<any>(getApiUrl('/api/transactions'), {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string | number, data: Record<string, unknown>) =>
      fetchJson<any>(idUrl('/api/transactions', id), {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: string | number) =>
      fetchJson<void>(idUrl('/api/transactions', id), { method: 'DELETE' }),
  },

  fitness: {
    workouts: {
      list: () => fetchJson<any[]>(getApiUrl('/api/fitness?type=workouts')),
      create: (data: Record<string, unknown>) =>
        fetchJson<any>(getApiUrl('/api/fitness?type=workouts'), {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      update: (id: string | number, data: Record<string, unknown>) =>
        fetchJson<any>(idUrl('/api/fitness', id, '&type=workouts'), {
          method: 'PUT',
          body: JSON.stringify(data),
        }),
      delete: (id: string | number) =>
        fetchJson<void>(idUrl('/api/fitness', id, '&type=workouts'), { method: 'DELETE' }),
    },

    bodyStats: {
      list: () => fetchJson<any[]>(getApiUrl('/api/fitness?type=body-stats')),
      create: (data: Record<string, unknown>) =>
        fetchJson<any>(getApiUrl('/api/fitness?type=body-stats'), {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      update: (id: string | number, data: Record<string, unknown>) =>
        fetchJson<any>(idUrl('/api/fitness', id, '&type=body-stats'), {
          method: 'PUT',
          body: JSON.stringify(data),
        }),
      delete: (id: string | number) =>
        fetchJson<void>(idUrl('/api/fitness', id, '&type=body-stats'), { method: 'DELETE' }),
    },

    sleep: {
      list: () => fetchJson<any[]>(getApiUrl('/api/fitness?type=sleep')),
      create: (data: Record<string, unknown>) =>
        fetchJson<any>(getApiUrl('/api/fitness?type=sleep'), {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      update: (id: string | number, data: Record<string, unknown>) =>
        fetchJson<any>(idUrl('/api/fitness', id, '&type=sleep'), {
          method: 'PUT',
          body: JSON.stringify(data),
        }),
      delete: (id: string | number) =>
        fetchJson<void>(idUrl('/api/fitness', id, '&type=sleep'), { method: 'DELETE' }),
    },
  },

  calendar: {
    list: () => fetchJson<any[]>(getApiUrl('/api/calendar')),

    create: (data: Record<string, unknown>) =>
      fetchJson<any>(getApiUrl('/api/calendar'), {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string | number, data: Record<string, unknown>) =>
      fetchJson<any>(idUrl('/api/calendar', id), {
        method: 'PUT',
        body: JSON.stringify({ ...data, id }),
      }),

    delete: (id: string | number) =>
      fetchJson<void>(idUrl('/api/calendar', id), { method: 'DELETE' }),
  },

  notes: {
    list: () => fetchJson<any[]>(getApiUrl('/api/notes')),

    create: (data: Record<string, unknown>) =>
      fetchJson<any>(getApiUrl('/api/notes'), {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string | number, data: Record<string, unknown>) =>
      fetchJson<any>(idUrl('/api/notes', id), {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: string | number) =>
      fetchJson<void>(idUrl('/api/notes', id), { method: 'DELETE' }),

    togglePin: (id: string | number, isPinned: boolean) =>
      api.notes.update(id, { is_pinned: !isPinned }),

    toggleArchive: (id: string | number, isArchived: boolean) =>
      api.notes.update(id, { is_archived: !isArchived }),
  },

  ai: {
    chat: (messages: any[], _provider?: string, _apiKey?: string) =>
      fetchJson<{ response: string }>(getApiUrl('/api/chat'), {
        method: 'POST',
        body: JSON.stringify({ messages }),
      }),

    getHistory: () => fetchJson<any[]>(getApiUrl('/api/chat')),

    clearHistory: () =>
      fetchJson<void>(getApiUrl('/api/chat'), { method: 'DELETE' }),
  },

  founder: {
    submitMessage: (data: { name: string; email: string; message: string }) =>
      fetchJson<void>(getApiUrl('/api/auth?action=founder_message'), {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    waitlist: (data: { name: string; email: string }) =>
      fetchJson<void>(getApiUrl('/api/auth?action=waitlist'), {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
};

export default api;
