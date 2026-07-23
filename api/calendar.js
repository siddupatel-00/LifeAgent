import db from '../lib/db.js';
import { getUserId } from '../lib/auth.js';

export default async function handler(req, res) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    if (req.method === 'GET') {
      const events = await db.execute({ sql: 'SELECT * FROM calendar_events WHERE user_id = ? ORDER BY date ASC', args: [userId] });
      return res.status(200).json(events.rows);
    }
    
    if (req.method === 'POST') {
      const { title, date, end_date, color } = req.body;
      const result = await db.execute({
        sql: 'INSERT INTO calendar_events (user_id, title, date, end_date, color) VALUES (?, ?, ?, ?, ?)',
        args: [userId, title, date, end_date || null, color || '#3b82f6']
      });
      return res.status(201).json({ id: Number(result.lastInsertRowid), title, date, end_date, color });
    }
    
    if (req.method === 'DELETE') {
      const { id } = req.body;
      await db.execute({ sql: 'DELETE FROM calendar_events WHERE id = ? AND user_id = ?', args: [id, userId] });
      return res.status(200).json({ success: true });
    }
    
    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
