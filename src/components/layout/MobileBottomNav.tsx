import { 
  Home, Bot, CheckSquare, Droplet, FileText, Calendar, DollarSign, 
  Dumbbell, Moon, BarChart3, Settings
} from 'lucide-react';

const TABS = [
  { key: 'today', label: 'Today', icon: Home },
  { key: 'ai', label: 'AI', icon: Bot },
  { key: 'habits', label: 'Habits', icon: CheckSquare },
  { key: 'water', label: 'Water', icon: Droplet },
  { key: 'notes', label: 'Notes', icon: FileText },
  { key: 'calendar', label: 'Cal', icon: Calendar },
  { key: 'finance', label: 'Money', icon: DollarSign },
  { key: 'body', label: 'Gym', icon: Dumbbell },
  { key: 'sleep', label: 'Sleep', icon: Moon },
  { key: 'analytics', label: 'Stats', icon: BarChart3 },
  { key: 'settings', label: 'Settings', icon: Settings },
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
    <nav className="mobile-bottom-nav" role="navigation" aria-label="Bottom navigation">
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
          <Icon size={22} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}