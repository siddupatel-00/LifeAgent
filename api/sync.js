import { handleCors } from './_cors.js';
import db, { ensureDbSchema } from '../lib/db.js';
import { getUserId } from '../lib/auth.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    await ensureDbSchema();

    // 1. PUSH local mutations
    if (req.method === 'POST') {
      const { items } = req.body || {};
      if (!Array.isArray(items)) return res.status(400).json({ error: 'Items array required' });

      for (const item of items) {
        const { table, op, recordId, payload, updatedAt } = item;
        const nowIso = updatedAt || new Date().toISOString();

        if (table === 'habits') {
          if (op === 'delete' || payload?.is_deleted) {
            await db.execute({ sql: 'DELETE FROM habits WHERE id = ? AND user_id = ?', args: [recordId, userId] });
          } else {
            await db.execute({
              sql: `INSERT INTO habits (id, user_id, title, label, category, streak, checked_today, target, paused_until, challenge_days, start_date, archived, frequency, custom_days, interval_days, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET
                      title=excluded.title, label=excluded.label, category=excluded.category, streak=excluded.streak,
                      checked_today=excluded.checked_today, target=excluded.target, paused_until=excluded.paused_until,
                      challenge_days=excluded.challenge_days, start_date=excluded.start_date, archived=excluded.archived,
                      frequency=excluded.frequency, custom_days=excluded.custom_days, interval_days=excluded.interval_days,
                      updated_at=excluded.updated_at`,
              args: [
                recordId, userId, payload.title || payload.label || 'Habit', payload.label || payload.title || '', payload.category || '',
                payload.streak || 0, payload.checked_today ? 1 : 0, payload.target || '', payload.paused_until || null,
                payload.challenge_days || 0, payload.start_date || null, payload.archived ? 1 : 0,
                payload.frequency || 'daily', payload.custom_days || '', payload.interval_days || 0, nowIso
              ]
            });
          }
        } else if (table === 'transactions') {
          if (op === 'delete' || payload?.is_deleted) {
            await db.execute({ sql: 'DELETE FROM transactions WHERE id = ? AND user_id = ?', args: [recordId, userId] });
          } else {
            await db.execute({
              sql: `INSERT INTO transactions (id, user_id, title, amount, type, category, date, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET
                      title=excluded.title, amount=excluded.amount, type=excluded.type, category=excluded.category, date=excluded.date`,
              args: [recordId, userId, payload.title || '', payload.amount || 0, payload.type || 'spend', payload.category || 'General', payload.date || nowIso.split('T')[0], nowIso]
            });
          }
        } else if (table === 'notes') {
          if (op === 'delete' || payload?.is_deleted) {
            await db.execute({ sql: 'DELETE FROM notes WHERE id = ? AND user_id = ?', args: [recordId, userId] });
          } else {
            await db.execute({
              sql: `INSERT INTO notes (id, user_id, title, content, is_pinned, is_archived, is_trash, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET
                      title=excluded.title, content=excluded.content, is_pinned=excluded.is_pinned,
                      is_archived=excluded.is_archived, is_trash=excluded.is_trash, updated_at=excluded.updated_at`,
              args: [recordId, userId, payload.title || '', payload.content || '', payload.is_pinned ? 1 : 0, payload.is_archived ? 1 : 0, payload.is_trash ? 1 : 0, nowIso, nowIso]
            });
          }
        } else if (table === 'calendarEvents') {
          if (op === 'delete' || payload?.is_deleted) {
            await db.execute({ sql: 'DELETE FROM calendar_events WHERE id = ? AND user_id = ?', args: [recordId, userId] });
          } else {
            await db.execute({
              sql: `INSERT INTO calendar_events (id, user_id, title, date, start_time, end_time, category, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET
                      title=excluded.title, date=excluded.date, start_time=excluded.start_time, end_time=excluded.end_time, category=excluded.category`,
              args: [recordId, userId, payload.title || '', payload.date || nowIso.split('T')[0], payload.start_time || '', payload.end_time || '', payload.category || '', nowIso]
            });
          }
        } else if (table === 'bodyStats') {
          if (op === 'delete' || payload?.is_deleted) {
            await db.execute({ sql: 'DELETE FROM body_stats WHERE id = ? AND user_id = ?', args: [recordId, userId] });
          } else {
            await db.execute({
              sql: `INSERT INTO body_stats (id, user_id, date, weight, target_weight, protein, hydration)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET
                      weight=excluded.weight, target_weight=excluded.target_weight, protein=excluded.protein, hydration=excluded.hydration`,
              args: [recordId, userId, payload.date || nowIso.split('T')[0], payload.weight || 0, payload.target_weight || 0, payload.protein || 0, payload.hydration || 0]
            });
          }
        } else if (table === 'sleepLogs') {
          if (op === 'delete' || payload?.is_deleted) {
            await db.execute({ sql: 'DELETE FROM sleep_logs WHERE id = ? AND user_id = ?', args: [recordId, userId] });
          } else {
            await db.execute({
              sql: `INSERT INTO sleep_logs (id, user_id, date, duration_hours, quality, notes)
                    VALUES (?, ?, ?, ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET
                      duration_hours=excluded.duration_hours, quality=excluded.quality, notes=excluded.notes`,
              args: [recordId, userId, payload.date || nowIso.split('T')[0], payload.duration_hours || 0, payload.quality || 5, payload.notes || '']
            });
          }
        } else if (table === 'todayItems') {
          if (op === 'delete' || payload?.is_deleted) {
            await db.execute({ sql: 'DELETE FROM today_items WHERE id = ? AND user_id = ?', args: [recordId, userId] });
          } else {
            await db.execute({
              sql: `INSERT INTO today_items (id, user_id, title, category, date, habit_id, completed, is_deleted)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET
                      title=excluded.title, category=excluded.category, completed=excluded.completed, is_deleted=excluded.is_deleted`,
              args: [recordId, userId, payload.title || '', payload.category || '', payload.date || nowIso.split('T')[0], payload.habit_id || null, payload.completed ? 1 : 0, payload.is_deleted ? 1 : 0]
            });
          }
        }
      }

      return res.status(200).json({ success: true, count: items.length });
    }

    // 2. PULL remote changes
    if (req.method === 'GET') {
      const habits = await db.execute({ sql: 'SELECT * FROM habits WHERE user_id = ?', args: [userId] });
      const todayItems = await db.execute({ sql: 'SELECT * FROM today_items WHERE user_id = ?', args: [userId] });
      const transactions = await db.execute({ sql: 'SELECT * FROM transactions WHERE user_id = ?', args: [userId] });
      const notes = await db.execute({ sql: 'SELECT * FROM notes WHERE user_id = ?', args: [userId] });
      const calendarEvents = await db.execute({ sql: 'SELECT * FROM calendar_events WHERE user_id = ?', args: [userId] });
      const bodyStats = await db.execute({ sql: 'SELECT * FROM body_stats WHERE user_id = ?', args: [userId] });
      const sleepLogs = await db.execute({ sql: 'SELECT * FROM sleep_logs WHERE user_id = ?', args: [userId] });

      return res.status(200).json({
        habits: habits.rows || [],
        todayItems: todayItems.rows || [],
        transactions: transactions.rows || [],
        notes: notes.rows || [],
        calendarEvents: calendarEvents.rows || [],
        bodyStats: bodyStats.rows || [],
        sleepLogs: sleepLogs.rows || [],
        aiMessages: []
      });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error) {
    console.error('Sync API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
