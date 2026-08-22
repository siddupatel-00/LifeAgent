import { handleCors } from '../lib/cors.js';
import db from '../lib/db.js';
import { getUserId } from '../lib/auth.js';

const WEEKDAY_CODES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function isScheduledOnDate(habit, dateStr) {
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return false;

  const interval = Number(habit.interval_days) || 0;
  if (interval > 0) {
    const start = new Date(`${habit.start_date || dateStr}T00:00:00`);
    const elapsedDays = Math.floor((date - start) / 86400000);
    return elapsedDays >= 0 && elapsedDays % interval === 0;
  }

  if (!habit.frequency || habit.frequency === 'daily') return true;
  if (habit.frequency !== 'custom') return true;
  const days = String(habit.custom_days || '').split(',').map(day => day.trim().slice(0, 3));
  return days.includes(WEEKDAY_CODES[date.getDay()]);
}

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
        if (habit.paused_until && habit.paused_until >= targetDate) continue;
        if (!isScheduledOnDate(habit, targetDate)) continue;
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
      const { id } = req.query?.id ? req.query : req.body;
      const { label, category, time, checked, date } = req.body || {};
      if (!id) return res.status(400).json({ error: 'Item ID required' });

      const currentRes = await db.execute({ sql: 'SELECT * FROM today_items WHERE id = ? AND user_id = ?', args: [id, userId] });
      if (currentRes.rows.length === 0) return res.status(404).json({ error: 'Item not found' });
      const current = currentRes.rows[0];

      await db.execute({
        sql: 'UPDATE today_items SET label = ?, category = ?, time = ?, checked = ?, date = ? WHERE id = ? AND user_id = ?',
        args: [
          label !== undefined ? label : current.label,
          category !== undefined ? category : current.category,
          time !== undefined ? time : current.time,
          checked !== undefined ? (checked ? 1 : 0) : current.checked,
          date !== undefined ? date : current.date,
          id, userId
        ]
      });
      const updated = await db.execute({ sql: 'SELECT * FROM today_items WHERE id = ?', args: [id] });
      return res.status(200).json(updated.rows[0]);
    }
    if (req.method === 'POST') {
      const { label, category, time, habit_id, date } = req.body;
      if (!label || !String(label).trim()) return res.status(400).json({ error: 'Title is required' });
      // Use client-provided date or default to server's date
      const itemDate = date || new Date().toISOString().split('T')[0];
      const cleanLabel = String(label).trim();
      const result = await db.execute({
        sql: 'INSERT INTO today_items (user_id, label, category, time, habit_id, date) VALUES (?, ?, ?, ?, ?, ?)',
        args: [userId, cleanLabel, category || '', time || '', habit_id || null, itemDate]
      });
      return res.status(201).json({ id: Number(result.lastInsertRowid), label: cleanLabel, category: category || '', time: time || '', habit_id: habit_id || null, date: itemDate, checked: 0 });
    }
    if (req.method === 'DELETE') {
      const id = req.query?.id ?? req.body?.id;
      if (!id) return res.status(400).json({ error: 'Item ID required' });
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
