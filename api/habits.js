import db, { ensureDbSchema } from '../lib/db.js';
import { getUserId } from '../lib/auth.js';

export default async function handler(req, res) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    await ensureDbSchema();
    if (req.method === 'GET') {
      // Habits are persistent daily items — not filtered by date
      // They persist forever, only checked_today resets daily
      const habits = await db.execute({ sql: 'SELECT * FROM habits WHERE user_id = ?', args: [userId] });
      return res.status(200).json(habits.rows);
    }
    
    if (req.method === 'PUT') {
      const { id, streak, checked_today, target, paused_until, label, category, challenge_days, archived, completed_at } = req.body;
      if (!id) return res.status(400).json({ error: 'Habit ID required' });
      
      let updateSql = 'UPDATE habits SET ';
      let args = [];
      
      if (streak !== undefined) { updateSql += 'streak = ?, '; args.push(Number(streak)); }
      if (checked_today !== undefined) { updateSql += 'checked_today = ?, '; args.push(checked_today ? 1 : 0); }
      if (target !== undefined) { updateSql += 'target = ?, '; args.push(target || ''); }
      if (paused_until !== undefined) { updateSql += 'paused_until = ?, '; args.push(paused_until || null); }
      if (label !== undefined) { updateSql += 'label = ?, '; args.push(label); }
      if (category !== undefined) { updateSql += 'category = ?, '; args.push(category); }
      if (challenge_days !== undefined) { 
        const cDays = Number(challenge_days) || 0;
        if (cDays > 0) {
          updateSql += 'challenge_days = ?, start_date = COALESCE(start_date, ?), '; 
          args.push(cDays);
          args.push(new Date().toISOString().split('T')[0]);
        } else {
          updateSql += 'challenge_days = 0, start_date = NULL, '; 
        }
      }
      if (archived !== undefined) { updateSql += 'archived = ?, '; args.push(archived ? 1 : 0); }
      if (completed_at !== undefined) { updateSql += 'completed_at = ?, '; args.push(completed_at || null); }
      
      if (args.length === 0 && challenge_days === undefined) return res.status(400).json({ error: 'No fields to update' });
      
      updateSql = updateSql.slice(0, -2);
      updateSql += ' WHERE id = ? AND user_id = ?';
      args.push(Number(id) || id, userId);

      await db.execute({ sql: updateSql, args });
      return res.status(200).json({ success: true });
    }
    
    if (req.method === 'POST') {
      const { label, category, target, challenge_days } = req.body;
      const start_date = challenge_days > 0 ? new Date().toISOString().split('T')[0] : null;
      const result = await db.execute({
        sql: 'INSERT INTO habits (user_id, label, category, target, challenge_days, start_date, archived, completed_at) VALUES (?, ?, ?, ?, ?, ?, 0, NULL)',
        args: [userId, label, category || '', target || '', challenge_days || 0, start_date]
      });
      return res.status(201).json({ id: Number(result.lastInsertRowid), label, category, target, challenge_days, start_date, archived: 0, completed_at: null });
    }
    
    if (req.method === 'DELETE') {
      const { id } = req.body;
      await db.execute({
        sql: 'DELETE FROM habits WHERE id = ? AND user_id = ?',
        args: [id, userId]
      });
      return res.status(200).json({ success: true });
    }
    
    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
