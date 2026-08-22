export type ThemeMode = 'dark' | 'light' | 'night' | 'pc';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  timezone: string;
  currency: string;
  ai_name: string;
  ai_provider: 'gemini' | 'groq';
  gemini_api_key?: string;
  groq_api_key?: string;
  theme: ThemeMode;
  chat_reset_time: string;
  ai_tone: string;
  morning_audit: number;
  morningAudit?: boolean;
  smart_alerts: number;
  smartAlerts?: boolean;
  auto_open_ai_sidechat: number;
  week_start_day: string;
  weekStartDay?: string;
  sync_to_cloud: number;
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
  habit_7pm_reminder_enabled: number;
  created_at: string;
  updated_at: string;
}

export interface Habit {
  id: string;
  title: string;
  label?: string;
  category: string;
  frequency: 'daily' | 'weekdays' | 'weekly' | 'custom';
  custom_days?: string;
  reminder_time?: string;
  reminders?: HabitReminder[];
  archived: boolean;
  streak: number;
  completed_today: boolean;
  created_at: string;
  updated_at: string;
}

export interface HabitReminder {
  id: string | number;
  reminder_time: string;
  time?: string;
  reminderTime?: string;
  enabled: boolean;
  repeat_rule?: string;
}

export interface TodayItem {
  id: string;
  title: string;
  category: string;
  date: string;
  habit_id?: string;
  completed: boolean;
  is_deleted?: boolean;
}

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: 'spend' | 'earn';
  category: string;
  date: string;
  notes?: string;
  is_deleted?: boolean;
}

export interface Workout {
  id: string;
  title: string;
  split?: string;
  date: string;
  duration_mins?: number;
  calories?: number;
  weight_kg?: number;
  sets?: number;
  reps?: number;
  notes?: string;
  is_deleted?: boolean;
}

export interface BodyStat {
  id: string;
  date: string;
  weight: number;
  target_weight?: number;
  protein: number;
  target_protein?: number;
  hydration?: number;
  is_deleted?: boolean;
}

export interface SleepLog {
  id: string;
  date: string;
  hours: number;
  minutes: number;
  sleep_time: string;
  wake_time: string;
  quality: string;
  notes?: string;
  is_deleted?: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  category: string;
  reminders?: EventReminder[];
  is_deleted?: boolean;
}

export interface EventReminder {
  id: string | number;
  offset_minutes: number;
  enabled: boolean;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  is_archived: boolean;
  is_deleted?: boolean;
  created_at: string;
  updated_at: string;
}

export interface AIMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export interface WaterSettings {
  enabled: boolean;
  startTime: string;
  endTime: string;
  intervalMinutes: number;
  goal: number;
  hydration: number;
}

export interface ReminderSettings {
  globalEnabled: boolean;
  habits: {
    habits: Habit[];
    daily7pmEnabled: boolean;
    userName: string;
  };
  events: CalendarEvent[];
  water: WaterSettings;
  sleep: { enabled: boolean; reminderTime: string };
  workout: { enabled: boolean; reminderTime: string; repeatRule: string };
  summary: { enabled: boolean; reminderTime: string; userName: string };
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export type TabKey = 'today' | 'ai' | 'habits' | 'water' | 'notes' | 'calendar' | 'finance' | 'body' | 'sleep' | 'analytics' | 'settings';

export interface TabConfig {
  key: TabKey;
  label: string;
  icon: React.ReactNode;
  path: string;
}