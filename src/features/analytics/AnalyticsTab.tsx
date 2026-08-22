import { useState } from 'react';
import { useHabits, useTransactions, useWorkouts, useBodyStats, useSleepLogs, useCalendarEvents, useNotes, useTodayItems } from '../../hooks/useQueries';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { useDate } from '../../hooks/useUtils';
import { TrendingUp, BarChart3, PieChart, Target, CheckCircle2, Clock, DollarSign, Dumbbell, Moon, FileText, Calendar, Droplet } from 'lucide-react';

const METRICS = [
  { key: 'habits', label: 'Habits', icon: Target, color: 'var(--accent-blue)' },
  { key: 'workouts', label: 'Workouts', icon: Dumbbell, color: 'var(--orange)' },
  { key: 'sleep', label: 'Sleep', icon: Moon, color: '#8b5cf6' },
  { key: 'water', label: 'Hydration', icon: Droplet, color: '#06b6d4' },
  { key: 'finance', label: 'Finance', icon: DollarSign, color: '#22c55e' },
  { key: 'notes', label: 'Notes', icon: FileText, color: '#f59e0b' },
  { key: 'calendar', label: 'Events', icon: Calendar, color: '#ec4899' },
] as const;

export function AnalyticsTab({ user }: { user: any }) {
  const { habits } = useHabits();
  const { transactions } = useTransactions();
  const { workouts } = useWorkouts();
  const { bodyStats } = useBodyStats();
  const { sleepLogs } = useSleepLogs();
  const { events } = useCalendarEvents();
  const { notes } = useNotes();
  const { todayKey } = useDate();
  const [timeRange, setTimeRange] = useState('7d');

  const today = todayKey();
  
  const getFilteredData = (data: any[], dateField = 'date') => {
    const now = new Date(today + 'T00:00:00');
    let daysBack = 7;
    if (timeRange === '30d') daysBack = 30;
    else if (timeRange === '90d') daysBack = 90;
    else if (timeRange === '365d') daysBack = 365;
    
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - daysBack);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    
    return data.filter(item => item[dateField] >= cutoffStr && item[dateField] <= today);
  };

  const habitStats = {
    total: habits.filter(h => !h.archived).length,
    completedToday: habits.filter(h => h.completed_today).length,
    streaks: habits.filter(h => !h.archived).reduce((acc, h) => acc + (h.streak || 0), 0),
  };

  const workoutStats = {
    total: getFilteredData(workouts).length,
    thisWeek: getFilteredData(workouts, 'date').filter(w => {
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      return w.date >= weekStart.toISOString().split('T')[0];
    }).length,
  };

  const sleepStats = {
    avgHours: sleepLogs.length > 0 
      ? (sleepLogs.reduce((acc, l) => acc + l.hours + l.minutes / 60, 0) / sleepLogs.length).toFixed(1)
      : 0,
    total: getFilteredData(sleepLogs).length,
  };

  const financeStats = {
    income: transactions.filter(t => t.type === 'earn').reduce((acc, t) => acc + Number(t.amount), 0),
    expense: transactions.filter(t => t.type === 'spend').reduce((acc, t) => acc + Number(t.amount), 0),
  };

  return (
    <div className="analytics-tab">
      <div className="tab-header">
        <h2 className="tab-title">Analytics</h2>
        <div className="time-range-selector">
          {['7d', '30d', '90d', '365d'].map(range => (
            <button
              key={range}
              className={timeRange === range ? 'active' : ''}
              onClick={() => setTimeRange(range)}
            >
              {range === '7d' ? 'Week' : range === '30d' ? 'Month' : range === '90d' ? 'Quarter' : 'Year'}
            </button>
          ))}
        </div>
      </div>

      <div className="analytics-grid">
        <div className="metric-card large">
          <div className="metric-header">
            <span className="metric-label">Habit Completion</span>
            <TrendingUp size={20} style={{ color: 'var(--accent-blue)' }} />
          </div>
          <div className="metric-value-large">{habitStats.total > 0 ? Math.round((habitStats.completedToday / habitStats.total) * 100) : 0}%</div>
          <div className="metric-detail">{habitStats.completedToday} of {habitStats.total} today</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Total Streak</span>
            <Target size={20} style={{ color: 'var(--orange)' }} />
          </div>
          <div className="metric-value">{habitStats.streaks}</div>
          <div className="metric-detail">days combined</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Workouts</span>
            <Dumbbell size={20} style={{ color: 'var(--orange)' }} />
          </div>
          <div className="metric-value">{workoutStats.thisWeek}</div>
          <div className="metric-detail">this week</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Avg Sleep</span>
            <Moon size={20} style={{ color: '#8b5cf6' }} />
          </div>
          <div className="metric-value">{sleepStats.avgHours}h</div>
          <div className="metric-detail">per night</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Net Income</span>
            <DollarSign size={20} style={{ color: '#22c55e' }} />
          </div>
          <div className="metric-value">{user?.currency || '$'}{(financeStats.income - financeStats.expense).toFixed(0)}</div>
          <div className="metric-detail">all time</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Notes</span>
            <FileText size={20} style={{ color: '#f59e0b' }} />
          </div>
          <div className="metric-value">{notes.length}</div>
          <div className="metric-detail">total notes</div>
        </div>
      </div>

      <div className="analytics-sections">
        <section className="analytics-section">
          <h3>Habit Performance</h3>
          <div className="habits-breakdown">
            {habits.filter(h => !h.archived).map((habit) => (
              <div key={habit.id} className="habit-breakdown">
                <span className="habit-name">{habit.title}</span>
                <div className="habit-streak">
                  <span className="streak-number">{habit.streak || 0}</span>
                  <span className="streak-label">day streak</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="analytics-section">
          <h3>Weekly Overview</h3>
          <div className="weekly-chart-placeholder">
            <p>Charts coming soon...</p>
          </div>
        </section>

        <section className="analytics-section">
          <h3>Category Breakdown</h3>
          <div className="category-breakdown">
            <div className="category-item">
              <span className="category-color" style={{ background: 'var(--accent-blue)' }} />
              <span>Habits</span>
              <span>{habits.filter(h => !h.archived).length}</span>
            </div>
            <div className="category-item">
              <span className="category-color" style={{ background: 'var(--orange)' }} />
              <span>Workouts</span>
              <span>{workouts.length}</span>
            </div>
            <div className="category-item">
              <span className="category-color" style={{ background: '#8b5cf6' }} />
              <span>Sleep Logs</span>
              <span>{sleepLogs.length}</span>
            </div>
            <div className="category-item">
              <span className="category-color" style={{ background: '#22c55e' }} />
              <span>Transactions</span>
              <span>{transactions.length}</span>
            </div>
            <div className="category-item">
              <span className="category-color" style={{ background: '#f59e0b' }} />
              <span>Notes</span>
              <span>{notes.length}</span>
            </div>
            <div className="category-item">
              <span className="category-color" style={{ background: '#ec4899' }} />
              <span>Events</span>
              <span>{events.length}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}