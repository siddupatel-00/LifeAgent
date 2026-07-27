import db, { ensureDbSchema } from '../lib/db.js';
import { getUserId } from '../lib/auth.js';

export default async function handler(req, res) {
  await ensureDbSchema();
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const currentUserReq = await db.execute({ sql: 'SELECT email FROM users WHERE id = ?', args: [userId] });
  const current = currentUserReq.rows[0];
  if (!current) return res.status(404).json({ error: 'User not found' });
  const userEmail = current.email;

  if (req.method === 'GET') {
    try {
      const result = await db.execute({
        sql: 'SELECT * FROM daily_metrics WHERE user_email = ? ORDER BY created_at DESC',
        args: [userEmail]
      });
      return res.status(200).json(result.rows);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const { date, metric_type, metric_name, metric_value } = req.body;
      
      await db.execute({
        sql: 'INSERT INTO daily_metrics (user_email, date, metric_type, metric_name, metric_value) VALUES (?, ?, ?, ?, ?)',
        args: [userEmail, date, metric_type, metric_name, metric_value.toString()]
      });
      
      return res.status(200).json({ success: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
