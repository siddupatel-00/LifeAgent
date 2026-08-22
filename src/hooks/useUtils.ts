import { useMemo, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import { regenerateAllReminders, isRegenNeeded, requestNotificationPermission } from '../utils/reminderScheduler';
import { useHabits, useCalendarEvents } from './useQueries';

export const useReminders = () => {
  const user = useAuthStore((s) => s.user);
  const { habits } = useHabits();
  const { events: calendarEvents } = useCalendarEvents();

  const regenerate = useCallback(async () => {
    if (!user) return;

    const flag = (v: unknown) => v === 1 || v === true || v === '1';

    await regenerateAllReminders({
      habits: {
        habits: habits || [],
        daily7pmEnabled: flag(user.habit_7pm_reminder_enabled ?? false),
        userName: user.name || 'User',
      },
      events: calendarEvents || [],
      waterSettings: {
        enabled: flag(user.water_reminder_enabled),
        startTime: user.water_reminder_start || '08:00',
        endTime: user.water_reminder_end || '22:00',
        intervalMinutes: user.water_reminder_interval || 60,
        goal: user.water_target_goal || 2.5,
        hydration: 0,
      },
      sleepSettings: {
        enabled: flag(user.sleep_reminder_enabled),
        reminderTime: user.sleep_reminder_time || '22:00',
      },
      workoutSettings: {
        enabled: flag(user.workout_reminder_enabled),
        reminderTime: user.workout_reminder_time || '07:00',
        repeatRule: user.workout_reminder_repeat || '{"type":"daily"}',
      },
      summarySettings: {
        enabled: flag(user.summary_reminder_enabled),
        reminderTime: user.summary_reminder_time || '07:00',
        userName: user.name || 'User',
      },
      globalEnabled: user.remindersGlobalEnabled ?? flag(user.reminders_global_enabled),
    }).catch((err) => {
      console.warn('Reminder regeneration failed:', err);
    });
  }, [user, habits, calendarEvents]);

  const checkAndRegen = useCallback(() => {
    if (isRegenNeeded()) {
      regenerate();
    }
  }, [regenerate]);

  return { regenerate, checkAndRegen, requestPermission: requestNotificationPermission };
};

/** Returns "today" as YYYY-MM-DD in the user's timezone. */
export const todayKey = (timezone?: string): string => {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone || undefined,
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date());
  } catch {
    return new Date().toISOString().split('T')[0];
  }
};

/** Formats a plain YYYY-MM-DD string without timezone drift. */
export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const formatTime = (timeStr?: string): string => {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  if (Number.isNaN(h)) return timeStr;
  const period = h >= 12 ? 'PM' : 'AM';
  const displayHours = h % 12 || 12;
  return `${displayHours}:${(m || 0).toString().padStart(2, '0')} ${period}`;
};

/** Week containing today (or the given date), timezone-safe. */
export const getWeekDays = (startDate?: string, weekStartsOn: 0 | 1 = 0): string[] => {
  const parse = (s: string) => {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  };
  const base = startDate ? parse(startDate) : new Date();
  const day = base.getDay();
  const offsetToStart = weekStartsOn === 1
    ? (day + 6) % 7   // Monday start
    : day;            // Sunday start
  const start = new Date(base);
  start.setDate(base.getDate() - offsetToStart);

  const week: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    week.push(`${y}-${m}-${dd}`);
  }
  return week;
};

/** Whether a habit is scheduled on the given date (YYYY-MM-DD). */
export const isHabitScheduledOnDay = (habit: any, dateStr: string): boolean => {
  if (!habit.frequency || habit.frequency === 'daily') return true;
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const day = date.getDay();

  switch (habit.frequency) {
    case 'weekdays':
      return day >= 1 && day <= 5;
    case 'weekly': {
      if (!habit.start_date) return true;
      const [sy, sm, sd] = String(habit.start_date).split('-').map(Number);
      return day === new Date(sy, sm - 1, sd).getDay();
    }
    case 'custom': {
      if (!habit.custom_days) return false;
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const days = String(habit.custom_days).split(',').map(s => s.trim().slice(0, 3));
      return days.includes(dayNames[day]);
    }
    default:
      return true;
  }
};

export const useDate = () => {
  const user = useAuthStore((s) => s.user);
  const timezone = user?.timezone || undefined;

  return useMemo(() => ({
    todayKey: () => todayKey(timezone),
    formatDate,
    formatTime,
    getWeekDays,
    isHabitScheduledOnDay,
  }), [timezone]);
};
