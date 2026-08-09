import { createClient } from '@libsql/client';

let clientInstance = null;
let isMigrated = false;

export function getDb() {
  if (!clientInstance) {
    const url = process.env.TURSO_DATABASE_URL || '';
    const authToken = process.env.TURSO_AUTH_TOKEN || '';
    clientInstance = createClient({ url, authToken });
  }
  return clientInstance;
}

export async function ensureDbSchema() {
  if (isMigrated) return;
  isMigrated = true;

  const client = getDb();

  // 1. Create all base tables first if they don't exist yet
  const createQueries = [
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL DEFAULT '',
      email TEXT UNIQUE NOT NULL,
      phone TEXT DEFAULT '',
      handle TEXT DEFAULT '',
      password_hash TEXT NOT NULL,
      theme TEXT DEFAULT 'light',
      ai_name TEXT DEFAULT 'AI',
      gemini_api_key TEXT,
      groq_api_key TEXT,
      ai_provider TEXT DEFAULT 'gemini',
      currency TEXT DEFAULT '$',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS habits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      label TEXT NOT NULL,
      category TEXT DEFAULT '',
      streak INTEGER DEFAULT 0,
      checked_today INTEGER DEFAULT 0,
      date TEXT DEFAULT (date('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      category TEXT DEFAULT 'Diary',
      content TEXT DEFAULT '',
      share_with_ai INTEGER DEFAULT 1,
      is_trashed INTEGER DEFAULT 0,
      deleted_at TEXT,
      date TEXT DEFAULT (date('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS calendar_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      end_date TEXT,
      color TEXT DEFAULT '#3b82f6',
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT DEFAULT 'spend',
      date TEXT DEFAULT (date('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS today_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      label TEXT NOT NULL,
      time TEXT DEFAULT '',
      category TEXT DEFAULT '',
      checked INTEGER DEFAULT 0,
      date TEXT DEFAULT (date('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS waitlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT DEFAULT '',
      email TEXT UNIQUE NOT NULL,
      joined_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS chat_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      sender TEXT NOT NULL,
      text TEXT NOT NULL,
      time TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS user_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      timezone TEXT DEFAULT 'UTC',
      chat_reset_time TEXT DEFAULT '00:00',
      last_chat_reset TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS workouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      category TEXT DEFAULT 'General',
      duration_mins INTEGER DEFAULT 0,
      calories INTEGER DEFAULT 0,
      notes TEXT DEFAULT '',
      date TEXT DEFAULT (date('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS body_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      weight REAL,
      target_weight REAL,
      protein REAL,
      hydration REAL,
      date TEXT DEFAULT (date('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS sleep_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      sleep_time TEXT NOT NULL,
      wake_time TEXT NOT NULL,
      hours INTEGER DEFAULT 0,
      minutes INTEGER DEFAULT 0,
      quality TEXT DEFAULT 'Good',
      notes TEXT DEFAULT '',
      date TEXT DEFAULT (date('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS daily_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_email TEXT,
      date TEXT,
      metric_type TEXT,
      metric_name TEXT,
      metric_value TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      entity_type TEXT,
      entity_id INTEGER,
      offset_minutes INTEGER,
      repeat_rule TEXT,
      enabled INTEGER DEFAULT 1,
      reminder_time TEXT
    )`
  ];

  for (const sql of createQueries) {
    await client.execute(sql).catch(e => console.warn('[ensureDbSchema] table create error:', e?.message));
  }

  // Create auto-cascade trigger so deleting a user directly in Turso Dashboard / CLI automatically deletes all child data
  const cascadeTriggerSql = `
    CREATE TRIGGER IF NOT EXISTS cascade_delete_user_data
    BEFORE DELETE ON users
    FOR EACH ROW
    BEGIN
      DELETE FROM user_settings WHERE user_id = OLD.id;
      DELETE FROM habits WHERE user_id = OLD.id;
      DELETE FROM today_items WHERE user_id = OLD.id;
      DELETE FROM transactions WHERE user_id = OLD.id;
      DELETE FROM workouts WHERE user_id = OLD.id;
      DELETE FROM body_stats WHERE user_id = OLD.id;
      DELETE FROM notes WHERE user_id = OLD.id;
      DELETE FROM sleep_logs WHERE user_id = OLD.id;
      DELETE FROM calendar_events WHERE user_id = OLD.id;
      DELETE FROM chat_history WHERE user_id = OLD.id;
      DELETE FROM reminders WHERE user_id = CAST(OLD.id AS TEXT) OR user_id = OLD.id;
      DELETE FROM daily_metrics WHERE user_id = OLD.id OR user_email = OLD.email;
    END;
  `;
  await client.execute(cascadeTriggerSql).catch(e => console.warn('[ensureDbSchema] trigger create warning:', e?.message));

  // 2. Run alter queries for backward compatibility column additions
  const alterQueries = [
    "ALTER TABLE transactions ADD COLUMN category TEXT DEFAULT 'General'",
    "ALTER TABLE transactions ADD COLUMN notes TEXT DEFAULT ''",
    "ALTER TABLE transactions ADD COLUMN time TEXT DEFAULT ''",
    "ALTER TABLE calendar_events ADD COLUMN status TEXT DEFAULT 'upcoming'",
    "ALTER TABLE calendar_events ADD COLUMN time TEXT DEFAULT ''",
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
    "ALTER TABLE user_settings ADD COLUMN reminders_global_enabled INTEGER DEFAULT 1",
    "ALTER TABLE user_settings ADD COLUMN water_reminder_start TEXT DEFAULT '08:00'",
    "ALTER TABLE user_settings ADD COLUMN water_reminder_end TEXT DEFAULT '22:00'",
    "ALTER TABLE user_settings ADD COLUMN sleep_reminder_enabled INTEGER DEFAULT 0",
    "ALTER TABLE user_settings ADD COLUMN sleep_reminder_time TEXT DEFAULT '22:00'",
    "ALTER TABLE user_settings ADD COLUMN workout_reminder_enabled INTEGER DEFAULT 0",
    "ALTER TABLE user_settings ADD COLUMN workout_reminder_time TEXT DEFAULT '07:00'",
    "ALTER TABLE user_settings ADD COLUMN workout_reminder_repeat TEXT DEFAULT '{\"type\":\"daily\"}'",
    "ALTER TABLE user_settings ADD COLUMN summary_reminder_enabled INTEGER DEFAULT 0",
    "ALTER TABLE user_settings ADD COLUMN summary_reminder_time TEXT DEFAULT '07:00'",
    "ALTER TABLE user_settings ADD COLUMN workout_start_count INTEGER DEFAULT 0",
    "ALTER TABLE user_settings ADD COLUMN manual_day_offset INTEGER DEFAULT 0",
  ];

  await Promise.all(
    alterQueries.map(sql => client.execute(sql).catch(() => {}))
  );
}

const db = {
  execute: async (query) => {
    await ensureDbSchema();
    return getDb().execute(query);
  },
  batch: async (queries, mode) => {
    await ensureDbSchema();
    return getDb().batch(queries, mode);
  },
};

export default db;
