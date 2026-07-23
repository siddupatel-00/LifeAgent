import db from '../lib/db.js';
import { getUserId } from '../lib/auth.js';

export default async function handler(req, res) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    if (req.method === 'GET') {
      const items = await db.execute({ sql: 'SELECT * FROM today_items WHERE user_id = ?', args: [userId] });
      return res.status(200).json(items.rows);
    }
    
    if (req.method === 'PUT') {
      const { id, checked } = req.body;
      await db.execute({
        sql: 'UPDATE today_items SET checked = ? WHERE id = ? AND user_id = ?',
        args: [checked ? 1 : 0, id, userId]
      });
      return res.status(200).json({ success: true });
    }
    if (req.method === 'POST') {
      const { label, category, time } = req.body;
      const result = await db.execute({
        sql: 'INSERT INTO today_items (user_id, label, category, time) VALUES (?, ?, ?, ?)',
        args: [userId, label, category || '', time || '']
      });
      return res.status(201).json({ id: Number(result.lastInsertRowid), label, category, time });
    }
    
    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
