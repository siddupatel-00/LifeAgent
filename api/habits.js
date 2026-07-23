import db from '../lib/db.js';
import { getUserId } from '../lib/auth.js';

export default async function handler(req, res) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    if (req.method === 'GET') {
      const habits = await db.execute({ sql: 'SELECT * FROM habits WHERE user_id = ?', args: [userId] });
      return res.status(200).json(habits.rows);
    }
    
    if (req.method === 'PUT') {
      const { id, streak, checked_today } = req.body;
      await db.execute({
        sql: 'UPDATE habits SET streak = ?, checked_today = ?, date = date("now") WHERE id = ? AND user_id = ?',
        args: [streak, checked_today ? 1 : 0, id, userId]
      });
      return res.status(200).json({ success: true });
    }
    
    if (req.method === 'POST') {
      const { label, category } = req.body;
      const result = await db.execute({
        sql: 'INSERT INTO habits (user_id, label, category) VALUES (?, ?, ?)',
        args: [userId, label, category || '']
      });
      return res.status(201).json({ id: Number(result.lastInsertRowid), label, category });
    }
    
    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
