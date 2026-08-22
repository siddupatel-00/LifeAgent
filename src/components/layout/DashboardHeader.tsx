import { useEffect, useRef, useState } from 'react';
import { Menu, Sun, Moon, Monitor, LogOut, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

interface DashboardHeaderProps {
  activeTab: string;
  user: any;
  onMenuClick: () => void;
  onLogout: () => void;
}

const TAB_LABELS: Record<string, string> = {
  today: 'Today',
  ai: 'AI Coach',
  habits: 'Habits',
  water: 'Water',
  notes: 'Notes',
  calendar: 'Calendar',
  finance: 'Finance',
  body: 'Body & Gym',
  sleep: 'Sleep',
  analytics: 'Analytics',
  settings: 'Settings',
};

const THEMES = ['dark', 'light', 'pc'] as const;

export default function DashboardHeader({ activeTab, user, onMenuClick, onLogout }: DashboardHeaderProps) {
  const themeMode = useAuthStore((s) => s.themeMode);
  const setThemeMode = useAuthStore((s) => s.setThemeMode);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);
  const themeRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isThemeOpen && !showConfirmLogout) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) setIsThemeOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setShowConfirmLogout(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isThemeOpen, showConfirmLogout]);

  const ThemeIcon = themeMode === 'dark' ? Moon : themeMode === 'light' ? Sun : Monitor;
  const themeLabel = themeMode === 'pc' ? 'System' : themeMode.charAt(0).toUpperCase() + themeMode.slice(1);

  return (
    <header className="dashboard-header">
      <div className="header-left">
        <button onClick={onMenuClick} className="header-menu-btn" aria-label="Open menu">
          <Menu size={22} />
        </button>
        <div className="header-title-section">
          <h2>{TAB_LABELS[activeTab] || 'Dashboard'}</h2>
          <span className="header-timestamp">
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>

      <div className="header-right">
        <div className="theme-dropdown" ref={themeRef}>
          <button
            onClick={() => setIsThemeOpen(!isThemeOpen)}
            className="theme-toggle-btn secondary-btn"
            aria-expanded={isThemeOpen}
            aria-haspopup="menu"
            aria-label="Change theme"
          >
            <ThemeIcon size={17} />
            <span className="theme-toggle-label">{themeLabel}</span>
            <ChevronDown size={14} />
          </button>
          {isThemeOpen && (
            <div className="theme-dropdown-menu" role="menu">
              {THEMES.map((mode) => (
                <button
                  key={mode}
                  onClick={() => { setThemeMode(mode); setIsThemeOpen(false); }}
                  className={`theme-dropdown-item ${themeMode === mode ? 'active' : ''}`}
                  role="menuitemradio"
                  aria-checked={themeMode === mode}
                >
                  {mode === 'dark' && <Moon size={15} />}
                  {mode === 'light' && <Sun size={15} />}
                  {mode === 'pc' && <Monitor size={15} />}
                  <span>{mode === 'pc' ? 'System' : mode.charAt(0).toUpperCase() + mode.slice(1)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="user-menu" ref={userMenuRef}>
          <button
            className="user-avatar-btn"
            aria-label="User menu"
            onClick={() => setShowConfirmLogout(!showConfirmLogout)}
          >
            <span>{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
          </button>
          {showConfirmLogout && (
            <div className="user-menu-popover" role="menu">
              <span className="user-menu-name">{user?.name || 'User'}</span>
              <span className="user-menu-email">{user?.email}</span>
              <button onClick={onLogout} className="user-menu-logout" role="menuitem">
                <LogOut size={15} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
