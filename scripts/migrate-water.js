import db from '../lib/db.js';

async function run() {
  try {
    console.log('Adding water tracking columns to user_settings...');
    
    try {
      await db.execute("ALTER TABLE user_settings ADD COLUMN water_target_goal REAL DEFAULT 2.5");
      console.log('Added water_target_goal');
    } catch (e) {
      if (!e.message.includes('duplicate column name') && !e.message.includes('already exists')) throw e;
    }

    try {
      await db.execute("ALTER TABLE user_settings ADD COLUMN water_reminder_interval INTEGER DEFAULT 60");
      console.log('Added water_reminder_interval');
    } catch (e) {
      if (!e.message.includes('duplicate column name') && !e.message.includes('already exists')) throw e;
    }

    try {
      await db.execute("ALTER TABLE user_settings ADD COLUMN water_reminder_enabled INTEGER DEFAULT 0");
      console.log('Added water_reminder_enabled');
    } catch (e) {
      if (!e.message.includes('duplicate column name') && !e.message.includes('already exists')) throw e;
    }

    console.log('Migration successful!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}
run();
