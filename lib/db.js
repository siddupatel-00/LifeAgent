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
    "ALTER TABLE habits ADD COLUMN completed_at TEXT"
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
}

export default db;
