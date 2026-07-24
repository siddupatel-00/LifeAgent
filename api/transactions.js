import db from '../lib/db.js';
import { getUserId } from '../lib/auth.js';

export default async function handler(req, res) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    if (req.method === 'GET') {
      const txns = await db.execute({ sql: 'SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC', args: [userId] });
      return res.status(200).json(txns.rows);
    }
    
    if (req.method === 'POST') {
      const { title, amount, type, category, notes, time, date } = req.body;
      const result = await db.execute({
        sql: 'INSERT INTO transactions (user_id, title, amount, type, category, notes, time, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        args: [userId, title, amount, type || 'spend', category || 'General', notes || '', time || '', date || new Date().toISOString().split('T')[0]]
      });
      return res.status(201).json({ id: Number(result.lastInsertRowid), title, amount, type, category, notes, time, date });
    }
    
    if (req.method === 'PUT') {
      const { id, title, amount, type, category, notes, time } = req.body;
      await db.execute({
        sql: 'UPDATE transactions SET title = ?, amount = ?, type = ?, category = COALESCE(?, category), notes = COALESCE(?, notes), time = COALESCE(?, time) WHERE id = ? AND user_id = ?',
        args: [title, amount, type, category, notes, time, id, userId]
      });
      return res.status(200).json({ success: true });
    }
    
    if (req.method === 'DELETE') {
      const { id } = req.body;
      await db.execute({ sql: 'DELETE FROM transactions WHERE id = ? AND user_id = ?', args: [id, userId] });
      return res.status(200).json({ success: true });
    }
    
    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
