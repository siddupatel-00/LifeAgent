import { createClient } from '@libsql/client';

const dbUrl = process.env.TURSO_DATABASE_URL || 'file:local.db';
const dbAuthToken = process.env.TURSO_AUTH_TOKEN || '';

const db = createClient({
  url: dbUrl,
  authToken: dbAuthToken,
});

let isMigrated = false;

export async function ensureDbSchema() {
  if (isMigrated) return;
  isMigrated = true;

  const alterQueries = [
    "ALTER TABLE transactions ADD COLUMN category TEXT DEFAULT 'General'",
    "ALTER TABLE transactions ADD COLUMN notes TEXT DEFAULT ''",
    "ALTER TABLE transactions ADD COLUMN time TEXT DEFAULT ''",
    "ALTER TABLE calendar_events ADD COLUMN status TEXT DEFAULT 'upcoming'",
    "ALTER TABLE calendar_events ADD COLUMN end_date TEXT",
    "ALTER TABLE users ADD COLUMN phone TEXT DEFAULT ''",
    "ALTER TABLE users ADD COLUMN handle TEXT DEFAULT ''",
    "ALTER TABLE users ADD COLUMN ai_tone TEXT DEFAULT 'Analytical & Direct'",
    "ALTER TABLE users ADD COLUMN morning_audit INTEGER DEFAULT 1",
    "ALTER TABLE users ADD COLUMN smart_alerts INTEGER DEFAULT 1",
    "ALTER TABLE habits ADD COLUMN category TEXT DEFAULT ''",
    "ALTER TABLE habits ADD COLUMN target TEXT DEFAULT ''",
    "ALTER TABLE habits ADD COLUMN paused_until TEXT",
    "ALTER TABLE today_items ADD COLUMN habit_id INTEGER",
    "ALTER TABLE notes ADD COLUMN is_trashed INTEGER DEFAULT 0",
    "ALTER TABLE notes ADD COLUMN deleted_at TEXT",
    "ALTER TABLE users ADD COLUMN reset_token TEXT",
    "ALTER TABLE users ADD COLUMN reset_token_expires INTEGER",
    "ALTER TABLE user_settings ADD COLUMN workout_split_type TEXT DEFAULT 'weekly'",
    "ALTER TABLE user_settings ADD COLUMN workout_templates TEXT",
    "ALTER TABLE body_stats ADD COLUMN target_protein REAL DEFAULT 150",
    "ALTER TABLE habits ADD COLUMN challenge_days INTEGER DEFAULT 0",
    "ALTER TABLE habits ADD COLUMN start_date TEXT",
    "ALTER TABLE habits ADD COLUMN archived INTEGER DEFAULT 0",
    "ALTER TABLE habits ADD COLUMN completed_at TEXT",
    "ALTER TABLE habits ADD COLUMN frequency TEXT DEFAULT 'daily'",
    "ALTER TABLE habits ADD COLUMN custom_days TEXT DEFAULT ''",
    "ALTER TABLE habits ADD COLUMN interval_days INTEGER DEFAULT 0",
    "ALTER TABLE users ADD COLUMN week_start_day TEXT DEFAULT 'Monday'",
    "ALTER TABLE user_settings ADD COLUMN week_start_day TEXT DEFAULT 'Monday'",
    "ALTER TABLE users ADD COLUMN sync_to_cloud INTEGER DEFAULT 1"
  ];

  for (const sql of alterQueries) {
    try {
      await db.execute(sql);
    } catch (e) {
      // Column already exists or harmless error, safely ignore
    }
  }

  // Create daily_metrics if not exists
  await db.execute(`
    CREATE TABLE IF NOT EXISTS daily_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_email TEXT,
      date TEXT,
      metric_type TEXT,
      metric_name TEXT,
      metric_value TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Ensure all necessary tables exist
  const tableSchemas = [
    `CREATE TABLE IF NOT EXISTS habits (id TEXT PRIMARY KEY, user_id TEXT, title TEXT, label TEXT, category TEXT, streak INTEGER, checked_today INTEGER, target TEXT, paused_until TEXT, challenge_days INTEGER, start_date TEXT, archived INTEGER, frequency TEXT, custom_days TEXT, interval_days INTEGER, updated_at TEXT)`,
    `CREATE TABLE IF NOT EXISTS transactions (id TEXT PRIMARY KEY, user_id TEXT, title TEXT, amount REAL, type TEXT, category TEXT, date TEXT, created_at TEXT, notes TEXT, time TEXT)`,
    `CREATE TABLE IF NOT EXISTS notes (id TEXT PRIMARY KEY, user_id TEXT, title TEXT, content TEXT, is_pinned INTEGER, is_archived INTEGER, is_trash INTEGER, is_trashed INTEGER, deleted_at TEXT, created_at TEXT, updated_at TEXT)`,
    `CREATE TABLE IF NOT EXISTS calendar_events (id TEXT PRIMARY KEY, user_id TEXT, title TEXT, date TEXT, start_time TEXT, end_time TEXT, category TEXT, status TEXT, end_date TEXT, created_at TEXT)`,
    `CREATE TABLE IF NOT EXISTS body_stats (id TEXT PRIMARY KEY, user_id TEXT, date TEXT, weight REAL, target_weight REAL, protein REAL, target_protein REAL, hydration REAL)`,
    `CREATE TABLE IF NOT EXISTS sleep_logs (id TEXT PRIMARY KEY, user_id TEXT, date TEXT, duration_hours REAL, quality INTEGER, notes TEXT)`,
    `CREATE TABLE IF NOT EXISTS today_items (id TEXT PRIMARY KEY, user_id TEXT, title TEXT, category TEXT, date TEXT, habit_id TEXT, completed INTEGER, is_deleted INTEGER)`,
    `CREATE TABLE IF NOT EXISTS workouts (id TEXT PRIMARY KEY, user_id TEXT, title TEXT, category TEXT, duration_mins INTEGER, calories INTEGER, date TEXT, notes TEXT, created_at TEXT)`,
    `CREATE TABLE IF NOT EXISTS chat_history (id TEXT PRIMARY KEY, user_id TEXT, role TEXT, content TEXT, created_at TEXT)`
  ];
  for (const schema of tableSchemas) {
    try {
      await db.execute(schema);
    } catch (e) {
      console.warn("Schema init error:", e);
    }
  }
}

export default db;
