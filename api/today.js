import { handleCors } from './_cors.js';
import db from '../lib/db.js';
import { getUserId } from '../lib/auth.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    if (req.method === 'GET') {
      // The client supplies its calendar date so a new day starts in its timezone.
      const clientDate = /^\d{4}-\d{2}-\d{2}$/.test(req.query?.client_date || '') ? req.query.client_date : null;
      // Delete any today_items that belong to archived or deleted habits
      await db.execute({
        sql: `DELETE FROM today_items WHERE user_id = ? AND habit_id IS NOT NULL AND habit_id NOT IN (
          SELECT id FROM habits WHERE user_id = ? AND (archived IS NULL OR archived = 0) AND (completed_at IS NULL OR completed_at = "")
        )`,
        args: [userId, userId]
      });

      let items;
      if (clientDate) {
        items = await db.execute({ sql: 'SELECT * FROM today_items WHERE user_id = ? AND date = ?', args: [userId, clientDate] });
      } else {
        items = await db.execute({ sql: 'SELECT * FROM today_items WHERE user_id = ? AND date = date("now")', args: [userId] });
      }
      
      const targetDate = clientDate || new Date().toISOString().split('T')[0];
      const habits = await db.execute({ sql: 'SELECT * FROM habits WHERE user_id = ? AND (archived IS NULL OR archived = 0) AND (completed_at IS NULL OR completed_at = "")', args: [userId] });
      const existingHabitIds = items.rows.filter(t => t.habit_id).map(t => t.habit_id);
      
      let needsRefetch = false;
      for (const habit of habits.rows) {
        if (habit.paused_until) continue;
        if (existingHabitIds.includes(habit.id)) continue;
        
        await db.execute({
          sql: 'INSERT INTO today_items (user_id, label, category, time, habit_id, date) VALUES (?, ?, ?, ?, ?, ?)',
          args: [userId, habit.label, habit.category, '', habit.id, targetDate]
        });
        needsRefetch = true;
      }
      
      if (needsRefetch) {
        if (clientDate) {
          items = await db.execute({ sql: 'SELECT * FROM today_items WHERE user_id = ? AND date = ?', args: [userId, clientDate] });
        } else {
          items = await db.execute({ sql: 'SELECT * FROM today_items WHERE user_id = ? AND date = date("now")', args: [userId] });
        }
      }

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
      const { label, category, time, habit_id, date } = req.body;
      // Use client-provided date or default to server's date
      const itemDate = date || new Date().toISOString().split('T')[0];
      const result = await db.execute({
        sql: 'INSERT INTO today_items (user_id, label, category, time, habit_id, date) VALUES (?, ?, ?, ?, ?, ?)',
        args: [userId, label, category || '', time || '', habit_id || null, itemDate]
      });
      return res.status(201).json({ id: Number(result.lastInsertRowid), label, category, time, habit_id: habit_id || null, date: itemDate });
    }
    if (req.method === 'DELETE') {
      const { id } = req.body;
      await db.execute({
        sql: 'DELETE FROM today_items WHERE id = ? AND user_id = ?',
        args: [id, userId]
      });
      return res.status(200).json({ success: true });
    }
    
    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
