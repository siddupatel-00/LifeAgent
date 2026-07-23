import db from './lib/db.js';

async function main() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS waitlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT DEFAULT '',
      email TEXT UNIQUE NOT NULL,
      joined_at TEXT DEFAULT (datetime('now'))
    )
  `);
  console.log("Waitlist table created!");
}

main().catch(console.error);
