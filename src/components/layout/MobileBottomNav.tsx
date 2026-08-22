import { X } from 'lucide-react';
import {
  Home, Sparkles, CheckSquare, Droplet, FileText, Calendar, DollarSign,
  Dumbbell, Moon, BarChart3, Settings as SettingsIcon
} from 'lucide-react';

const TABS = [
  { key: 'today', label: 'Today', icon: Home },
  { key: 'ai', label: 'AI', icon: Sparkles },
  { key: 'habits', label: 'Habits', icon: CheckSquare },
  { key: 'water', label: 'Water', icon: Droplet },
  { key: 'notes', label: 'Notes', icon: FileText },
  { key: 'calendar', label: 'Calendar', icon: Calendar },
  { key: 'finance', label: 'Money', icon: DollarSign },
  { key: 'body', label: 'Gym', icon: Dumbbell },
  { key: 'sleep', label: 'Sleep', icon: Moon },
  { key: 'analytics', label: 'Stats', icon: BarChart3 },
  { key: 'settings', label: 'Settings', icon: SettingsIcon },
] as const;

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileBottomNav({ activeTab, onTabChange, isOpen, onClose }: MobileBottomNavProps) {
  if (!isOpen) return null;

  return (
    <>
      <div className="nav-sheet-backdrop" onClick={onClose} />
      <nav className="mobile-bottom-nav" role="navigation" aria-label="Tab navigation">
        <button className="sheet-close" onClick={onClose} aria-label="Close menu">
          <X size={16} /> Close
        </button>
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => {
              onTabChange(key);
              onClose();
            }}
            className={`mobile-nav-btn ${activeTab === key ? 'active' : ''}`}
            aria-current={activeTab === key ? 'page' : undefined}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
