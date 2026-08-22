import { handleCors } from '../lib/cors.js';
import db from '../lib/db.js';
import { getUserId } from '../lib/auth.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const type = req.query?.type || (req.body?.type === 'sleep' ? 'sleep' : req.body?.protein !== undefined || req.body?.target_protein !== undefined ? 'body-stats' : 'workouts');

  try {
    // ─── SLEEP LOGS ───
    if (type === 'sleep') {
      if (req.method === 'GET') {
        const result = await db.execute({ sql: 'SELECT * FROM sleep_logs WHERE user_id = ? ORDER BY date DESC', args: [userId] });
        return res.status(200).json(result.rows);
      }
      if (req.method === 'POST') {
        const { sleep_time, wake_time, quality, notes, date } = req.body;
        let hours = req.body.hours !== undefined ? Number(req.body.hours) : undefined;
        let minutes = req.body.minutes !== undefined ? Number(req.body.minutes) : undefined;
        const sTime = sleep_time || '23:00';
        const wTime = wake_time || '07:00';
        if (hours === undefined || minutes === undefined) {
          [hours, minutes] = computeSleepDuration(sTime, wTime);
        }
        const logDate = date || new Date().toISOString().split('T')[0];
        const result = await db.execute({
          sql: 'INSERT INTO sleep_logs (user_id, sleep_time, wake_time, hours, minutes, quality, notes, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          args: [userId, sTime, wTime, hours, minutes, quality || 'Good', notes || '', logDate]
        });
        return res.status(201).json({ id: Number(result.lastInsertRowid), sleep_time: sTime, wake_time: wTime, hours, minutes, quality: quality || 'Good', notes: notes || '', date: logDate });
      }
      if (req.method === 'PUT') {
        const id = req.query?.id ?? req.body?.id;
        if (!id) return res.status(400).json({ error: 'Sleep log ID required' });

        const currentRes = await db.execute({ sql: 'SELECT * FROM sleep_logs WHERE id = ? AND user_id = ?', args: [id, userId] });
        if (currentRes.rows.length === 0) return res.status(404).json({ error: 'Sleep log not found' });
        const current = currentRes.rows[0];
        const { sleep_time, wake_time, quality, notes } = req.body || {};

        const sTime = sleep_time !== undefined ? sleep_time : current.sleep_time;
        const wTime = wake_time !== undefined ? wake_time : current.wake_time;
        const [hours, minutes] = computeSleepDuration(sTime, wTime);
        const newQuality = quality !== undefined ? quality : current.quality;
        const newNotes = notes !== undefined ? notes : current.notes;

        await db.execute({
          sql: 'UPDATE sleep_logs SET sleep_time = ?, wake_time = ?, hours = ?, minutes = ?, quality = ?, notes = ? WHERE id = ? AND user_id = ?',
          args: [sTime, wTime, hours, minutes, newQuality, newNotes, id, userId]
        });
        const updated = await db.execute({ sql: 'SELECT * FROM sleep_logs WHERE id = ?', args: [id] });
        return res.status(200).json(updated.rows[0]);
      }
      if (req.method === 'DELETE') {
        const id = req.query?.id ?? req.body?.id;
        if (!id) return res.status(400).json({ error: 'Sleep log ID required' });
        await db.execute({ sql: 'DELETE FROM sleep_logs WHERE id = ? AND user_id = ?', args: [id, userId] });
        return res.status(200).json({ success: true });
      }
    }
    // ─── WORKOUTS ───
    if (type === 'workouts') {
      if (req.method === 'GET') {
        const result = await db.execute({ sql: 'SELECT * FROM workouts WHERE user_id = ? ORDER BY date DESC', args: [userId] });
        return res.status(200).json(result.rows);
      }
      if (req.method === 'POST') {
        const { title, category, duration_mins, calories, notes, date } = req.body;
        if (!title || !String(title).trim()) return res.status(400).json({ error: 'Workout title is required' });
        const logDate = date || new Date().toISOString().split('T')[0];
        const result = await db.execute({
          sql: 'INSERT INTO workouts (user_id, title, category, duration_mins, calories, notes, date) VALUES (?, ?, ?, ?, ?, ?, ?)',
          args: [userId, String(title).trim(), category || 'General', Number(duration_mins) || 0, Number(calories) || 0, notes || '', logDate]
        });
        return res.status(201).json({ id: Number(result.lastInsertRowid), title: String(title).trim(), category: category || 'General', duration_mins: Number(duration_mins) || 0, calories: Number(calories) || 0, notes: notes || '', date: logDate });
      }
      if (req.method === 'PUT') {
        const id = req.query?.id ?? req.body?.id;
        if (!id) return res.status(400).json({ error: 'Workout ID required' });

        const currentRes = await db.execute({ sql: 'SELECT * FROM workouts WHERE id = ? AND user_id = ?', args: [id, userId] });
        if (currentRes.rows.length === 0) return res.status(404).json({ error: 'Workout not found' });
        const current = currentRes.rows[0];
        const { title, category, duration_mins, calories, notes, date } = req.body || {};

        await db.execute({
          sql: 'UPDATE workouts SET title = ?, category = ?, duration_mins = ?, calories = ?, notes = ?, date = ? WHERE id = ? AND user_id = ?',
          args: [
            title !== undefined ? title : current.title,
            category !== undefined ? category : current.category,
            duration_mins !== undefined && duration_mins !== '' ? Number(duration_mins) : current.duration_mins,
            calories !== undefined && calories !== '' ? Number(calories) : current.calories,
            notes !== undefined ? notes : current.notes,
            date !== undefined ? date : current.date,
            id, userId
          ]
        });
        const updated = await db.execute({ sql: 'SELECT * FROM workouts WHERE id = ?', args: [id] });
        return res.status(200).json(updated.rows[0]);
      }
      if (req.method === 'DELETE') {
        const id = req.query?.id ?? req.body?.id;
        if (!id) return res.status(400).json({ error: 'Workout ID required' });
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
        const id = req.query?.id ?? req.body?.id;
        if (!id) return res.status(400).json({ error: 'Body stat ID required' });
        await db.execute({ sql: 'DELETE FROM body_stats WHERE id = ? AND user_id = ?', args: [id, userId] });
        return res.status(200).json({ success: true });
      }
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

function computeSleepDuration(sleepTime, wakeTime) {
  const parse = (t) => {
    const [h, m] = String(t || '00:00').split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };
  let start = parse(sleepTime);
  let end = parse(wakeTime);
  if (end <= start) end += 24 * 60;
  const diff = end - start;
  return [Math.floor(diff / 60), diff % 60];
}
