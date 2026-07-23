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
}
run();
