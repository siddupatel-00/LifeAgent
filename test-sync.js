import db from './lib/db.js';
import handler from './api/sync.js';

const mockReq = { method: 'GET', headers: {} };
const mockRes = {
  status: (code) => ({
    json: (data) => console.log('STATUS:', code, 'DATA:', data)
  })
};

async function test() {
  try {
    // We can't easily mock auth, let's just see if db execute fails
    const habits = await db.execute({ sql: 'SELECT * FROM habits LIMIT 1', args: [] });
    console.log("DB connection OK");
  } catch(e) {
    console.error("DB Error:", e);
  }
}
test();
