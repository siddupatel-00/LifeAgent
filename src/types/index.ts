export type ThemeMode = 'dark' | 'light' | 'night' | 'pc';

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone?: string;
  handle?: string;
  timezone?: string;
  currency: string;
  ai_name: string;
  ai_provider: 'gemini' | 'groq';
  gemini_api_key?: string;
  groq_api_key?: string;
  theme?: ThemeMode;
  chat_reset_time?: string;
  ai_tone: string;
  morning_audit?: number;
  morningAudit?: boolean;
  smart_alerts?: number;
  smartAlerts?: boolean;
  week_start_day: string;
  weekStartDay?: string;
  sync_to_cloud?: number;
  syncToCloud?: boolean;
  water_target_goal: number;
  water_reminder_enabled: number;
  water_reminder_start: string;
  water_reminder_end: string;
  water_reminder_interval: number;
  sleep_reminder_enabled: number;
  sleep_reminder_time: string;
  workout_reminder_enabled: number;
  workout_reminder_time: string;
  workout_reminder_repeat: string;
  summary_reminder_enabled: number;
  summary_reminder_time: string;
  reminders_global_enabled: number;
  remindersGlobalEnabled?: boolean;
}

/** Row shape returned by GET/POST /api/habits */
export interface Habit {
  id: number;
  label: string;
  category: string;
  target?: string;
  streak?: number;
  checked_today?: number;
  challenge_days?: number;
  start_date?: string | null;
  paused_until?: string | null;
  archived: number;
  completed_at?: string | null;
  frequency: 'daily' | 'weekdays' | 'weekly' | 'custom';
  custom_days?: string;
  interval_days?: number;
  reminders?: HabitReminder[];
}

export interface HabitReminder {
  id: number;
  reminder_time: string;
  time?: string;
  enabled: number;
  repeat_rule?: string | null;
}

/** Row shape returned by GET/POST /api/today */
export interface TodayItem {
  id: number;
  label: string;
  category: string;
  time: string;
  habit_id: number | null;
  date: string;
  checked: number;
}

export interface Transaction {
  id: number;
  title: string;
  amount: number;
  type: 'spend' | 'earn';
  category: string;
  notes?: string;
  time?: string;
  date: string;
}

export interface Workout {
  id: number;
  title: string;
  category: string;
  duration_mins: number;
  calories: number;
  notes?: string;
  date: string;
}

export interface BodyStat {
  id: number;
  date: string;
  weight: number;
  target_weight?: number;
  protein: number;
  target_protein?: number;
  hydration?: number;
}

export interface SleepLog {
  id: number;
  date: string;
  hours: number;
  minutes: number;
  sleep_time: string;
  wake_time: string;
  quality: string;
  notes?: string;
}

export interface CalendarEvent {
  id: number;
  title: string;
  date: string;
  end_date?: string | null;
  color: string;
  status?: string;
  time: string;
  reminders?: EventReminder[];
}

export interface EventReminder {
  id: number;
  offset_minutes: number;
  enabled: number;
  reminder_time?: string;
}

export interface Note {
  id: number;
  title: string;
  category: string;
  content: string;
  share_with_ai?: number;
  is_pinned: number;
  is_archived: number;
  date: string;
  created_at?: string;
  updated_at?: string | null;
}

export interface AIMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  time: string;
}

export type TabKey = 'today' | 'ai' | 'habits' | 'water' | 'notes' | 'calendar' | 'finance' | 'body' | 'sleep' | 'analytics' | 'settings';

export interface TabConfig {
  key: TabKey;
  label: string;
  icon: React.ReactNode;
  path: string;
}
