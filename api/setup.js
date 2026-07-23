import db from '../lib/db.js';

export default async function handler(req, res) {
  try {
    await db.batch([
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
        currency TEXT DEFAULT '$',
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
      )`
    ]);
    res.status(200).json({ success: true, message: 'All tables created successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
