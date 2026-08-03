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
    // ─── GET: Parallel fetch calendar_events + reminders (NO N+1 queries) ──────
    if (req.method === 'GET') {
      const today = new Date().toISOString().split('T')[0];

      const [_, eventsRes, remRes] = await Promise.all([
        db.execute({
          sql: `UPDATE calendar_events SET status = 'expired' WHERE user_id = ? AND date < ? AND (status = 'upcoming' OR status IS NULL) AND status != 'completed'`,
          args: [userId, today]
        }).catch(() => {}),
        db.execute({ sql: 'SELECT * FROM calendar_events WHERE user_id = ? ORDER BY date ASC', args: [userId] }),
        db.execute({ sql: "SELECT * FROM reminders WHERE entity_type = 'event' AND user_id = ?", args: [userId] })
      ]);

      const events = eventsRes.rows || [];
      const reminderRows = remRes.rows || [];

      // Group reminders by event entity_id
      const remindersByEventId = {};
      for (const r of reminderRows) {
        const eId = r.entity_id;
        if (!remindersByEventId[eId]) remindersByEventId[eId] = [];
        remindersByEventId[eId].push({
          ...r,
          reminder_time: r.reminder_time || r.time || '',
          time: r.reminder_time || r.time || ''
        });
      }

      const eventsWithReminders = events.map(event => ({
        ...event,
        reminders: remindersByEventId[event.id] || []
      }));

      return res.status(200).json(eventsWithReminders);
    }

    // ─── POST: Create calendar event + reminders ──────────────────────────────
    if (req.method === 'POST') {
      const { title, date, time, end_date, color, reminders } = req.body;
      const result = await db.execute({
        sql: 'INSERT INTO calendar_events (user_id, title, date, time, end_date, color, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        args: [userId, title, date, time || '', end_date || null, color || '#3b82f6', 'upcoming']
      });
      const newEventId = Number(result.lastInsertRowid);

      if (Array.isArray(reminders) && reminders.length > 0) {
        const remBatch = reminders.map(rem => ({
          sql: "INSERT INTO reminders (user_id, entity_type, entity_id, offset_minutes, repeat_rule, enabled, reminder_time) VALUES (?, 'event', ?, ?, ?, ?, ?)",
          args: [userId, newEventId, rem.offset_minutes || 0, rem.repeat_rule || null, rem.enabled !== undefined ? (rem.enabled ? 1 : 0) : 1, rem.reminder_time || rem.time || rem.reminderTime || null]
        }));
        await db.batch(remBatch, 'write');
      }

      return res.status(201).json({ id: newEventId, title, date, time: time || '', end_date, color, status: 'upcoming' });
    }

    // ─── PUT: Update calendar event + reminders in 1 batch ─────────────────────
    if (req.method === 'PUT') {
      const { id, title, date, time, status, reminders } = req.body;
      const batchStatements = [];

      if (status !== undefined) {
        batchStatements.push({
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
          batchStatements.push({
            sql: `UPDATE calendar_events SET ${updateFields.join(', ')} WHERE id = ? AND user_id = ?`,
            args: updateArgs
          });
        }
      }

      if (Array.isArray(reminders)) {
        batchStatements.push({ sql: "DELETE FROM reminders WHERE entity_type = 'event' AND entity_id = ?", args: [id] });
        for (const rem of reminders) {
          const timeVal = rem.reminder_time || rem.time || rem.reminderTime || null;
          batchStatements.push({
            sql: "INSERT INTO reminders (user_id, entity_type, entity_id, offset_minutes, repeat_rule, enabled, reminder_time) VALUES (?, 'event', ?, ?, ?, ?, ?)",
            args: [userId, id, rem.offset_minutes || 0, rem.repeat_rule || null, rem.enabled !== undefined ? (rem.enabled ? 1 : 0) : 1, timeVal]
          });
        }
      }

      if (batchStatements.length > 0) {
        await db.batch(batchStatements, 'write');
      }

      return res.status(200).json({ success: true });
    }

    // ─── DELETE: Delete event + reminders in 1 batch ───────────────────────────
    if (req.method === 'DELETE') {
      const { id } = req.body;
      await db.batch([
        { sql: 'DELETE FROM calendar_events WHERE id = ? AND user_id = ?', args: [id, userId] },
        { sql: "DELETE FROM reminders WHERE entity_type = 'event' AND entity_id = ?", args: [id] }
      ], 'write');
      return res.status(200).json({ success: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
