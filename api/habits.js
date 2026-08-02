import { handleCors } from '../lib/cors.js';
import db, { ensureDbSchema } from '../lib/db.js';
import { getUserId } from '../lib/auth.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    await ensureDbSchema();
    if (req.method === 'GET') {
      // Habits are persistent daily items — not filtered by date
      // They persist forever, only checked_today resets daily
      const habitResult = await db.execute({ sql: 'SELECT * FROM habits WHERE user_id = ?', args: [userId] });
        const habitRows = habitResult.rows;
        // Fetch reminders for each habit
        const habitsWithReminders = await Promise.all(habitRows.map(async (habit) => {
          const remindersRes = await db.execute({
            sql: "SELECT * FROM reminders WHERE entity_type = 'habit' AND entity_id = ?",
            args: [habit.id]
          });
          habit.reminders = remindersRes.rows;
          return habit;
        }));
        return res.status(200).json(habitsWithReminders);
    }
    
    if (req.method === 'PUT') {
      const { id, streak, checked_today, target, paused_until, label, category, challenge_days, archived, completed_at, frequency, custom_days, interval_days } = req.body;
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
      if (frequency !== undefined) { updateSql += 'frequency = ?, '; args.push(frequency || 'daily'); }
      if (custom_days !== undefined) { 
        const cdVal = Array.isArray(custom_days) ? custom_days.join(',') : (custom_days || '');
        updateSql += 'custom_days = ?, '; 
        args.push(cdVal); 
      }
      if (interval_days !== undefined) {
        const iDays = Number(interval_days) || 0;
        updateSql += 'interval_days = ?, ';
        args.push(iDays);
        if (iDays > 0) {
          updateSql += 'start_date = COALESCE(start_date, ?), ';
          args.push(new Date().toISOString().split('T')[0]);
        }
      }
      
      if (args.length === 0 && challenge_days === undefined) return res.status(400).json({ error: 'No fields to update' });
      
      updateSql = updateSql.slice(0, -2);
      updateSql += ' WHERE id = ? AND user_id = ?';
      args.push(Number(id) || id, userId);

      await db.execute({ sql: updateSql, args });
        // Update reminders if provided
        if (Array.isArray(req.body.reminders)) {
          // Remove existing reminders for this habit
          await db.execute({ sql: "DELETE FROM reminders WHERE entity_type = 'habit' AND entity_id = ?", args: [id] });
          for (const rem of req.body.reminders) {
            await db.execute({
              sql: "INSERT INTO reminders (user_id, entity_type, entity_id, offset_minutes, repeat_rule, enabled, reminder_time) VALUES (?, 'habit', ?, ?, ?, ?, ?)",
              args: [userId, id, rem.offset_minutes, rem.repeat_rule || null, rem.enabled !== undefined ? (rem.enabled ? 1 : 0) : 1, rem.reminder_time || null]
            });
          }
        }
        return res.status(200).json({ success: true });
    }
    
    if (req.method === 'POST') {
      const { label, category, target, challenge_days, frequency, custom_days, interval_days, client_date } = req.body;
      const freqVal = frequency || 'daily';
      const cdVal = Array.isArray(custom_days) ? custom_days.join(',') : (custom_days || '');
      const intervalVal = Number(interval_days) || 0;
      const start_date = (challenge_days > 0 || intervalVal > 0) ? new Date().toISOString().split('T')[0] : (req.body.start_date || new Date().toISOString().split('T')[0]);
      const result = await db.execute({
        sql: 'INSERT INTO habits (user_id, label, category, target, challenge_days, start_date, archived, completed_at, frequency, custom_days, interval_days) VALUES (?, ?, ?, ?, ?, ?, 0, NULL, ?, ?, ?)',
        args: [userId, label, category || '', target || '', challenge_days || 0, start_date, freqVal, cdVal, intervalVal]
      });

      const newHabitId = Number(result.lastInsertRowid);
      // Insert reminders if provided
      if (Array.isArray(req.body.reminders)) {
        for (const rem of req.body.reminders) {
          await db.execute({
            sql: "INSERT INTO reminders (user_id, entity_type, entity_id, offset_minutes, repeat_rule, enabled, reminder_time) VALUES (?, 'habit', ?, ?, ?, ?, ?)",
            args: [userId, newHabitId, rem.offset_minutes, rem.repeat_rule || null, rem.enabled !== undefined ? (rem.enabled ? 1 : 0) : 1, rem.reminder_time || null]
          });
        }
      }

      const todayDate = /^\d{4}-\d{2}-\d{2}$/.test(client_date || '') ? client_date : new Date().toISOString().split('T')[0];

      try {
        await db.execute({
          sql: 'INSERT INTO today_items (user_id, label, category, time, habit_id, date, checked) VALUES (?, ?, ?, ?, ?, ?, 0)',
          args: [userId, label, category || '', '', newHabitId, todayDate]
        });
      } catch (tErr) {
        console.error('Failed to create today item in POST /api/habits:', tErr);
      }

      return res.status(201).json({ id: newHabitId, label, category, target, challenge_days, start_date, archived: 0, completed_at: null, frequency: freqVal, custom_days: cdVal, interval_days: intervalVal });
    }
    
    if (req.method === 'DELETE') {
      const { id } = req.body;
      await db.execute({
        sql: 'DELETE FROM habits WHERE id = ? AND user_id = ?',
        args: [id, userId]
      });
      await db.execute({
        sql: 'DELETE FROM today_items WHERE habit_id = ? AND user_id = ?',
        args: [id, userId]
      });
      return res.status(200).json({ success: true });
    }
    
    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
