import { handleCors } from '../lib/cors.js';
import db from '../lib/db.js';
import { getUserId } from '../lib/auth.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    if (req.method === 'GET') {
      const settingsResult = await db.execute({
        sql: 'SELECT timezone, chat_reset_time, last_chat_reset FROM user_settings WHERE user_id = ?',
        args: [userId]
      });

      if (settingsResult.rows.length > 0) {
        const { timezone, chat_reset_time, last_chat_reset } = settingsResult.rows[0];
        if (timezone && chat_reset_time) {
          const nowStr = new Date().toLocaleString('en-US', { timeZone: timezone });
          const userNow = new Date(nowStr);
          
          const [resetHour, resetMinute] = chat_reset_time.split(':').map(Number);
          
          let resetBoundary = new Date(userNow);
          resetBoundary.setHours(resetHour, resetMinute, 0, 0);
          
          if (userNow < resetBoundary) {
            resetBoundary.setDate(resetBoundary.getDate() - 1);
          }
          
          const lastResetDate = last_chat_reset ? new Date(last_chat_reset) : new Date(0);
          
          if (lastResetDate < resetBoundary) {
            await db.execute({ sql: 'DELETE FROM chat_history WHERE user_id = ?', args: [userId] });
            await db.execute({ sql: 'UPDATE user_settings SET last_chat_reset = ? WHERE user_id = ?', args: [new Date().toISOString(), userId] });
            return res.status(200).json([]);
          }
          
          const chat = await db.execute({ sql: 'SELECT * FROM chat_history WHERE user_id = ? ORDER BY created_at ASC', args: [userId] });
          return res.status(200).json(chat.rows);
        }
      }

      // Fallback
      const chat = await db.execute({
          sql: 'SELECT * FROM chat_history WHERE user_id = ? AND created_at >= datetime("now", "-24 hours") ORDER BY created_at ASC',
          args: [userId]
        });
        await db.execute({
          sql: 'DELETE FROM chat_history WHERE user_id = ? AND created_at < datetime("now", "-24 hours")',
          args: [userId]
        });
        return res.status(200).json(chat.rows);
    }
    
    if (req.method === 'POST') {
      // Allow batch inserting multiple messages (e.g., user + ai response together)
      const messages = Array.isArray(req.body) ? req.body : [req.body];
      
      const statements = messages.map(msg => ({
        sql: 'INSERT INTO chat_history (user_id, sender, text, time) VALUES (?, ?, ?, ?)',
        args: [userId, msg.sender, msg.text, msg.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })]
      }));
      
      if (statements.length > 0) {
        await db.batch(statements);
      }
      return res.status(201).json({ success: true });
    }
    
    if (req.method === 'DELETE') {
      await db.execute({ sql: 'DELETE FROM chat_history WHERE user_id = ?', args: [userId] });
      return res.status(200).json({ success: true, message: 'Chat history cleared' });
    }
    
    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
