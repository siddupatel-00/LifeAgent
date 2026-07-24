import db from '../lib/db.js';
import { getUserId } from '../lib/auth.js';

export default async function handler(req, res) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    if (req.method === 'GET') {
        const result = await db.execute({ sql: 'SELECT u.name, u.email, u.phone, u.handle, u.theme, u.ai_name, u.gemini_api_key, u.groq_api_key, u.ai_provider, u.currency, u.ai_tone, u.morning_audit, u.smart_alerts, s.timezone, s.ai_chat_reset_time, s.last_ai_reset_date FROM users u LEFT JOIN user_settings s ON u.id = s.user_id WHERE u.id = ?', args: [userId] });
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        return res.status(200).json(result.rows[0]);
      }
    if (req.method === 'PUT') {
        const { name, email, phone, handle, theme, ai_name, gemini_api_key, groq_api_key, ai_provider, currency, ai_tone, morning_audit, smart_alerts, timezone, ai_chat_reset_time, last_ai_reset_date } = req.body;
        await db.execute({
          sql: 'UPDATE users SET name = ?, email = ?, phone = ?, handle = ?, theme = ?, ai_name = ?, gemini_api_key = ?, groq_api_key = ?, ai_provider = ?, currency = ?, ai_tone = ?, morning_audit = ?, smart_alerts = ? WHERE id = ?',
          args: [name, email, phone, handle, theme, ai_name, gemini_api_key || '', groq_api_key || '', ai_provider || 'gemini', currency || '$', ai_tone || 'friendly', morning_audit === undefined ? 1 : (morning_audit ? 1 : 0), smart_alerts === undefined ? 1 : (smart_alerts ? 1 : 0), userId]
        });
        // Upsert into user_settings
        await db.execute({
          sql: `INSERT INTO user_settings (user_id, timezone, ai_chat_reset_time, last_ai_reset_date) VALUES (?, ?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET timezone = excluded.timezone, ai_chat_reset_time = excluded.ai_chat_reset_time, last_ai_reset_date = excluded.last_ai_reset_date`,
          args: [userId, timezone || '', ai_chat_reset_time || '12:00 AM', last_ai_reset_date || '']
        });
        return res.status(200).json({ success: true });
      }
    
    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
