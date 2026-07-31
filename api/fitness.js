import { handleCors } from '../lib/cors.js';
import db from '../lib/db.js';
import { getUserId } from '../lib/auth.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const type = req.query?.type || (req.body?.protein !== undefined || req.body?.target_protein !== undefined ? 'body-stats' : 'workouts');

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
      if (req.method === 'POST' || req.method === 'PUT') {
        const { id, weight, target_weight, protein, target_protein, hydration, date } = req.body;
        const targetDate = date || new Date().toISOString().split('T')[0];

        // Find existing record by id or date
        let existing = null;
        if (id) {
          const exRes = await db.execute({ sql: 'SELECT * FROM body_stats WHERE id = ? AND user_id = ?', args: [id, userId] });
          if (exRes.rows.length > 0) existing = exRes.rows[0];
        }
        if (!existing) {
          const exRes = await db.execute({ sql: 'SELECT * FROM body_stats WHERE user_id = ? AND date = ?', args: [userId, targetDate] });
          if (exRes.rows.length > 0) existing = exRes.rows[0];
        }

        if (existing) {
          const newWeight = weight !== undefined && weight !== null ? Number(weight) : existing.weight;
          const newTargetWeight = target_weight !== undefined && target_weight !== null ? Number(target_weight) : existing.target_weight;
          const newProtein = protein !== undefined && protein !== null ? Number(protein) : existing.protein;
          const newTargetProtein = target_protein !== undefined && target_protein !== null ? Number(target_protein) : existing.target_protein;
          const newHydration = hydration !== undefined && hydration !== null ? Number(hydration) : existing.hydration;

          await db.execute({
            sql: 'UPDATE body_stats SET weight = ?, target_weight = ?, protein = ?, target_protein = ?, hydration = ? WHERE id = ? AND user_id = ?',
            args: [newWeight, newTargetWeight, newProtein, newTargetProtein, newHydration, existing.id, userId]
          });
          return res.status(200).json({ id: existing.id, user_id: userId, weight: newWeight, target_weight: newTargetWeight, protein: newProtein, target_protein: newTargetProtein, hydration: newHydration, date: existing.date });
        } else {
          const newWeight = weight !== undefined && weight !== null ? Number(weight) : 0;
          const newTargetWeight = target_weight !== undefined && target_weight !== null ? Number(target_weight) : 0;
          const newProtein = protein !== undefined && protein !== null ? Number(protein) : 0;
          const newTargetProtein = target_protein !== undefined && target_protein !== null ? Number(target_protein) : 0;
          const newHydration = hydration !== undefined && hydration !== null ? Number(hydration) : 0;

          const result = await db.execute({
            sql: 'INSERT INTO body_stats (user_id, weight, target_weight, protein, target_protein, hydration, date) VALUES (?, ?, ?, ?, ?, ?, ?)',
            args: [userId, newWeight, newTargetWeight, newProtein, newTargetProtein, newHydration, targetDate]
          });
          return res.status(201).json({ id: Number(result.lastInsertRowid), user_id: userId, weight: newWeight, target_weight: newTargetWeight, protein: newProtein, target_protein: newTargetProtein, hydration: newHydration, date: targetDate });
        }
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
