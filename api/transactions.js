import { handleCors } from '../lib/cors.js';
import db, { ensureDbSchema } from '../lib/db.js';
import { getUserId } from '../lib/auth.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  await ensureDbSchema();
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
      const id = req.query?.id ?? req.body?.id;
      if (!id) return res.status(400).json({ error: 'Transaction ID required' });

      const currentRes = await db.execute({ sql: 'SELECT * FROM transactions WHERE id = ? AND user_id = ?', args: [id, userId] });
      if (currentRes.rows.length === 0) return res.status(404).json({ error: 'Transaction not found' });
      const current = currentRes.rows[0];
      const { title, amount, type, category, notes, time, date } = req.body || {};

      await db.execute({
        sql: 'UPDATE transactions SET title = ?, amount = ?, type = ?, category = ?, notes = ?, time = ?, date = ? WHERE id = ? AND user_id = ?',
        args: [
          title !== undefined ? title : current.title,
          amount !== undefined && amount !== null && amount !== '' ? Number(amount) : current.amount,
          type !== undefined ? type : current.type,
          category !== undefined ? category : current.category,
          notes !== undefined ? notes : current.notes,
          time !== undefined ? time : current.time,
          date !== undefined ? date : current.date,
          id, userId
        ]
      });
      const updated = await db.execute({ sql: 'SELECT * FROM transactions WHERE id = ?', args: [id] });
      return res.status(200).json(updated.rows[0]);
    }
    
    if (req.method === 'DELETE') {
      const id = req.query?.id ?? req.body?.id;
      if (!id) return res.status(400).json({ error: 'Transaction ID required' });
      await db.execute({ sql: 'DELETE FROM transactions WHERE id = ? AND user_id = ?', args: [id, userId] });
      return res.status(200).json({ success: true });
    }
    
    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
