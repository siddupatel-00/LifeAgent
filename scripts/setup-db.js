import { createClient } from '@libsql/client';
import 'dotenv/config';

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function setupDatabase() {
  console.log('🔧 Setting up Turso database tables...\n');

  const queries = [
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL DEFAULT '',
      email TEXT UNIQUE NOT NULL,
      phone TEXT DEFAULT '',
      handle TEXT DEFAULT '',
      password_hash TEXT NOT NULL,
      theme TEXT DEFAULT 'light',
      ai_name TEXT DEFAULT 'AI',
      gemini_api_key TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
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
    )`
  ];

  for (const sql of queries) {
    const tableName = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1];
    try {
      await db.execute(sql);
      console.log(`  ✅ Table "${tableName}" created successfully`);
    } catch (error) {
      console.error(`  ❌ Error creating "${tableName}":`, error.message);
    }
  }

  console.log('\n🎉 Database setup complete!');
  process.exit(0);
}

setupDatabase();
