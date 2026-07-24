import db from '../lib/db.js';
import 'dotenv/config';

async function migrate() {
  console.log('🚀 Starting v2 migration...');

  const columns = [
    "ALTER TABLE transactions ADD COLUMN category TEXT DEFAULT 'General'",
    "ALTER TABLE transactions ADD COLUMN notes TEXT DEFAULT ''",
    "ALTER TABLE transactions ADD COLUMN time TEXT DEFAULT ''",
    "ALTER TABLE calendar_events ADD COLUMN status TEXT DEFAULT 'upcoming'"
  ];

  for (const sql of columns) {
    try {
      await db.execute(sql);
      console.log(`✅ Success: ${sql}`);
    } catch (e) {
      console.log(`⚠️ Skipped: ${sql} (${e.message})`);
    }
  }

  const tables = [
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
    )`
  ];

  for (const sql of tables) {
    const tableName = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1] || 'unknown';
    try {
      await db.execute(sql);
      console.log(`✅ Table "${tableName}" checked/created`);
    } catch (e) {
      console.log(`❌ Error on table "${tableName}": ${e.message}`);
    }
  }

  console.log('🎉 v2 Migration complete!');
  process.exit(0);
}

migrate();
