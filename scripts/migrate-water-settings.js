import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const db = createClient({
  url: process.env.VITE_TURSO_DATABASE_URL,
  authToken: process.env.VITE_TURSO_AUTH_TOKEN,
});

async function run() {
  try {
    console.log('Adding water tracking columns to user_settings...');
    
    try {
      await db.execute("ALTER TABLE user_settings ADD COLUMN water_target_goal REAL DEFAULT 2.5");
      console.log('Added water_target_goal');
    } catch (e) {
      if (!e.message.includes('duplicate column name')) throw e;
    }

    try {
      await db.execute("ALTER TABLE user_settings ADD COLUMN water_reminder_interval INTEGER DEFAULT 60");
      console.log('Added water_reminder_interval');
    } catch (e) {
      if (!e.message.includes('duplicate column name')) throw e;
    }

    try {
      await db.execute("ALTER TABLE user_settings ADD COLUMN water_reminder_enabled INTEGER DEFAULT 0");
      console.log('Added water_reminder_enabled');
    } catch (e) {
      if (!e.message.includes('duplicate column name')) throw e;
    }

    console.log('Migration successful!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}
run();
