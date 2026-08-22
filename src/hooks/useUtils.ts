import { useMemo } from 'react';
import { useAuthStore } from '../stores/authStore';
import { regenerateAllReminders, isRegenNeeded, requestNotificationPermission } from '../utils/reminderScheduler';
import { useDataStore } from '../stores/dataStore';

export const useReminders = () => {
  const { user } = useAuthStore();
  const { habits, calendarEvents } = useDataStore();

  const regenerate = async () => {
    if (!user) return;
    
    await regenerateAllReminders({
      habits: {
        habits: habits || [],
        daily7pmEnabled: user.habit_7pm_reminder_enabled !== 0 && user.habit_7pm_reminder_enabled !== false,
        userName: user.name || 'User',
      },
      events: calendarEvents || [],
      waterSettings: {
        enabled: user.water_reminder_enabled !== undefined ? !!user.water_reminder_enabled : (user.water_reminder_enabled !== 0 && user.water_reminder_enabled !== false),
        startTime: user.water_reminder_start || '08:00',
        endTime: user.water_reminder_end || '22:00',
        intervalMinutes: user.water_reminder_interval || 60,
        goal: user.water_target_goal || 2.5,
        hydration: 0,
      },
      sleepSettings: {
        enabled: user.sleep_reminder_enabled !== undefined ? !!user.sleep_reminder_enabled : (user.sleep_reminder_enabled !== 0 && user.sleep_reminder_enabled !== false),
        reminderTime: user.sleep_reminder_time || '22:00',
      },
      workoutSettings: {
        enabled: user.workout_reminder_enabled !== undefined ? !!user.workout_reminder_enabled : (user.workout_reminder_enabled !== 0 && user.workout_reminder_enabled !== false),
        reminderTime: user.workout_reminder_time || '07:00',
        repeatRule: user.workout_reminder_repeat || '{"type":"daily"}',
      },
      summarySettings: {
        enabled: user.summary_reminder_enabled !== undefined ? !!user.summary_reminder_enabled : (user.summary_reminder_enabled !== 0 && user.summary_reminder_enabled !== false),
        reminderTime: user.summary_reminder_time || '07:00',
        userName: user.name || 'User',
      },
      globalEnabled: user.reminders_global_enabled !== false && user.reminders_global_enabled !== 0,
    });
  };

  const checkAndRegen = () => {
    if (isRegenNeeded()) {
      regenerate();
    }
  };

  const requestPermission = () => requestNotificationPermission();

  return { regenerate, checkAndRegen, requestPermission };
};

export const useDate = () => {
  const { user } = useAuthStore();
  const timezone = user?.timezone || 'UTC';

  return useMemo(() => ({
    todayKey: () => {
      const now = new Date();
      const offset = getTimezoneOffset(timezone);
      const local = new Date(now.getTime() + offset);
      return local.toISOString().split('T')[0];
    },
    formatDate: (dateStr: string) => {
      const date = new Date(dateStr + 'T00:00:00');
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    },
    formatTime: (timeStr: string) => {
      if (!timeStr) return '';
      const [hours, minutes] = timeStr.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    },
    getWeekDays: (startDate?: string) => {
      const base = startDate ? new Date(startDate + 'T00:00:00') : new Date();
      const day = base.getDay();
      const monday = new Date(base);
      monday.setDate(base.getDate() - ((day + 6) % 7));
      const week = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        week.push(d.toISOString().split('T')[0]);
      }
      return week;
    },
    isHabitScheduledOnDay: (habit: any, dateStr: string) => {
      if (!habit.frequency) return true;
      const date = new Date(dateStr + 'T00:00:00');
      const day = date.getDay();
      
      switch (habit.frequency) {
        case 'daily':
          return true;
        case 'weekdays':
          return day >= 1 && day <= 5;
        case 'weekly':
          return day === new Date(habit.created_at || dateStr).getDay();
        case 'custom':
          if (!habit.custom_days) return false;
          const days = habit.custom_days.split(',');
          const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          return days.includes(dayNames[day]);
        default:
          return true;
      }
    },
  }), [timezone]);
};

function getTimezoneOffset(tz: string): number {
  try {
    const date = new Date();
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone: tz }));
    return tzDate.getTime() - utcDate.getTime();
  } catch {
    return 0;
  }
}

export const useLocalStorage = <T>(key: string, initialValue: T) => {
  const { safeGetItem, safeSetItem, safeRemoveItem } = useSafeStorage();
  
  const storedValue = safeGetItem(key);
  const initial = storedValue ? JSON.parse(storedValue) : initialValue;
  
  const setValue = (value: T | ((val: T) => T)) => {
    const valueToStore = value instanceof Function ? value(initial) : value;
    safeSetItem(key, JSON.stringify(valueToStore));
  };
  
  const removeValue = () => safeRemoveItem(key);
  
  return [initial, setValue, removeValue] as const;
};

export const useSafeStorage = () => ({
  safeGetItem: (key: string) => {
    try {
      if (typeof window === 'undefined') return null;
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  safeSetItem: (key: string, value: string) => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, value);
      }
    } catch {}
  },
  safeRemoveItem: (key: string) => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch {}
  },
});