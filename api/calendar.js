import dotenv from 'dotenv';
dotenv.config();
import db from '../lib/db.js';
import { getUserId } from '../lib/auth.js';

export default async function handler(req, res) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    if (req.method === 'GET') {
      const today = new Date().toISOString().split('T')[0];
      await db.execute({
        sql: `UPDATE calendar_events SET status = 'expired' WHERE user_id = ? AND date < ? AND (status = 'upcoming' OR status IS NULL)`,
        args: [userId, today]
      });

      const events = await db.execute({ sql: 'SELECT * FROM calendar_events WHERE user_id = ? ORDER BY date ASC', args: [userId] });
      return res.status(200).json(events.rows || []);
    }
    
    if (req.method === 'POST') {
      const { title, date, end_date, color } = req.body;
      const result = await db.execute({
        sql: 'INSERT INTO calendar_events (user_id, title, date, end_date, color, status) VALUES (?, ?, ?, ?, ?, ?)',
        args: [userId, title, date, end_date || null, color || '#3b82f6', 'upcoming']
      });
      return res.status(201).json({ id: Number(result.lastInsertRowid), title, date, end_date, color, status: 'upcoming' });
    }

    if (req.method === 'PUT') {
      const { id, status } = req.body;
      await db.execute({
        sql: 'UPDATE calendar_events SET status = ? WHERE id = ? AND user_id = ?',
        args: [status, id, userId]
      });
      return res.status(200).json({ success: true });
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
