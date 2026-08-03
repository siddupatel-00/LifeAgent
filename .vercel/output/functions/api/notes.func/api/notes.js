import { handleCors } from '../lib/cors.js';
import db from '../lib/db.js';
import { getUserId } from '../lib/auth.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

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
      if (!id) return res.status(400).json({ error: 'Note ID required' });

      const currentRes = await db.execute({ sql: 'SELECT * FROM notes WHERE id = ? AND user_id = ?', args: [id, userId] });
      if (currentRes.rows.length === 0) return res.status(404).json({ error: 'Note not found' });
      const current = currentRes.rows[0];

      const newTitle = title !== undefined ? title : current.title;
      const newContent = content !== undefined ? content : current.content;
      const newShareWithAi = share_with_ai !== undefined ? (share_with_ai ? 1 : 0) : current.share_with_ai;
      const newIsTrashed = is_trashed !== undefined ? (is_trashed ? 1 : 0) : current.is_trashed;
      const newDeletedAt = deleted_at !== undefined ? deleted_at : current.deleted_at;

      await db.execute({
        sql: 'UPDATE notes SET title = ?, content = ?, share_with_ai = ?, is_trashed = ?, deleted_at = ? WHERE id = ? AND user_id = ?',
        args: [newTitle, newContent, newShareWithAi, newIsTrashed, newDeletedAt, id, userId]
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
