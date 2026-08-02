import { createClient } from '@libsql/client';

const db = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:local.db',
  authToken: process.env.TURSO_AUTH_TOKEN || '',
});

async function run() {
  try {
    const res = await db.execute('SELECT * FROM transactions');
    const transactions = res.rows;
    console.log(`Found ${transactions.length} total transactions.`);
    
    // Find duplicates based on title, amount, date
    const seen = new Set();
    const toDelete = [];
    
    for (const t of transactions) {
      const key = `${t.user_id}-${t.title}-${t.amount}-${t.date}`;
      if (seen.has(key)) {
        toDelete.push(t.id);
      } else {
        seen.add(key);
      }
    }
    
    console.log(`Found ${toDelete.length} duplicates to delete.`);
    
    for (const id of toDelete) {
      await db.execute({ sql: 'DELETE FROM transactions WHERE id = ?', args: [id] });
    }
    console.log('Duplicates removed successfully!');
  } catch(e) {
    console.error(e);
  }
}
run();
