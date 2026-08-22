import { Menu, Sun, Moon, Monitor, LogOut, Bell, ChevronDown, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';

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

export default function DashboardHeader({ activeTab, user, onMenuClick, onLogout }: DashboardHeaderProps) {
  const { themeMode, setThemeMode } = useAuthStore();
  const { timeRange, setTimeRange, isTimeMenuOpen, setIsTimeMenuOpen } = useUIStore();
  const timeDropdownRef = React.useRef<HTMLDivElement>(null);
  const themeDropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (timeDropdownRef.current && !timeDropdownRef.current.contains(e.target as Node)) {
        setIsTimeMenuOpen(false);
      }
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(e.target as Node)) {
        setIsTimeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setIsTimeMenuOpen]);

  const handleThemeChange = (mode: 'dark' | 'light' | 'pc') => {
    setThemeMode(mode);
  };

  return (
    <header className="dashboard-header">
      <div className="header-left">
        <button onClick={onMenuClick} className="header-menu-btn" aria-label="Open menu">
          <Menu size={24} />
        </button>
        <div className="header-title-section">
          <h2>{TAB_LABELS[activeTab] || 'Dashboard'}</h2>
          <span className="header-timestamp">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            })}
          </span>
        </div>
      </div>

      <div className="header-center">
        <div className="time-dropdown" ref={timeDropdownRef}>
          <button
            onClick={() => setIsTimeMenuOpen(!isTimeMenuOpen)}
            className="time-dropdown-trigger secondary-btn"
            aria-expanded={isTimeMenuOpen}
            aria-haspopup="listbox"
          >
            <span>{getTimeRangeLabel(timeRange)}</span>
            <ChevronDown size={16} />
          </button>
          {isTimeMenuOpen && (
            <ul className="time-dropdown-menu" role="listbox">
              {['today', '3d', '7d', '14d', '30d', '1m', '3m', '6m', '12m', 'lifetime'].map((range) => (
                <li key={range} role="option" aria-selected={timeRange === range}>
                  <button
                    onClick={() => { setTimeRange(range); setIsTimeMenuOpen(false); }}
                    className={`time-dropdown-item ${timeRange === range ? 'active' : ''}`}
                  >
                    {getTimeRangeLabel(range)}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="header-right">
        <div className="theme-dropdown" ref={themeDropdownRef}>
          <button
            onClick={() => setIsTimeMenuOpen(!isTimeMenuOpen)}
            className="theme-toggle-btn secondary-btn"
            aria-expanded={isTimeMenuOpen}
            aria-haspopup="listbox"
            aria-label="Change theme"
          >
            {themeMode === 'dark' && <Moon size={18} />}
            {themeMode === 'light' && <Sun size={18} />}
            {themeMode === 'pc' && <Monitor size={18} />}
            <span>{themeMode.charAt(0).toUpperCase() + themeMode.slice(1)}</span>
            <ChevronDown size={16} />
          </button>
          {isTimeMenuOpen && (
            <div className="theme-dropdown-menu" role="menu">
              {['dark', 'light', 'pc'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => { handleThemeChange(mode as any); setIsTimeMenuOpen(false); }}
                  className={`theme-dropdown-item ${themeMode === mode ? 'active' : ''}`}
                  role="menuitemradio"
                  aria-checked={themeMode === mode}
                >
                  {mode === 'dark' && <Moon size={16} />}
                  {mode === 'light' && <Sun size={16} />}
                  {mode === 'pc' && <Monitor size={16} />}
                  <span>{mode.charAt(0).toUpperCase() + mode.slice(1)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="user-menu">
          <button className="user-avatar-btn" aria-label="User menu">
            <span>{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}

function getTimeRangeLabel(range: string): string {
  const labels: Record<string, string> = {
    today: 'Today',
    '3d': '3 Days',
    '7d': '7 Days',
    '14d': '14 Days',
    '30d': '30 Days',
    '1m': '1 Month',
    '3m': '3 Months',
    '6m': '6 Months',
    '12m': '12 Months',
    lifetime: 'All Time',
  };
  return labels[range] || range;
}