import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { useReminders } from '../hooks/useUtils';
import Sidebar from '../components/layout/Sidebar';
import MobileBottomNav from '../components/layout/MobileBottomNav';
import DashboardHeader from '../components/layout/DashboardHeader';
import TabContent from '../components/layout/TabContent';

const TAB_ROUTES = {
  today: '/dashboard/today',
  ai: '/dashboard/ai',
  habits: '/dashboard/habits',
  water: '/dashboard/water',
  notes: '/dashboard/notes',
  calendar: '/dashboard/calendar',
  finance: '/dashboard/finance',
  body: '/dashboard/body',
  sleep: '/dashboard/sleep',
  analytics: '/dashboard/analytics',
  settings: '/dashboard/settings',
} as const;

export default function Dashboard() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { activeTab, setActiveTab, isSidebarOpen, setSidebarOpen, isMobileDrawerOpen, setMobileDrawerOpen } = useUIStore();
  const { checkAndRegen } = useReminders();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const path = location.pathname;
    const tab = path.replace('/dashboard/', '') || 'today';
    if (tab in TAB_ROUTES && tab !== activeTab) {
      setActiveTab(tab as keyof typeof TAB_ROUTES);
    }
  }, [location.pathname, activeTab, setActiveTab]);

  useEffect(() => {
    if (isAuthenticated) {
      checkAndRegen();
    }
  }, [isAuthenticated, checkAndRegen]);

  const handleTabChange = (tab: keyof typeof TAB_ROUTES) => {
    setActiveTab(tab);
    navigate(TAB_ROUTES[tab]);
    setMobileDrawerOpen(false);
  };

  const handleMenuClick = () => {
    if (window.matchMedia('(max-width: 768px)').matches) {
      setMobileDrawerOpen(true);
    } else {
      setSidebarOpen(true);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/auth', { replace: true });
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="dashboard-container">
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isOpen={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
        user={user}
      />

      <div className="dashboard-main">
        <DashboardHeader
          activeTab={activeTab}
          user={user}
          onMenuClick={handleMenuClick}
          onLogout={handleLogout}
        />
        
        <main className="dashboard-content">
          <TabContent activeTab={activeTab} user={user} />
        </main>
      </div>

      <MobileBottomNav 
        activeTab={activeTab} 
        onTabChange={handleTabChange}
        isOpen={isMobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
      />
    </div>
  );
}