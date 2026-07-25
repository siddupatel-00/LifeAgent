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
    "ALTER TABLE notes ADD COLUMN deleted_at TEXT"
  ];

  for (const sql of alterQueries) {
    try {
      await db.execute(sql);
    } catch (e) {
      // Column already exists or harmless error, safely ignore
    }
  }
}

export default db;
