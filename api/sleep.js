import { handleCors } from './_cors.js';
import db from '../lib/db.js';
import { getUserId } from '../lib/auth.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    if (req.method === 'GET') {
      const result = await db.execute({ 
        sql: 'SELECT * FROM sleep_logs WHERE user_id = ? ORDER BY date DESC', 
        args: [userId] 
      });
      return res.status(200).json(result.rows);
    }

    if (req.method === 'POST') {
      const { sleep_time, wake_time, quality, notes, date } = req.body;
      let hours = req.body.hours !== undefined ? Number(req.body.hours) : undefined;
      let minutes = req.body.minutes !== undefined ? Number(req.body.minutes) : undefined;

      const sTime = sleep_time || '23:00';
      const wTime = wake_time || '07:00';

      if (hours === undefined || minutes === undefined) {
        const sleepDate = new Date(`2000-01-01T${sTime}`);
        let wakeDate = new Date(`2000-01-01T${wTime}`);
        if (wakeDate <= sleepDate) wakeDate.setDate(wakeDate.getDate() + 1);
        const diffMs = wakeDate - sleepDate;
        hours = Math.floor(diffMs / (1000 * 60 * 60));
        minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      }
      
      const result = await db.execute({
        sql: 'INSERT INTO sleep_logs (user_id, sleep_time, wake_time, hours, minutes, quality, notes, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        args: [userId, sTime, wTime, hours, minutes, quality || 'Good', notes || '', date || new Date().toISOString().split('T')[0]]
      });
      return res.status(201).json({ id: Number(result.lastInsertRowid), sleep_time: sTime, wake_time: wTime, hours, minutes, quality: quality || 'Good', notes, date: date || new Date().toISOString().split('T')[0] });
    }

    if (req.method === 'PUT') {
      const { id, sleep_time, wake_time, quality, notes, date } = req.body;
      let hours = req.body.hours !== undefined ? Number(req.body.hours) : undefined;
      let minutes = req.body.minutes !== undefined ? Number(req.body.minutes) : undefined;

      const sTime = sleep_time || '23:00';
      const wTime = wake_time || '07:00';

      if (hours === undefined || minutes === undefined) {
        const sleepDate = new Date(`2000-01-01T${sTime}`);
        let wakeDate = new Date(`2000-01-01T${wTime}`);
        if (wakeDate <= sleepDate) wakeDate.setDate(wakeDate.getDate() + 1);
        const diffMs = wakeDate - sleepDate;
        hours = Math.floor(diffMs / (1000 * 60 * 60));
        minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      }
      
      if (date) {
        await db.execute({
          sql: 'UPDATE sleep_logs SET sleep_time = ?, wake_time = ?, hours = ?, minutes = ?, quality = ?, notes = ?, date = ? WHERE id = ? AND user_id = ?',
          args: [sTime, wTime, hours, minutes, quality, notes, date, id, userId]
        });
      } else {
        await db.execute({
          sql: 'UPDATE sleep_logs SET sleep_time = ?, wake_time = ?, hours = ?, minutes = ?, quality = ?, notes = ? WHERE id = ? AND user_id = ?',
          args: [sTime, wTime, hours, minutes, quality, notes, id, userId]
        });
      }
      return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      await db.execute({ sql: 'DELETE FROM sleep_logs WHERE id = ? AND user_id = ?', args: [id, userId] });
      return res.status(200).json({ success: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
