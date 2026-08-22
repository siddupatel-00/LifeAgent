import { useState } from 'react';
import { useHabits, useTransactions, useWorkouts, useSleepLogs, useNotes, useCalendarEvents } from '../../hooks/useQueries';
import { useAuthStore } from '../../stores/authStore';
import { useDate, todayKey, getWeekDays } from '../../hooks/useUtils';
import { TrendingUp, Target, Dumbbell, Moon, DollarSign, FileText, Calendar } from 'lucide-react';

export function AnalyticsTab() {
  const user = useAuthStore((s) => s.user);
  const { habits } = useHabits();
  const { transactions } = useTransactions();
  const { workouts } = useWorkouts();
  const { sleepLogs } = useSleepLogs();
  const { notes } = useNotes();
  const { events } = useCalendarEvents();
  const [timeRange, setTimeRange] = useState('7d');

  const today = todayKey(user?.timezone);

  const getFilteredData = (data: any[], dateField = 'date') => {
    let daysBack = 7;
    if (timeRange === '30d') daysBack = 30;
    else if (timeRange === '90d') daysBack = 90;
    else if (timeRange === '365d') daysBack = 365;

    const [y, m, d] = today.split('-').map(Number);
    const cutoff = new Date(y, m - 1, d);
    cutoff.setDate(cutoff.getDate() - daysBack);
    const pad = (n: number) => String(n).padStart(2, '0');
    const cutoffStr = `${cutoff.getFullYear()}-${pad(cutoff.getMonth() + 1)}-${pad(cutoff.getDate())}`;

    return data.filter(item => item[dateField] >= cutoffStr && item[dateField] <= today);
  };

  // Timezone-safe "this week" (Sunday start)
  const weekDays = getWeekDays(today);
  const weekStart = weekDays[0];

  const activeHabits = habits.filter(h => !h.archived);
  const habitStats = {
    total: activeHabits.length,
    completedToday: habits.filter(h => h.checked_today).length,
    streaks: activeHabits.reduce((acc, h) => acc + (h.streak || 0), 0),
  };
  const completionRate = habitStats.total > 0
    ? Math.round((habitStats.completedToday / habitStats.total) * 100)
    : 0;

  const filteredWorkouts = getFilteredData(workouts);
  const workoutStats = {
    inRange: filteredWorkouts.length,
    thisWeek: workouts.filter(w => w.date >= weekStart).length,
  };

  const rangeSleepLogs = getFilteredData(sleepLogs);
  const sleepLogsForAvg = sleepLogs.slice(0, 14);
  const avgHours = sleepLogsForAvg.length > 0
    ? (sleepLogsForAvg.reduce((acc, l) => acc + l.hours + l.minutes / 60, 0) / sleepLogsForAvg.length).toFixed(1)
    : null;

  const financeStats = {
    income: transactions.filter(t => t.type === 'earn').reduce((acc, t) => acc + Number(t.amount || 0), 0),
    expense: transactions.filter(t => t.type === 'spend').reduce((acc, t) => acc + Number(t.amount || 0), 0),
  };

  return (
    <div className="analytics-tab">
      <div className="tab-header">
        <h2 className="tab-title">Analytics</h2>
        <div className="filter-tabs">
          {[['7d', 'Week'], ['30d', 'Month'], ['90d', 'Quarter'], ['365d', 'Year']].map(([range, label]) => (
            <button key={range} className={timeRange === range ? 'active' : ''} onClick={() => setTimeRange(range)}>
              {label}
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
          <div className="metric-value-large">{completionRate}%</div>
          <div className="metric-detail">{habitStats.completedToday} of {habitStats.total} checked in today</div>
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
          <div className="metric-detail">this week · {workoutStats.inRange} in range</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Avg Sleep</span>
            <Moon size={20} style={{ color: '#8b5cf6' }} />
          </div>
          <div className="metric-value">{avgHours ? `${avgHours}h` : '—'}</div>
          <div className="metric-detail">per night (last {sleepLogsForAvg.length})</div>
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
            <span className="metric-label">Notes & Events</span>
            <FileText size={20} style={{ color: '#f59e0b' }} />
          </div>
          <div className="metric-value">{notes.length + events.length}</div>
          <div className="metric-detail">{notes.length} notes · {events.length} events</div>
        </div>
      </div>

      <div className="analytics-sections">
        <section className="analytics-section">
          <h3>Habit Performance</h3>
          {activeHabits.length === 0 ? (
            <p className="empty-hint">No active habits yet</p>
          ) : (
            <div className="habits-breakdown">
              {activeHabits.map((habit) => (
                <div key={habit.id} className="habit-breakdown">
                  <span className="habit-name">{habit.label}</span>
                  <div className="habit-streak-mini">
                    <span className="streak-number">{habit.streak || 0}</span>
                    <span className="streak-label">day streak</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="analytics-section">
          <h3>Category Breakdown</h3>
          <div className="category-breakdown">
            <div className="category-item">
              <span className="category-color" style={{ background: 'var(--accent-blue)' }} />
              <span>Habits</span>
              <span>{activeHabits.length}</span>
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
              <span><Calendar size={13} /> {events.length}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default AnalyticsTab;
