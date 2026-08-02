import { createClient } from '@libsql/client';

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
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
    "ALTER TABLE users ADD COLUMN sync_to_cloud INTEGER DEFAULT 1",
    // ─── Reminder system additions ───
    "ALTER TABLE user_settings ADD COLUMN reminders_global_enabled INTEGER DEFAULT 0",
    "ALTER TABLE user_settings ADD COLUMN water_reminder_start TEXT DEFAULT '08:00'",
    "ALTER TABLE user_settings ADD COLUMN water_reminder_end TEXT DEFAULT '22:00'",
    "ALTER TABLE user_settings ADD COLUMN sleep_reminder_enabled INTEGER DEFAULT 0",
    "ALTER TABLE user_settings ADD COLUMN sleep_reminder_time TEXT DEFAULT '22:00'",
    "ALTER TABLE user_settings ADD COLUMN workout_reminder_enabled INTEGER DEFAULT 0",
    "ALTER TABLE user_settings ADD COLUMN workout_reminder_time TEXT DEFAULT '07:00'",
    "ALTER TABLE user_settings ADD COLUMN workout_reminder_repeat TEXT DEFAULT '{\"type\":\"daily\"}'",
    "ALTER TABLE user_settings ADD COLUMN summary_reminder_enabled INTEGER DEFAULT 0",
    "ALTER TABLE user_settings ADD COLUMN summary_reminder_time TEXT DEFAULT '07:00'",
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

  // Create reminders table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      entity_type TEXT,
      entity_id INTEGER,
      offset_minutes INTEGER,
      repeat_rule TEXT,
      enabled INTEGER DEFAULT 1,
      reminder_time TEXT
    )
  `);
}

export default db;
