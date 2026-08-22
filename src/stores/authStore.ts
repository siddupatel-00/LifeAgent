import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeStorage } from '../utils/safeStorage';
import type { UserProfile, ThemeMode } from '../types';

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  themeMode: ThemeMode;
  setToken: (token: string | null) => void;
  setUser: (user: UserProfile | null) => void;
  setThemeMode: (mode: ThemeMode) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: safeStorage.getItem('token'),
      user: null,
      isAuthenticated: !!safeStorage.getItem('token'),
      isLoading: true,
      themeMode: (safeStorage.getItem('themeMode') as ThemeMode) || 'pc',

      setToken: (token) => {
        if (token) {
          safeStorage.setItem('token', token);
        } else {
          safeStorage.removeItem('token');
        }
        set({ token, isAuthenticated: !!token });
      },

      setUser: (user) => set({ user, isLoading: false }),

      setThemeMode: (mode) => {
        safeStorage.setItem('themeMode', mode);
        document.documentElement.setAttribute('data-theme', mode === 'pc' ? 
          (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : mode);
        set({ themeMode: mode });
      },

      logout: () => {
        safeStorage.removeItem('token');
        safeStorage.clear();
        set({ token: null, user: null, isAuthenticated: false });
      },

      setLoading: (isLoading) => set({ isLoading }),

      updateUserProfile: (updates) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...updates } });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({ 
        token: state.token, 
        themeMode: state.themeMode 
      }),
    }
  )
);

export const initializeAuth = async () => {
  const { token, setUser, setLoading } = useAuthStore.getState();
  if (!token) {
    setLoading(false);
    return;
  }
  
  try {
    const response = await fetch(getApiUrl('/api/auth/me'), {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (response.ok) {
      const user = await response.json();
      setUser(user);
    } else {
      useAuthStore.getState().logout();
    }
  } catch {
    useAuthStore.getState().logout();
  } finally {
    setLoading(false);
  }
};