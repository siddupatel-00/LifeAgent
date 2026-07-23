import 'dotenv/config';
import db from './lib/db.js';
async function run() {
  try {
    await db.execute("ALTER TABLE users ADD COLUMN groq_api_key TEXT DEFAULT ''");
    console.log("groq_api_key added successfully!");
  } catch (e) {
    console.log("groq_api_key:", e.message);
  }
  try {
    await db.execute("ALTER TABLE users ADD COLUMN ai_provider TEXT DEFAULT 'gemini'");
    console.log("ai_provider added successfully!");
  } catch (e) {
    console.log("ai_provider:", e.message);
  }
  try {
    await db.execute("ALTER TABLE habits ADD COLUMN target TEXT");
    console.log("target added to habits successfully!");
  } catch (e) {
    console.log("target:", e.message);
  }
  try {
    await db.execute("ALTER TABLE users ADD COLUMN ai_tone TEXT DEFAULT 'friendly'");
    console.log("ai_tone added successfully!");
  } catch (e) {
    console.log("ai_tone:", e.message);
  }
  try {
    await db.execute("ALTER TABLE users ADD COLUMN morning_audit INTEGER DEFAULT 1");
    console.log("morning_audit added successfully!");
  } catch (e) {
    console.log("morning_audit:", e.message);
  }
  try {
    await db.execute("ALTER TABLE users ADD COLUMN smart_alerts INTEGER DEFAULT 1");
    console.log("smart_alerts added successfully!");
  } catch (e) {
    console.log("smart_alerts:", e.message);
  }
  try {
    await db.execute("ALTER TABLE today_items ADD COLUMN habit_id INTEGER");
    console.log("habit_id added to today_items successfully!");
  } catch (e) {
    console.log("habit_id:", e.message);
  }
}
run();
