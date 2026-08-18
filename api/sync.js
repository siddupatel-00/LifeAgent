import { handleCors } from '../lib/cors.js';
import db, { ensureDbSchema } from '../lib/db.js';
import { getUserId } from '../lib/auth.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    await ensureDbSchema();

    // ─── POST /api/sync : Push queued mutations ───
    if (req.method === 'POST') {
      const items = req.body?.items || [];
      
      for (const item of items) {
        const { table, op, payload, recordId } = item;
        if (!table || !payload) continue;

        try {
          if (table === 'notes') {
            if (op === 'create' || op === 'put') {
              await db.execute({
                sql: `INSERT INTO notes (id, user_id, title, content, share_with_ai, is_trashed, updated_at) 
                      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
                      ON CONFLICT(id) DO UPDATE SET title = excluded.title, content = excluded.content, share_with_ai = excluded.share_with_ai, is_trashed = excluded.is_trashed, updated_at = datetime('now')`,
                args: [recordId || payload.id, userId, payload.title || '', payload.content || '', payload.shareWithAi ? 1 : 0, payload.is_trashed ? 1 : 0]
              });
            } else if (op === 'delete') {
              await db.execute({
                sql: 'DELETE FROM notes WHERE id = ? AND user_id = ?',
                args: [recordId || payload.id, userId]
              });
            }
          } else if (table === 'habits') {
            if (op === 'create' || op === 'put') {
              await db.execute({
                sql: `INSERT INTO habits (id, user_id, title, category, streak, checked_today, paused_until, updated_at)
                      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
                      ON CONFLICT(id) DO UPDATE SET title = excluded.title, category = excluded.category, streak = excluded.streak, checked_today = excluded.checked_today, paused_until = excluded.paused_until, updated_at = datetime('now')`,
                args: [recordId || payload.id, userId, payload.title || '', payload.category || '', payload.streak || 0, payload.checkedToday ? 1 : 0, payload.pausedUntil || null]
              });
            } else if (op === 'delete') {
              await db.execute({
                sql: 'DELETE FROM habits WHERE id = ? AND user_id = ?',
                args: [recordId || payload.id, userId]
              });
            }
          } else if (table === 'todayItems') {
            if (op === 'create' || op === 'put') {
              await db.execute({
                sql: `INSERT INTO today_items (id, user_id, title, category, time, checked, habit_id, date, updated_at)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
                      ON CONFLICT(id) DO UPDATE SET title = excluded.title, category = excluded.category, time = excluded.time, checked = excluded.checked, habit_id = excluded.habit_id, updated_at = datetime('now')`,
                args: [recordId || payload.id, userId, payload.title || '', payload.category || '', payload.time || '', payload.checked ? 1 : 0, payload.habitId || null, payload.date || new Date().toISOString().split('T')[0]]
              });
            } else if (op === 'delete') {
              await db.execute({
                sql: 'DELETE FROM today_items WHERE id = ? AND user_id = ?',
                args: [recordId || payload.id, userId]
              });
            }
          } else if (table === 'transactions') {
            if (op === 'create' || op === 'put') {
              await db.execute({
                sql: `INSERT INTO transactions (id, user_id, type, amount, category, date, notes, updated_at)
                      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
                      ON CONFLICT(id) DO UPDATE SET type = excluded.type, amount = excluded.amount, category = excluded.category, date = excluded.date, notes = excluded.notes, updated_at = datetime('now')`,
                args: [recordId || payload.id, userId, payload.type || 'expense', Number(payload.amount) || 0, payload.category || 'General', payload.date || new Date().toISOString().split('T')[0], payload.notes || '']
              });
            } else if (op === 'delete') {
              await db.execute({
                sql: 'DELETE FROM transactions WHERE id = ? AND user_id = ?',
                args: [recordId || payload.id, userId]
              });
            }
          } else if (table === 'sleepLogs') {
            if (op === 'create' || op === 'put') {
              await db.execute({
                sql: `INSERT INTO sleep_logs (id, user_id, date, hours, minutes, sleep_time, wake_time, quality, notes, updated_at)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
                      ON CONFLICT(id) DO UPDATE SET date = excluded.date, hours = excluded.hours, minutes = excluded.minutes, sleep_time = excluded.sleep_time, wake_time = excluded.wake_time, quality = excluded.quality, notes = excluded.notes, updated_at = datetime('now')`,
                args: [recordId || payload.id, userId, payload.date || new Date().toISOString().split('T')[0], Number(payload.hours) || 0, Number(payload.minutes) || 0, payload.sleep_time || '23:00', payload.wake_time || '07:00', payload.quality || 'Good', payload.notes || '']
              });
            } else if (op === 'delete') {
              await db.execute({
                sql: 'DELETE FROM sleep_logs WHERE id = ? AND user_id = ?',
                args: [recordId || payload.id, userId]
              });
            }
          } else if (table === 'bodyStats') {
            if (op === 'create' || op === 'put') {
              await db.execute({
                sql: `INSERT INTO body_stats (id, user_id, date, weight, target_weight, protein, target_protein, hydration, updated_at)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
                      ON CONFLICT(id) DO UPDATE SET date = excluded.date, weight = excluded.weight, target_weight = excluded.target_weight, protein = excluded.protein, target_protein = excluded.target_protein, hydration = excluded.hydration, updated_at = datetime('now')`,
                args: [recordId || payload.id, userId, payload.date || new Date().toISOString().split('T')[0], Number(payload.weight) || 0, Number(payload.target_weight) || 0, Number(payload.protein) || 0, Number(payload.target_protein) || 0, Number(payload.hydration) || 0]
              });
            }
          }
        } catch (e) {
          console.warn('Sync table op error (non-fatal):', table, op, e);
        }
      }

      return res.status(200).json({ success: true, syncedAt: new Date().toISOString() });
    }

    // ─── GET /api/sync : Pull remote updates ───
    if (req.method === 'GET') {
      const since = req.query.since || '1970-01-01T00:00:00.000Z';

      const [notes, habits, todayItems, transactions, sleepLogs, bodyStats] = await Promise.all([
        db.execute({ sql: 'SELECT * FROM notes WHERE user_id = ?', args: [userId] }),
        db.execute({ sql: 'SELECT * FROM habits WHERE user_id = ?', args: [userId] }),
        db.execute({ sql: 'SELECT * FROM today_items WHERE user_id = ?', args: [userId] }),
        db.execute({ sql: 'SELECT * FROM transactions WHERE user_id = ?', args: [userId] }),
        db.execute({ sql: 'SELECT * FROM sleep_logs WHERE user_id = ?', args: [userId] }),
        db.execute({ sql: 'SELECT * FROM body_stats WHERE user_id = ? ORDER BY date DESC LIMIT 10', args: [userId] })
      ]);

      return res.status(200).json({
        notes: notes.rows || [],
        habits: habits.rows || [],
        todayItems: todayItems.rows || [],
        transactions: transactions.rows || [],
        sleepLogs: sleepLogs.rows || [],
        bodyStats: bodyStats.rows || [],
        syncedAt: new Date().toISOString()
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API /api/sync error:', error);
    return res.status(500).json({ error: 'Sync failed' });
  }
}
