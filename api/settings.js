import db, { ensureDbSchema } from '../lib/db.js';
import { getUserId } from '../lib/auth.js';

export default async function handler(req, res) {
  await ensureDbSchema();
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    if (req.method === 'GET') {
      const result = await db.execute({ sql: 'SELECT name, email, phone, handle, theme, ai_name, gemini_api_key, groq_api_key, ai_provider, currency, ai_tone, morning_audit, smart_alerts FROM users WHERE id = ?', args: [userId] });
      if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
      
      let userSettings = { timezone: 'UTC', chat_reset_time: '00:00', last_chat_reset: null, workout_split_type: 'weekly', workout_templates: null };
      try {
        const settingsResult = await db.execute({ sql: 'SELECT timezone, chat_reset_time, last_chat_reset, workout_split_type, workout_templates FROM user_settings WHERE user_id = ?', args: [userId] });
        if (settingsResult.rows.length > 0) {
          userSettings = settingsResult.rows[0];
        }
      } catch (e) {
        console.warn('user_settings fetch fallback:', e.message);
      }

      const row = result.rows[0];
      return res.status(200).json({
        name: row.name || '',
        email: row.email || '',
        phone: row.phone || '',
        handle: row.handle || '',
        theme: row.theme || 'light',
        ai_name: row.ai_name || 'AI',
        gemini_api_key: row.gemini_api_key || '',
        groq_api_key: row.groq_api_key || '',
        ai_provider: row.ai_provider || 'gemini',
        currency: row.currency || '$',
        ai_tone: row.ai_tone || 'Analytical & Direct',
        aiTone: row.ai_tone || 'Analytical & Direct',
        morning_audit: row.morning_audit !== undefined && row.morning_audit !== null ? row.morning_audit : 1,
        morningAudit: (row.morning_audit !== undefined && row.morning_audit !== null) ? row.morning_audit !== 0 : true,
        smart_alerts: row.smart_alerts !== undefined && row.smart_alerts !== null ? row.smart_alerts : 1,
        smartAlerts: (row.smart_alerts !== undefined && row.smart_alerts !== null) ? row.smart_alerts !== 0 : true,
        ...userSettings
      });
    }
    
    if (req.method === 'PUT') {
      const body = req.body || {};
      const name = body.name;
      const email = body.email;
      const phone = body.phone;
      const handle = body.handle;
      const theme = body.theme;
      const ai_name = body.ai_name || body.aiName;
      const gemini_api_key = body.gemini_api_key !== undefined ? body.gemini_api_key : body.geminiApiKey;
      const groq_api_key = body.groq_api_key !== undefined ? body.groq_api_key : body.groqApiKey;
      const ai_provider = body.ai_provider || body.aiProvider;
      const currency = body.currency;
      const ai_tone = body.aiTone !== undefined ? body.aiTone : body.ai_tone;
      const morning_audit = body.morningAudit !== undefined ? (body.morningAudit ? 1 : 0) : (body.morning_audit !== undefined ? (body.morning_audit ? 1 : 0) : undefined);
      const smart_alerts = body.smartAlerts !== undefined ? (body.smartAlerts ? 1 : 0) : (body.smart_alerts !== undefined ? (body.smart_alerts ? 1 : 0) : undefined);
      const timezone = body.timezone;
      const chat_reset_time = body.chat_reset_time || body.chatResetTime;
      
      const workout_split_type = body.workout_split_type;
      const workout_templates = body.workout_templates;
      
      const currentUserReq = await db.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: [userId] });
      const current = currentUserReq.rows[0] || {};
      
      // Handle uniqueness validation if handle is being changed
      let finalHandle = current.handle;
      if (handle !== undefined && typeof handle === 'string' && handle.trim()) {
        const cleanNewHandle = handle.trim().startsWith('@') ? handle.trim() : `@${handle.trim()}`;
        const rawHandle = cleanNewHandle.replace(/^@/, '').toLowerCase();
        const existingHandle = await db.execute({
          sql: 'SELECT id FROM users WHERE (LOWER(handle) = ? OR LOWER(handle) = ?) AND id != ?',
          args: [`@${rawHandle}`, rawHandle, userId]
        });
        if (existingHandle.rows.length > 0) {
          return res.status(409).json({ error: `Username ${cleanNewHandle} is already taken by another user. Please choose a different username.` });
        }
        finalHandle = cleanNewHandle;
      }

      await db.execute({
        sql: 'UPDATE users SET name = ?, email = ?, phone = ?, handle = ?, theme = ?, ai_name = ?, gemini_api_key = ?, groq_api_key = ?, ai_provider = ?, currency = ?, ai_tone = ?, morning_audit = ?, smart_alerts = ? WHERE id = ?',
        args: [
          name !== undefined ? name : current.name,
          email !== undefined ? email : current.email,
          phone !== undefined ? phone : current.phone,
          finalHandle,
          theme !== undefined ? theme : current.theme,
          ai_name !== undefined ? ai_name : current.ai_name,
          gemini_api_key !== undefined ? gemini_api_key : current.gemini_api_key,
          groq_api_key !== undefined ? groq_api_key : current.groq_api_key,
          ai_provider !== undefined ? ai_provider : current.ai_provider,
          currency !== undefined ? currency : current.currency,
          ai_tone !== undefined ? ai_tone : (current.ai_tone || 'Analytical & Direct'),
          morning_audit !== undefined ? morning_audit : (current.morning_audit !== undefined && current.morning_audit !== null ? current.morning_audit : 1),
          smart_alerts !== undefined ? smart_alerts : (current.smart_alerts !== undefined && current.smart_alerts !== null ? current.smart_alerts : 1),
          userId
        ]
      });

      const currentSetReq = await db.execute({ sql: 'SELECT timezone, chat_reset_time, workout_split_type, workout_templates FROM user_settings WHERE user_id = ?', args: [userId] });
      const currentSet = currentSetReq.rows.length > 0 ? currentSetReq.rows[0] : { timezone: 'UTC', chat_reset_time: '00:00', workout_split_type: 'weekly', workout_templates: null };

      await db.execute({
        sql: 'INSERT INTO user_settings (user_id, timezone, chat_reset_time, workout_split_type, workout_templates) VALUES (?, ?, ?, ?, ?) ON CONFLICT (user_id) DO UPDATE SET timezone = excluded.timezone, chat_reset_time = excluded.chat_reset_time, workout_split_type = excluded.workout_split_type, workout_templates = excluded.workout_templates',
        args: [
          userId, 
          timezone !== undefined ? timezone : currentSet.timezone, 
          chat_reset_time !== undefined ? chat_reset_time : currentSet.chat_reset_time,
          workout_split_type !== undefined ? workout_split_type : currentSet.workout_split_type,
          workout_templates !== undefined ? workout_templates : currentSet.workout_templates
        ]
      });
      return res.status(200).json({ success: true });
    }
    
    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
