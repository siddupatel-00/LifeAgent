// api/calendar.js
import { handleCors } from '../lib/cors.js';
import dotenv from 'dotenv';
dotenv.config();
import db, { ensureDbSchema } from '../lib/db.js';
import { getUserId } from '../lib/auth.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  await ensureDbSchema();
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    if (req.method === 'GET') {
      const today = new Date().toISOString().split('T')[0];
      await db.execute({
        sql: `UPDATE calendar_events SET status = 'expired' WHERE user_id = ? AND date < ? AND (status = 'upcoming' OR status IS NULL) AND status != 'completed'`,
        args: [userId, today]
      });

      const eventsRes = await db.execute({ sql: 'SELECT * FROM calendar_events WHERE user_id = ? ORDER BY date ASC', args: [userId] });
      const events = eventsRes.rows || [];

      const eventsWithReminders = await Promise.all(events.map(async (event) => {
        const remRes = await db.execute({
          sql: "SELECT * FROM reminders WHERE entity_type = 'event' AND entity_id = ?",
          args: [event.id]
        });
        event.reminders = remRes.rows;
        return event;
      }));

      return res.status(200).json(eventsWithReminders);
    }

    if (req.method === 'POST') {
      const { title, date, time, end_date, color, reminders } = req.body;
      const result = await db.execute({
        sql: 'INSERT INTO calendar_events (user_id, title, date, time, end_date, color, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        args: [userId, title, date, time || '', end_date || null, color || '#3b82f6', 'upcoming']
      });
      const newEventId = Number(result.lastInsertRowid);

      if (Array.isArray(reminders)) {
        for (const rem of reminders) {
          await db.execute({
            sql: "INSERT INTO reminders (user_id, entity_type, entity_id, offset_minutes, repeat_rule, enabled, reminder_time) VALUES (?, 'event', ?, ?, ?, ?, ?)",
            args: [userId, newEventId, rem.offset_minutes, rem.repeat_rule || null, rem.enabled !== undefined ? (rem.enabled ? 1 : 0) : 1, rem.reminder_time || null]
          });
        }
      }

      return res.status(201).json({ id: newEventId, title, date, time: time || '', end_date, color, status: 'upcoming' });
    }

    if (req.method === 'PUT') {
      const { id, title, date, time, status, reminders } = req.body;
      if (status !== undefined) {
        await db.execute({
          sql: 'UPDATE calendar_events SET status = ? WHERE id = ? AND user_id = ?',
          args: [status, id, userId]
        });
      }

      if (time !== undefined || title !== undefined || date !== undefined) {
        let updateFields = [];
        let updateArgs = [];
        if (title !== undefined) { updateFields.push('title = ?'); updateArgs.push(title); }
        if (date !== undefined) { updateFields.push('date = ?'); updateArgs.push(date); }
        if (time !== undefined) { updateFields.push('time = ?'); updateArgs.push(time); }
        if (updateFields.length > 0) {
          updateArgs.push(id, userId);
          await db.execute({
            sql: `UPDATE calendar_events SET ${updateFields.join(', ')} WHERE id = ? AND user_id = ?`,
            args: updateArgs
          });
        }
      }

      if (Array.isArray(reminders)) {
        await db.execute({ sql: "DELETE FROM reminders WHERE entity_type = 'event' AND entity_id = ?", args: [id] });
        for (const rem of reminders) {
          await db.execute({
            sql: "INSERT INTO reminders (user_id, entity_type, entity_id, offset_minutes, repeat_rule, enabled, reminder_time) VALUES (?, 'event', ?, ?, ?, ?, ?)",
            args: [userId, id, rem.offset_minutes, rem.repeat_rule || null, rem.enabled !== undefined ? (rem.enabled ? 1 : 0) : 1, rem.reminder_time || null]
          });
        }
      }

      return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      await db.execute({ sql: 'DELETE FROM calendar_events WHERE id = ? AND user_id = ?', args: [id, userId] });
      await db.execute({ sql: "DELETE FROM reminders WHERE entity_type = 'event' AND entity_id = ?", args: [id] });
      return res.status(200).json({ success: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
