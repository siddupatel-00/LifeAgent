import { 
  Home, Bot, CheckSquare, Droplet, FileText, Calendar, DollarSign, 
  Dumbbell, Moon, BarChart3, Settings, LogOut, User, ChevronLeft, X
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

const TABS = [
  { key: 'today', label: 'Today', icon: Home },
  { key: 'ai', label: 'AI Coach', icon: Bot },
  { key: 'habits', label: 'Habits', icon: CheckSquare },
  { key: 'water', label: 'Water', icon: Droplet },
  { key: 'notes', label: 'Notes', icon: FileText },
  { key: 'calendar', label: 'Calendar', icon: Calendar },
  { key: 'finance', label: 'Finance', icon: DollarSign },
  { key: 'body', label: 'Body & Gym', icon: Dumbbell },
  { key: 'sleep', label: 'Sleep', icon: Moon },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'settings', label: 'Settings', icon: Settings },
] as const;

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

export default function Sidebar({ activeTab, onTabChange, isOpen, onClose, user }: SidebarProps) {
  const { themeMode, setThemeMode } = useAuthStore();

  if (!isOpen) return null;

  return (
    <aside className="desktop-sidebar" role="navigation" aria-label="Main navigation">
      <div className="sidebar-header">
        <div className="wordmark">
          <span className="wordmark-mark">L</span>
          <span>LifeAgent</span>
        </div>
        <button onClick={onClose} className="sidebar-close" aria-label="Close sidebar">
          <X size={20} />
        </button>
      </div>

      <nav className="sidebar-nav" aria-label="Main tabs">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            className={`sidebar-nav-btn ${activeTab === key ? 'active' : ''}`}
            aria-current={activeTab === key ? 'page' : undefined}
          >
            <Icon size={20} />
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

        <div className="sidebar-theme">
          <span className="theme-label">Theme</span>
          <div className="theme-options">
            {['dark', 'light', 'pc'].map((mode) => (
              <button
                key={mode}
                onClick={() => setThemeMode(mode as any)}
                className={`theme-option ${themeMode === mode ? 'active' : ''}`}
                aria-pressed={themeMode === mode}
              >
                {mode === 'dark' && <Moon size={16} />}
                {mode === 'light' && <Sun size={16} />}
                {mode === 'pc' && <Monitor size={16} />}
                <span>{mode.charAt(0).toUpperCase() + mode.slice(1)}</span>
              </button>
            ))}
          </div>
        </div>

        <button onClick={onClose} className="sidebar-logout secondary-btn">
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}