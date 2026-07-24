import db from '../lib/db.js';
import { getUserId } from '../lib/auth.js';

export default async function handler(req, res) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const type = req.query?.type || 'workouts';

  try {
    // ─── WORKOUTS ───
    if (type === 'workouts') {
      if (req.method === 'GET') {
        const result = await db.execute({ sql: 'SELECT * FROM workouts WHERE user_id = ? ORDER BY date DESC', args: [userId] });
        return res.status(200).json(result.rows);
      }
      if (req.method === 'POST') {
        const { title, category, duration_mins, calories, notes, date } = req.body;
        const result = await db.execute({
          sql: 'INSERT INTO workouts (user_id, title, category, duration_mins, calories, notes, date) VALUES (?, ?, ?, ?, ?, ?, ?)',
          args: [userId, title, category || 'General', duration_mins || 0, calories || 0, notes || '', date || new Date().toISOString().split('T')[0]]
        });
        return res.status(201).json({ id: Number(result.lastInsertRowid), title, category, duration_mins, calories, notes, date });
      }
      if (req.method === 'PUT') {
        const { id, title, category, duration_mins, calories, notes } = req.body;
        await db.execute({
          sql: 'UPDATE workouts SET title = ?, category = ?, duration_mins = ?, calories = ?, notes = ? WHERE id = ? AND user_id = ?',
          args: [title, category, duration_mins, calories, notes, id, userId]
        });
        return res.status(200).json({ success: true });
      }
      if (req.method === 'DELETE') {
        const { id } = req.body;
        await db.execute({ sql: 'DELETE FROM workouts WHERE id = ? AND user_id = ?', args: [id, userId] });
        return res.status(200).json({ success: true });
      }
    }

    // ─── BODY STATS ───
    if (type === 'body-stats') {
      if (req.method === 'GET') {
        const result = await db.execute({ sql: 'SELECT * FROM body_stats WHERE user_id = ? ORDER BY date DESC', args: [userId] });
        return res.status(200).json(result.rows);
      }
      if (req.method === 'POST') {
        const { weight, target_weight, protein, hydration, date } = req.body;
        const result = await db.execute({
          sql: 'INSERT INTO body_stats (user_id, weight, target_weight, protein, hydration, date) VALUES (?, ?, ?, ?, ?, ?)',
          args: [userId, weight || 0, target_weight || 0, protein || 0, hydration || 0, date || new Date().toISOString().split('T')[0]]
        });
        return res.status(201).json({ id: Number(result.lastInsertRowid), weight, target_weight, protein, hydration, date });
      }
      if (req.method === 'PUT') {
        const { id, weight, target_weight, protein, hydration } = req.body;
        await db.execute({
          sql: 'UPDATE body_stats SET weight = ?, target_weight = ?, protein = ?, hydration = ? WHERE id = ? AND user_id = ?',
          args: [weight, target_weight, protein, hydration, id, userId]
        });
        return res.status(200).json({ success: true });
      }
      if (req.method === 'DELETE') {
        const { id } = req.body;
        await db.execute({ sql: 'DELETE FROM body_stats WHERE id = ? AND user_id = ?', args: [id, userId] });
        return res.status(200).json({ success: true });
      }
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
