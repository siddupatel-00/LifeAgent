import db from './lib/db.js';
import { getUserId } from './lib/auth.js';

export default async function handler(req, res) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    if (req.method === 'GET') {
      const notes = await db.execute({ sql: 'SELECT * FROM notes WHERE user_id = ? ORDER BY date DESC', args: [userId] });
      return res.status(200).json(notes.rows);
    }
    
    if (req.method === 'POST') {
      const { title, category, content, share_with_ai } = req.body;
      const result = await db.execute({
        sql: 'INSERT INTO notes (user_id, title, category, content, share_with_ai) VALUES (?, ?, ?, ?, ?)',
        args: [userId, title, category || 'Diary', content || '', share_with_ai ? 1 : 0]
      });
      return res.status(201).json({ id: Number(result.lastInsertRowid), title, category, content, share_with_ai, date: new Date().toISOString().split('T')[0] });
    }
    
    if (req.method === 'PUT') {
      const { id, title, content, share_with_ai, is_trashed, deleted_at } = req.body;
      await db.execute({
        sql: 'UPDATE notes SET title = ?, content = ?, share_with_ai = ?, is_trashed = ?, deleted_at = ?, date = date("now") WHERE id = ? AND user_id = ?',
        args: [title, content, share_with_ai ? 1 : 0, is_trashed ? 1 : 0, deleted_at || null, id, userId]
      });
      return res.status(200).json({ success: true });
    }
    
    if (req.method === 'DELETE') {
      const { id } = req.body;
      await db.execute({ sql: 'DELETE FROM notes WHERE id = ? AND user_id = ?', args: [id, userId] });
      return res.status(200).json({ success: true });
    }
    
    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
