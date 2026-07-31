import Dexie from 'dexie';

export const db = new Dexie('LifeAgentOfflineDB');

db.version(1).stores({
  habits: 'id, title, category, frequency, is_deleted, updatedAt, lastSyncedAt',
  todayItems: 'id, title, category, date, habit_id, is_deleted, updatedAt, lastSyncedAt',
  transactions: 'id, title, amount, type, category, date, is_deleted, updatedAt, lastSyncedAt',
  workouts: 'id, title, split, date, is_deleted, updatedAt, lastSyncedAt',
  bodyStats: 'id, date, weight, target_weight, protein, hydration, is_deleted, updatedAt, lastSyncedAt',
  sleepLogs: 'id, date, duration_hours, quality, notes, is_deleted, updatedAt, lastSyncedAt',
  notes: 'id, title, content, is_pinned, is_archived, is_deleted, updatedAt, lastSyncedAt',
  calendarEvents: 'id, title, date, start_time, end_time, category, is_deleted, updatedAt, lastSyncedAt',
  aiMessages: 'id, sender, text, timestamp, is_deleted, updatedAt, lastSyncedAt',
  syncQueue: '++qId, table, op, recordId, payload, updatedAt, status',
  metaState: 'key, value'
});

export default db;
