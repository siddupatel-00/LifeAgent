import { Suspense, lazy } from 'react';

const TodayTab = lazy(() => import('../../features/today/TodayTab').then(m => ({ default: m.TodayTab })));
const AITab = lazy(() => import('../../features/ai/AITab').then(m => ({ default: m.AITab })));
const HabitsTab = lazy(() => import('../../features/habits/HabitsTab').then(m => ({ default: m.HabitsTab })));
const WaterTab = lazy(() => import('../../features/water/WaterTab').then(m => ({ default: m.WaterTab })));
const NotesTab = lazy(() => import('../../features/notes/NotesTab').then(m => ({ default: m.NotesTab })));
const CalendarTab = lazy(() => import('../../features/calendar/CalendarTab').then(m => ({ default: m.CalendarTab })));
const FinanceTab = lazy(() => import('../../features/finance/FinanceTab').then(m => ({ default: m.FinanceTab })));
const BodyTab = lazy(() => import('../../features/body/BodyTab').then(m => ({ default: m.BodyTab })));
const SleepTab = lazy(() => import('../../features/sleep/SleepTab').then(m => ({ default: m.SleepTab })));
const AnalyticsTab = lazy(() => import('../../features/analytics/AnalyticsTab').then(m => ({ default: m.AnalyticsTab })));
const SettingsTab = lazy(() => import('../../features/settings/SettingsTab').then(m => ({ default: m.SettingsTab })));

const TABS: Record<string, React.ComponentType<{ user: any }>> = {
  today: TodayTab,
  ai: AITab,
  habits: HabitsTab,
  water: WaterTab,
  notes: NotesTab,
  calendar: CalendarTab,
  finance: FinanceTab,
  body: BodyTab,
  sleep: SleepTab,
  analytics: AnalyticsTab,
  settings: SettingsTab,
};

interface TabContentProps {
  activeTab: string;
  user: any;
}

export default function TabContent({ activeTab, user }: TabContentProps) {
  const TabComponent = TABS[activeTab] || TodayTab;

  return (
    <div className="tab-content-housing-box animate-tab-matter">
      <Suspense fallback={<TabSkeleton />}>
        <TabComponent user={user} />
      </Suspense>
    </div>
  );
}

function TabSkeleton() {
  return (
    <div className="tab-skeleton">
      <div className="skeleton-row">
        <div className="skeleton-item skeleton-title" />
        <div className="skeleton-item skeleton-subtitle" />
      </div>
      <div className="skeleton-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton-card">
            <div className="skeleton-item skeleton-card-title" />
            <div className="skeleton-item skeleton-card-value" />
            <div className="skeleton-item skeleton-card-detail" />
          </div>
        ))}
      </div>
    </div>
  );
}