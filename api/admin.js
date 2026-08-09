import { handleCors } from '../lib/cors.js';
import db, { ensureDbSchema } from '../lib/db.js';
import { getUserId } from '../lib/auth.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;
  await ensureDbSchema();

  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { action } = req.query;
    const body = req.body || {};

    // 1. List all users
    if (req.method === 'GET' && action === 'users') {
      const result = await db.execute({
        sql: 'SELECT id, name, email, handle, phone, created_at FROM users ORDER BY id DESC',
        args: []
      });
      return res.status(200).json({ users: result.rows });
    }

    // 2. Delete any specified user account
    if (req.method === 'DELETE' || (req.method === 'POST' && (action === 'delete-user' || body.action === 'delete-user'))) {
      const targetUserId = req.query?.targetUserId || body.targetUserId || req.query?.userId || body.userId;
      const targetEmail = req.query?.targetEmail || body.targetEmail || req.query?.email || body.email;

      let targetId = targetUserId;
      if (!targetId && targetEmail) {
        const lookup = await db.execute({
          sql: 'SELECT id FROM users WHERE LOWER(email) = ?',
          args: [String(targetEmail).trim().toLowerCase()]
        });
        if (lookup.rows.length > 0) {
          targetId = lookup.rows[0].id;
        }
      }

      if (!targetId) {
        return res.status(400).json({ error: 'targetUserId or targetEmail is required to delete a user' });
      }

      const idToDel = String(targetId);
      const userReq = await db.execute({ sql: 'SELECT email FROM users WHERE id = ?', args: [idToDel] });
      const targetUserEmail = userReq.rows[0]?.email || '';

      const queries = [
        { sql: 'DELETE FROM habits WHERE user_id = ?', args: [idToDel] },
        { sql: 'DELETE FROM today_items WHERE user_id = ?', args: [idToDel] },
        { sql: 'DELETE FROM transactions WHERE user_id = ?', args: [idToDel] },
        { sql: 'DELETE FROM workouts WHERE user_id = ?', args: [idToDel] },
        { sql: 'DELETE FROM body_stats WHERE user_id = ?', args: [idToDel] },
        { sql: 'DELETE FROM notes WHERE user_id = ?', args: [idToDel] },
        { sql: 'DELETE FROM sleep_logs WHERE user_id = ?', args: [idToDel] },
        { sql: 'DELETE FROM calendar_events WHERE user_id = ?', args: [idToDel] },
        { sql: 'DELETE FROM chat_history WHERE user_id = ?', args: [idToDel] },
        { sql: 'DELETE FROM reminders WHERE user_id = ?', args: [idToDel] },
        { sql: 'DELETE FROM daily_metrics WHERE user_id = ? OR (user_email IS NOT NULL AND user_email = ?)', args: [idToDel, targetUserEmail] },
        { sql: 'DELETE FROM user_settings WHERE user_id = ?', args: [idToDel] },
        { sql: 'DELETE FROM users WHERE id = ?', args: [idToDel] }
      ];

      for (const q of queries) {
        try {
          await db.execute(q);
        } catch (e) {
          console.warn(`Admin delete user error (${q.sql}):`, e.message);
        }
      }

      return res.status(200).json({ success: true, message: `User ID ${idToDel} deleted successfully from database` });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
