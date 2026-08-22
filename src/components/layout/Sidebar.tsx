import {
  Home, Sparkles, CheckSquare, Droplet, FileText, Calendar, DollarSign,
  Dumbbell, Moon, BarChart3, Settings as SettingsIcon, LogOut, Sun, Monitor
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

const getTabs = (aiName?: string) => [
  { key: 'today', label: 'Today', icon: Home },
  { key: 'ai', label: aiName || 'AI', icon: Sparkles },
  { key: 'habits', label: 'Habits', icon: CheckSquare },
  { key: 'water', label: 'Water', icon: Droplet },
  { key: 'notes', label: 'Notes', icon: FileText },
  { key: 'calendar', label: 'Calendar', icon: Calendar },
  { key: 'finance', label: 'Finance', icon: DollarSign },
  { key: 'body', label: 'Body & Gym', icon: Dumbbell },
  { key: 'sleep', label: 'Sleep', icon: Moon },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'settings', label: 'Settings', icon: SettingsIcon },
] as const;

const THEMES = ['dark', 'light', 'pc'] as const;

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  user: any;
}

export default function Sidebar({ activeTab, onTabChange, isOpen, onLogout, user }: SidebarProps) {
  const themeMode = useAuthStore((s) => s.themeMode);
  const setThemeMode = useAuthStore((s) => s.setThemeMode);

  if (!isOpen) return null;

  return (
    <aside className="desktop-sidebar" role="navigation" aria-label="Main navigation">
      <div className="sidebar-header">
        <div className="wordmark">
          <span className="wordmark-mark">L</span>
          <span>LifeAgent</span>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Main tabs">
        {getTabs(user?.ai_name).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            className={`sidebar-nav-btn ${activeTab === key ? 'active' : ''}`}
            aria-current={activeTab === key ? 'page' : undefined}
          >
            <Icon size={19} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="user-avatar">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="user-info">
            <span className="user-name">{user?.name || 'User'}</span>
            <span className="user-email">{user?.email}</span>
          </div>
        </div>

        <button onClick={onLogout} className="sidebar-logout secondary-btn">
          <LogOut size={17} />
          <span>Sign Out</span>
        </button>

        <div className="sidebar-theme-row" role="radiogroup" aria-label="Theme">
          {THEMES.map((mode) => (
            <button
              key={mode}
              onClick={() => setThemeMode(mode)}
              className={`theme-pill ${themeMode === mode ? 'active' : ''}`}
              aria-pressed={themeMode === mode}
              aria-label={`${mode} theme`}
              title={mode === 'pc' ? 'System' : mode.charAt(0).toUpperCase() + mode.slice(1)}
            >
              {mode === 'dark' && <Moon size={15} />}
              {mode === 'light' && <Sun size={15} />}
              {mode === 'pc' && <Monitor size={15} />}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
