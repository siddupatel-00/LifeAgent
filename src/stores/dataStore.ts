import { create } from 'zustand';
import type { 
  Habit, 
  TodayItem, 
  Transaction, 
  Workout, 
  BodyStat, 
  SleepLog, 
  CalendarEvent, 
  Note 
} from '../types';

interface DataState {
  habits: Habit[];
  todayItems: TodayItem[];
  transactions: Transaction[];
  workouts: Workout[];
  bodyStats: BodyStat[];
  sleepLogs: SleepLog[];
  calendarEvents: CalendarEvent[];
  notes: Note[];
  setHabits: (habits: Habit[]) => void;
  addHabit: (habit: Habit) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  removeHabit: (id: string) => void;
  setTodayItems: (items: TodayItem[]) => void;
  addTodayItem: (item: TodayItem) => void;
  updateTodayItem: (id: string, updates: Partial<TodayItem>) => void;
  removeTodayItem: (id: string) => void;
  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  removeTransaction: (id: string) => void;
  setWorkouts: (workouts: Workout[]) => void;
  addWorkout: (workout: Workout) => void;
  updateWorkout: (id: string, updates: Partial<Workout>) => void;
  removeWorkout: (id: string) => void;
  setBodyStats: (stats: BodyStat[]) => void;
  addBodyStat: (stat: BodyStat) => void;
  updateBodyStat: (id: string, updates: Partial<BodyStat>) => void;
  removeBodyStat: (id: string) => void;
  setSleepLogs: (logs: SleepLog[]) => void;
  addSleepLog: (log: SleepLog) => void;
  updateSleepLog: (id: string, updates: Partial<SleepLog>) => void;
  removeSleepLog: (id: string) => void;
  setCalendarEvents: (events: CalendarEvent[]) => void;
  addCalendarEvent: (event: CalendarEvent) => void;
  updateCalendarEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  removeCalendarEvent: (id: string) => void;
  setNotes: (notes: Note[]) => void;
  addNote: (note: Note) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  removeNote: (id: string) => void;
  clearAll: () => void;
}

const createArrayUpdater = <T extends { id: string }>(
  getArray: () => T[],
  setArray: (arr: T[]) => void
) => ({
  add: (item: T) => setArray([item, ...getArray()]),
  update: (id: string, updates: Partial<T>) => 
    setArray(getArray().map(item => item.id === id ? { ...item, ...updates } : item)),
  remove: (id: string) => setArray(getArray().filter(item => item.id !== id)),
});

export const useDataStore = create<DataState>((set, get) => ({
  habits: [],
  todayItems: [],
  transactions: [],
  workouts: [],
  bodyStats: [],
  sleepLogs: [],
  calendarEvents: [],
  notes: [],

  setHabits: (habits) => set({ habits }),
  ...createArrayUpdater(() => get().habits, (habits) => set({ habits })),

  setTodayItems: (todayItems) => set({ todayItems }),
  ...createArrayUpdater(() => get().todayItems, (todayItems) => set({ todayItems })),

  setTransactions: (transactions) => set({ transactions }),
  ...createArrayUpdater(() => get().transactions, (transactions) => set({ transactions })),

  setWorkouts: (workouts) => set({ workouts }),
  ...createArrayUpdater(() => get().workouts, (workouts) => set({ workouts })),

  setBodyStats: (bodyStats) => set({ bodyStats }),
  ...createArrayUpdater(() => get().bodyStats, (bodyStats) => set({ bodyStats })),

  setSleepLogs: (sleepLogs) => set({ sleepLogs }),
  ...createArrayUpdater(() => get().sleepLogs, (sleepLogs) => set({ sleepLogs })),

  setCalendarEvents: (calendarEvents) => set({ calendarEvents }),
  ...createArrayUpdater(() => get().calendarEvents, (calendarEvents) => set({ calendarEvents })),

  setNotes: (notes) => set({ notes }),
  ...createArrayUpdater(() => get().notes, (notes) => set({ notes })),

  clearAll: () => set({
    habits: [],
    todayItems: [],
    transactions: [],
    workouts: [],
    bodyStats: [],
    sleepLogs: [],
    calendarEvents: [],
    notes: [],
  }),
}));