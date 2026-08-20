import { handleCors } from '../lib/cors.js';
import db, { ensureDbSchema } from '../lib/db.js';
import { getUserId } from '../lib/auth.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  try {
    await ensureDbSchema();

    // ─── GET /api/founder : Fetch messages & user timeline telemetry for owner ───
    if (req.method === 'GET') {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const [messagesRes, usersCountRes, timelineRes, unreadRes] = await Promise.all([
        db.execute({
          sql: 'SELECT id, name, email, message, created_at, is_read FROM founder_messages ORDER BY created_at DESC LIMIT 100'
        }),
        db.execute({
          sql: 'SELECT count(*) as total FROM users'
        }),
        db.execute({
          sql: `SELECT date(created_at) as date, count(*) as count FROM users WHERE created_at IS NOT NULL GROUP BY date(created_at) ORDER BY date DESC LIMIT 30`
        }),
        db.execute({
          sql: 'SELECT count(*) as unread FROM founder_messages WHERE is_read = 0'
        })
      ]);

      const totalUsers = usersCountRes.rows?.[0]?.total || 0;
      const unreadCount = unreadRes.rows?.[0]?.unread || 0;
      const messages = messagesRes.rows || [];
      const userTimeline = (timelineRes.rows || []).map(r => ({
        date: r.date || 'Unknown',
        count: Number(r.count) || 0
      }));

      return res.status(200).json({
        totalUsers,
        unreadCount,
        messages,
        userTimeline
      });
    }

    // ─── POST /api/founder : Public message submission or owner actions ───
    if (req.method === 'POST') {
      const body = req.body || {};
      const action = req.query.action || body.action || 'send';

      // 1. Public Visitor Message Submission
      if (action === 'send' || (!body.action && body.message)) {
        const { name, email, message } = body;
        if (!message || !message.trim()) {
          return res.status(400).json({ error: 'Message content is required.' });
        }

        await db.execute({
          sql: 'INSERT INTO founder_messages (name, email, message, created_at, is_read) VALUES (?, ?, ?, datetime(\'now\'), 0)',
          args: [name?.trim() || 'Anonymous Visitor', email?.trim() || '', message.trim()]
        });

        return res.status(201).json({
          success: true,
          message: 'Your message has been sent directly to the founder. Thank you!'
        });
      }

      // 2. Owner actions: require auth
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      if (action === 'mark_read') {
        const messageId = body.id || req.query.id;
        if (!messageId) return res.status(400).json({ error: 'Message ID is required.' });

        await db.execute({
          sql: 'UPDATE founder_messages SET is_read = 1 WHERE id = ?',
          args: [messageId]
        });

        return res.status(200).json({ success: true, message: 'Message marked as read.' });
      }

      if (action === 'delete') {
        const messageId = body.id || req.query.id;
        if (!messageId) return res.status(400).json({ error: 'Message ID is required.' });

        await db.execute({
          sql: 'DELETE FROM founder_messages WHERE id = ?',
          args: [messageId]
        });

        return res.status(200).json({ success: true, message: 'Message deleted.' });
      }

      return res.status(400).json({ error: 'Unknown action.' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API /api/founder error:', error);
    return res.status(500).json({ error: 'Server error handling founder request.' });
  }
}
