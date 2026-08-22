import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuthStore, initializeAuth } from './stores/authStore';
import { useUIStore } from './stores/uiStore';
import { useReminders } from './hooks/useUtils';
import './index.css';

import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import FounderPortal from './components/FounderPortal';
import MessagePage from './pages/MessagePage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000,
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
      if (path.includes('/dashboard')) {
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

      {/* Direct tab aliases */}
      <Route path="/today" element={<Navigate to="/dashboard/today" replace />} />
      <Route path="/ai" element={<Navigate to="/dashboard/ai" replace />} />
      <Route path="/habits" element={<Navigate to="/dashboard/habits" replace />} />
      <Route path="/water" element={<Navigate to="/dashboard/water" replace />} />
      <Route path="/notes" element={<Navigate to="/dashboard/notes" replace />} />
      <Route path="/calendar" element={<Navigate to="/dashboard/calendar" replace />} />
      <Route path="/finance" element={<Navigate to="/dashboard/finance" replace />} />
      <Route path="/money" element={<Navigate to="/dashboard/finance" replace />} />
      <Route path="/body" element={<Navigate to="/dashboard/body" replace />} />
      <Route path="/gym" element={<Navigate to="/dashboard/body" replace />} />
      <Route path="/workout" element={<Navigate to="/dashboard/body" replace />} />
      <Route path="/sleep" element={<Navigate to="/dashboard/sleep" replace />} />
      <Route path="/analytics" element={<Navigate to="/dashboard/analytics" replace />} />
      <Route path="/settings" element={<Navigate to="/dashboard/settings" replace />} />
      
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
    </QueryClientProvider>
  );
}