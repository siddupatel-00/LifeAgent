import db from '../lib/db.js';
import { getUserId } from '../lib/auth.js';

export default async function handler(req, res) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    if (req.method === 'GET') {
      const result = await db.execute({ sql: 'SELECT name, email, phone, handle, theme, ai_name, gemini_api_key, groq_api_key, ai_provider, currency, ai_tone, morning_audit, smart_alerts FROM users WHERE id = ?', args: [userId] });
      if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
      
      const settingsResult = await db.execute({ sql: 'SELECT timezone, chat_reset_time, last_chat_reset FROM user_settings WHERE user_id = ?', args: [userId] });
      const userSettings = settingsResult.rows.length > 0 ? settingsResult.rows[0] : { timezone: 'UTC', chat_reset_time: '00:00', last_chat_reset: null };

      return res.status(200).json({ ...result.rows[0], ...userSettings });
    }
    
    if (req.method === 'PUT') {
      const { name, email, phone, handle, theme, ai_name, gemini_api_key, groq_api_key, ai_provider, currency, ai_tone, morning_audit, smart_alerts, timezone, chat_reset_time } = req.body;
      
      // Update users table only if relevant fields are present, or use COALESCE-like approach in Node
      const currentUserReq = await db.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: [userId] });
      const current = currentUserReq.rows[0];
      
      await db.execute({
        sql: 'UPDATE users SET name = ?, email = ?, phone = ?, handle = ?, theme = ?, ai_name = ?, gemini_api_key = ?, groq_api_key = ?, ai_provider = ?, currency = ?, ai_tone = ?, morning_audit = ?, smart_alerts = ? WHERE id = ?',
        args: [
          name !== undefined ? name : current.name,
          email !== undefined ? email : current.email,
          phone !== undefined ? phone : current.phone,
          handle !== undefined ? handle : current.handle,
          theme !== undefined ? theme : current.theme,
          ai_name !== undefined ? ai_name : current.ai_name,
          gemini_api_key !== undefined ? gemini_api_key : current.gemini_api_key,
          groq_api_key !== undefined ? groq_api_key : current.groq_api_key,
          ai_provider !== undefined ? ai_provider : current.ai_provider,
          currency !== undefined ? currency : current.currency,
          ai_tone !== undefined ? ai_tone : current.ai_tone,
          morning_audit !== undefined ? (morning_audit ? 1 : 0) : current.morning_audit,
          smart_alerts !== undefined ? (smart_alerts ? 1 : 0) : current.smart_alerts,
          userId
        ]
      });

      const currentSetReq = await db.execute({ sql: 'SELECT timezone, chat_reset_time FROM user_settings WHERE user_id = ?', args: [userId] });
      const currentSet = currentSetReq.rows.length > 0 ? currentSetReq.rows[0] : { timezone: 'UTC', chat_reset_time: '00:00' };

      await db.execute({
        sql: 'INSERT INTO user_settings (user_id, timezone, chat_reset_time) VALUES (?, ?, ?) ON CONFLICT (user_id) DO UPDATE SET timezone = excluded.timezone, chat_reset_time = excluded.chat_reset_time',
        args: [
          userId, 
          timezone !== undefined ? timezone : currentSet.timezone, 
          chat_reset_time !== undefined ? chat_reset_time : currentSet.chat_reset_time
        ]
      });
      return res.status(200).json({ success: true });
    }
    
    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
