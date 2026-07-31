import { ensureDbSchema } from './lib/db.js';
async function test() {
  try {
    await ensureDbSchema();
    console.log("Schema creation success!");
  } catch(e) {
    console.error("Schema Error:", e);
  }
}
test();
