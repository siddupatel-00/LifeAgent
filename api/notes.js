import { handleCors } from '../lib/cors.js';
import db from '../lib/db.js';
import { getUserId } from '../lib/auth.js';

const getId = (req) => req.query?.id ?? req.body?.id;

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    if (req.method === 'GET') {
      const notes = await db.execute({ sql: 'SELECT * FROM notes WHERE user_id = ? AND (is_trashed = 0 OR is_trashed IS NULL) ORDER BY is_pinned DESC, date DESC, id DESC', args: [userId] });
      return res.status(200).json(notes.rows);
    }

    if (req.method === 'POST') {
      const { title, category, content, share_with_ai } = req.body;
      if (!title || !String(title).trim()) return res.status(400).json({ error: 'Title is required' });
      const result = await db.execute({
        sql: "INSERT INTO notes (user_id, title, category, content, share_with_ai, date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, date('now'), datetime('now'), datetime('now'))",
        args: [userId, String(title).trim(), category || 'Diary', content || '', share_with_ai ? 1 : 0]
      });
      return res.status(201).json({
        id: Number(result.lastInsertRowid),
        title: String(title).trim(),
        category: category || 'Diary',
        content: content || '',
        share_with_ai: share_with_ai ? 1 : 0,
        is_pinned: 0,
        is_archived: 0,
        date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString()
      });
    }

    if (req.method === 'PUT') {
      const { title, content, category, share_with_ai, is_pinned, is_archived } = req.body;
      const id = getId(req);
      if (!id) return res.status(400).json({ error: 'Note ID required' });

      const currentRes = await db.execute({ sql: 'SELECT * FROM notes WHERE id = ? AND user_id = ?', args: [id, userId] });
      if (currentRes.rows.length === 0) return res.status(404).json({ error: 'Note not found' });
      const current = currentRes.rows[0];

      await db.execute({
        sql: `UPDATE notes SET
                title = ?, content = ?, category = ?, share_with_ai = ?,
                is_pinned = ?, is_archived = ?, updated_at = datetime('now')
              WHERE id = ? AND user_id = ?`,
        args: [
          title !== undefined ? title : current.title,
          content !== undefined ? content : current.content,
          category !== undefined ? category : current.category,
          share_with_ai !== undefined ? (share_with_ai ? 1 : 0) : current.share_with_ai,
          is_pinned !== undefined ? (is_pinned ? 1 : 0) : current.is_pinned,
          is_archived !== undefined ? (is_archived ? 1 : 0) : current.is_archived,
          id, userId
        ]
      });

      const updated = await db.execute({ sql: 'SELECT * FROM notes WHERE id = ?', args: [id] });
      return res.status(200).json(updated.rows[0]);
    }

    if (req.method === 'DELETE') {
      const id = getId(req);
      if (!id) return res.status(400).json({ error: 'Note ID required' });
      await db.execute({ sql: 'DELETE FROM notes WHERE id = ? AND user_id = ?', args: [id, userId] });
      return res.status(200).json({ success: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
