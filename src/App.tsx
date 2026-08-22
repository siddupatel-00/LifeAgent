import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, lazy } from 'react';
import { useAuthStore, initializeAuth } from './stores/authStore';
import { useUIStore } from './stores/uiStore';
import { useReminders } from './hooks/useUtils';
import { safeStorage } from './utils/safeStorage';
import './index.css';

import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import FounderPortal from './components/FounderPortal';
import MessagePage from './pages/MessagePage';

const ReactQueryDevtools = import.meta.env.DEV 
  ? lazy(() => import('@tanstack/react-query-devtools').then(m => ({ default: m.ReactQueryDevtools })))
  : () => null;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const { checkAndRegen } = useReminders();
  const { activeTab, setActiveTab } = useUIStore();

  useEffect(() => {
    initializeAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      checkAndRegen();
    }
  }, [isAuthenticated, checkAndRegen]);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path.includes('/dashboard') || path === '/') {
        const tab = path.split('/')[2] || 'today';
        if (['today', 'ai', 'habits', 'water', 'notes', 'calendar', 'finance', 'body', 'sleep', 'analytics', 'settings'].includes(tab)) {
          setActiveTab(tab as any);
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [setActiveTab]);

  if (isLoading) {
    return null;
  }

  return (
    <Routes>
      <Route path="/founder" element={<FounderPortal />} />
      <Route path="/message" element={<MessagePage />} />
      <Route path="/waitlist" element={<MessagePage />} />
      <Route path="/contact" element={<MessagePage />} />
      
      <Route 
        path="/auth" 
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <AuthPage />} 
      />
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <AuthPage />} 
      />
      
      <Route 
        path="/dashboard/*" 
        element={isAuthenticated ? <Dashboard /> : <Navigate to="/auth" replace />} 
      />
      
      <Route 
        path="/" 
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />} 
      />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
      {import.meta.env.DEV && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}