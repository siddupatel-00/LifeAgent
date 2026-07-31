import { handleCors } from './_cors.js';
import db from '../lib/db.js';
import { getUserId } from '../lib/auth.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    if (req.method === 'GET') {
      const clientDate = /^\d{4}-\d{2}-\d{2}$/.test(req.query?.client_date || '') ? req.query.client_date : null;
      const targetDate = clientDate || new Date().toISOString().split('T')[0];

      // Fetch all habits for this user
      const habitsRes = await db.execute({
        sql: 'SELECT * FROM habits WHERE user_id = ?',
        args: [userId]
      });

      const activeHabits = habitsRes.rows.filter(h => {
        const isArchived = h.archived === 1 || h.archived === '1' || h.archived === true || h.archived === 'true';
        const isCompleted = !!(h.completed_at && h.completed_at !== '' && h.completed_at !== 'null');
        return !isArchived && !isCompleted;
      });

      const activeHabitIdStrings = activeHabits.map(h => String(h.id));

      // Purge orphaned today_items that belong to archived or deleted habits
      if (activeHabitIdStrings.length > 0) {
        const placeholders = activeHabitIdStrings.map(() => '?').join(',');
        await db.execute({
          sql: `DELETE FROM today_items WHERE user_id = ? AND habit_id IS NOT NULL AND habit_id NOT IN (${placeholders})`,
          args: [userId, ...activeHabitIdStrings]
        });
      } else {
        await db.execute({
          sql: 'DELETE FROM today_items WHERE user_id = ? AND habit_id IS NOT NULL',
          args: [userId]
        });
      }

      // Fetch today_items for targetDate
      let items = await db.execute({
        sql: 'SELECT * FROM today_items WHERE user_id = ? AND date = ?',
        args: [userId, targetDate]
      });

      // Clean up any duplicate today_items for the same habit_id or label on targetDate
      const seenHabitMap = new Map();
      const duplicateIdsToDelete = [];

      for (const row of items.rows) {
        const key = row.habit_id ? `habit:${row.habit_id}` : `label:${(row.label || '').trim().toLowerCase()}`;
        if (seenHabitMap.has(key)) {
          const prev = seenHabitMap.get(key);
          if (row.checked && !prev.checked) {
            duplicateIdsToDelete.push(prev.id);
            seenHabitMap.set(key, row);
          } else {
            duplicateIdsToDelete.push(row.id);
          }
        } else {
          seenHabitMap.set(key, row);
        }
      }

      if (duplicateIdsToDelete.length > 0) {
        const placeholders = duplicateIdsToDelete.map(() => '?').join(',');
        await db.execute({
          sql: `DELETE FROM today_items WHERE id IN (${placeholders})`,
          args: duplicateIdsToDelete
        });
        items = await db.execute({
          sql: 'SELECT * FROM today_items WHERE user_id = ? AND date = ?',
          args: [userId, targetDate]
        });
      }

      const existingHabitIdSet = new Set(items.rows.filter(t => t.habit_id).map(t => String(t.habit_id)));
      const existingLabelSet = new Set(items.rows.map(t => (t.label || '').trim().toLowerCase()));
      let needsRefetch = false;

      for (const habit of activeHabits) {
        if (habit.paused_until) continue;
        const habitLabelKey = (habit.label || '').trim().toLowerCase();
        if (existingHabitIdSet.has(String(habit.id)) || (habitLabelKey && existingLabelSet.has(habitLabelKey))) continue;

        await db.execute({
          sql: 'INSERT INTO today_items (user_id, label, category, time, habit_id, date, checked) VALUES (?, ?, ?, ?, ?, ?, 0)',
          args: [userId, habit.label, habit.category || '', '', habit.id, targetDate]
        });
        needsRefetch = true;
      }

      if (needsRefetch) {
        items = await db.execute({
          sql: 'SELECT * FROM today_items WHERE user_id = ? AND date = ?',
          args: [userId, targetDate]
        });
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
