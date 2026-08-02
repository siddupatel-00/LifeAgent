import { handleCors } from '../lib/cors.js';
import db, { ensureDbSchema } from '../lib/db.js';
import { getUserId } from '../lib/auth.js';

async function resetUserData(userId) {
  const currentUserReq = await db.execute({ sql: 'SELECT email FROM users WHERE id = ?', args: [userId] });
  const userEmail = currentUserReq.rows[0]?.email;

  const queries = [
    { sql: 'DELETE FROM habits WHERE user_id = ?', args: [userId] },
    { sql: 'DELETE FROM today_items WHERE user_id = ?', args: [userId] },
    { sql: 'DELETE FROM transactions WHERE user_id = ?', args: [userId] },
    { sql: 'DELETE FROM workouts WHERE user_id = ?', args: [userId] },
    { sql: 'DELETE FROM body_stats WHERE user_id = ?', args: [userId] },
    { sql: 'DELETE FROM notes WHERE user_id = ?', args: [userId] },
    { sql: 'DELETE FROM sleep_logs WHERE user_id = ?', args: [userId] },
    { sql: 'DELETE FROM calendar_events WHERE user_id = ?', args: [userId] },
    { sql: 'DELETE FROM chat_history WHERE user_id = ?', args: [userId] },
    { sql: 'DELETE FROM reminders WHERE user_id = ?', args: [userId] },
    { sql: 'DELETE FROM daily_metrics WHERE user_id = ? OR (user_email IS NOT NULL AND user_email = ?)', args: [userId, userEmail || ''] },
    { sql: "INSERT INTO user_settings (user_id, workout_templates, workout_split_type) VALUES (?, NULL, 'weekly') ON CONFLICT (user_id) DO UPDATE SET workout_templates = NULL, workout_split_type = 'weekly'", args: [userId] }
  ];

  for (const q of queries) {
    try {
      await db.execute(q);
    } catch (e) {
      console.warn(`Reset table deletion warning (${q.sql}):`, e.message);
    }
  }
}

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  await ensureDbSchema();
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    if (req.method === 'DELETE' || (req.method === 'POST' && (req.query?.action === 'reset-all' || req.body?.action === 'reset-all'))) {
      await resetUserData(userId);
      return res.status(200).json({ success: true, message: 'All account data reset successfully' });
    }

    if (req.method === 'GET') {
      const result = await db.execute({ sql: 'SELECT name, email, phone, handle, theme, ai_name, gemini_api_key, groq_api_key, ai_provider, currency, ai_tone, morning_audit, smart_alerts, week_start_day, sync_to_cloud FROM users WHERE id = ?', args: [userId] });
      if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });

      let userSettings = {
        timezone: 'UTC',
        chat_reset_time: '00:00',
        last_chat_reset: null,
        workout_split_type: 'weekly',
        workout_templates: null,
        week_start_day: 'Monday',
        // Reminder defaults
        reminders_global_enabled: 1,
        water_target_goal: 2.5,
        water_reminder_interval: 60,
        water_reminder_enabled: 0,
        water_reminder_start: '08:00',
        water_reminder_end: '22:00',
        sleep_reminder_enabled: 0,
        sleep_reminder_time: '22:00',
        workout_reminder_enabled: 0,
        workout_reminder_time: '07:00',
        workout_reminder_repeat: '{"type":"daily"}',
        summary_reminder_enabled: 0,
        summary_reminder_time: '07:00',
      };

      try {
        const settingsResult = await db.execute({
          sql: `SELECT timezone, chat_reset_time, last_chat_reset, workout_split_type, workout_templates,
                week_start_day, water_target_goal, water_reminder_interval, water_reminder_enabled,
                water_reminder_start, water_reminder_end,
                reminders_global_enabled,
                sleep_reminder_enabled, sleep_reminder_time,
                workout_reminder_enabled, workout_reminder_time, workout_reminder_repeat,
                summary_reminder_enabled, summary_reminder_time,
                workout_start_count, manual_day_offset
                FROM user_settings WHERE user_id = ?`,
          args: [userId]
        });
        if (settingsResult.rows.length > 0) {
          userSettings = { ...userSettings, ...settingsResult.rows[0] };
        }
      } catch (e) {
        console.warn('user_settings fetch fallback:', e.message);
      }

      const row = result.rows[0];
      const weekStartDay = row.week_start_day || userSettings.week_start_day || 'Monday';
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
        week_start_day: weekStartDay,
        weekStartDay: weekStartDay,
        sync_to_cloud: row.sync_to_cloud !== undefined && row.sync_to_cloud !== null ? row.sync_to_cloud : 1,
        syncToCloud: (row.sync_to_cloud !== undefined && row.sync_to_cloud !== null) ? row.sync_to_cloud !== 0 : true,
        ...userSettings,
        // Boolean convenience aliases for frontend
        remindersGlobalEnabled: userSettings.reminders_global_enabled !== undefined && userSettings.reminders_global_enabled !== null ? userSettings.reminders_global_enabled !== 0 : true,
        waterReminderEnabled: userSettings.water_reminder_enabled !== 0,
        sleepReminderEnabled: userSettings.sleep_reminder_enabled !== 0,
        workoutReminderEnabled: userSettings.workout_reminder_enabled !== 0,
        summaryReminderEnabled: userSettings.summary_reminder_enabled !== 0,
      });
    }

    if (req.method === 'PUT') {
      const body = req.body || {};
      const name = body.name;
      const email = body.email;
      const phone = body.phone;
      const handle = body.handle;
      const theme = body.theme;
      const ai_name = body.ai_name;
      const gemini_api_key = body.gemini_api_key;
      const groq_api_key = body.groq_api_key;
      const ai_provider = body.ai_provider;
      const currency = body.currency;
      const timezone = body.timezone;
      const chat_reset_time = body.chat_reset_time;
      const ai_tone = body.ai_tone || body.aiTone;
      const morning_audit = body.morning_audit !== undefined ? (body.morning_audit ? 1 : 0) : (body.morningAudit !== undefined ? (body.morningAudit ? 1 : 0) : undefined);
      const smart_alerts = body.smart_alerts !== undefined ? (body.smart_alerts ? 1 : 0) : (body.smartAlerts !== undefined ? (body.smartAlerts ? 1 : 0) : undefined);
      const week_start_day = body.week_start_day || body.weekStartDay;
      const sync_to_cloud = body.sync_to_cloud !== undefined ? (body.sync_to_cloud ? 1 : 0) : (body.syncToCloud !== undefined ? (body.syncToCloud ? 1 : 0) : undefined);
      
      const workout_split_type = body.workout_split_type;
      const workout_templates = body.workout_templates;
      const workout_start_count = body.workout_start_count;
      const manual_day_offset = body.manual_day_offset;
      const water_target_goal = body.water_target_goal;
      const water_reminder_interval = body.water_reminder_interval;
      const water_reminder_enabled = body.water_reminder_enabled !== undefined ? (body.water_reminder_enabled ? 1 : 0) : (body.waterReminderEnabled !== undefined ? (body.waterReminderEnabled ? 1 : 0) : undefined);
      const water_reminder_start = body.water_reminder_start;
      const water_reminder_end = body.water_reminder_end;

      const reminders_global_enabled = body.remindersGlobalEnabled !== undefined
        ? (body.remindersGlobalEnabled ? 1 : 0)
        : (body.reminders_global_enabled !== undefined ? (body.reminders_global_enabled ? 1 : 0) : undefined);

      const sleep_reminder_enabled = body.sleepReminderEnabled !== undefined ? (body.sleepReminderEnabled ? 1 : 0) : (body.sleep_reminder_enabled !== undefined ? (body.sleep_reminder_enabled ? 1 : 0) : undefined);
      const sleep_reminder_time = body.sleepReminderTime || body.sleep_reminder_time;

      const workout_reminder_enabled = body.workoutReminderEnabled !== undefined ? (body.workoutReminderEnabled ? 1 : 0) : (body.workout_reminder_enabled !== undefined ? (body.workout_reminder_enabled ? 1 : 0) : undefined);
      const workout_reminder_time = body.workoutReminderTime || body.workout_reminder_time;
      const workout_reminder_repeat = body.workoutReminderRepeat !== undefined
        ? (typeof body.workoutReminderRepeat === 'string' ? body.workoutReminderRepeat : JSON.stringify(body.workoutReminderRepeat))
        : (body.workout_reminder_repeat !== undefined ? (typeof body.workout_reminder_repeat === 'string' ? body.workout_reminder_repeat : JSON.stringify(body.workout_reminder_repeat)) : undefined);

      const summary_reminder_enabled = body.summaryReminderEnabled !== undefined ? (body.summaryReminderEnabled ? 1 : 0) : (body.summary_reminder_enabled !== undefined ? (body.summary_reminder_enabled ? 1 : 0) : undefined);
      const summary_reminder_time = body.summaryReminderTime || body.summary_reminder_time;

      const currentRes = await db.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: [userId] });
      const current = currentRes.rows[0] || {};

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
        sql: `UPDATE users SET
                name = ?, email = ?, phone = ?, handle = ?, theme = ?, ai_name = ?,
                gemini_api_key = ?, groq_api_key = ?, ai_provider = ?, currency = ?,
                ai_tone = ?, morning_audit = ?, smart_alerts = ?, week_start_day = ?,
                sync_to_cloud = ?
              WHERE id = ?`,
        args: [
          name !== undefined ? name : (current.name || ''),
          email !== undefined ? email : (current.email || ''),
          phone !== undefined ? phone : (current.phone || ''),
          finalHandle,
          theme !== undefined ? theme : (current.theme || 'light'),
          ai_name !== undefined ? ai_name : (current.ai_name || 'AI'),
          gemini_api_key !== undefined ? gemini_api_key : (current.gemini_api_key || ''),
          groq_api_key !== undefined ? groq_api_key : (current.groq_api_key || ''),
          ai_provider !== undefined ? ai_provider : (current.ai_provider || 'gemini'),
          currency !== undefined ? currency : (current.currency || '$'),
          ai_tone !== undefined ? ai_tone : (current.ai_tone || 'Analytical & Direct'),
          morning_audit !== undefined ? morning_audit : (current.morning_audit !== undefined && current.morning_audit !== null ? current.morning_audit : 1),
          smart_alerts !== undefined ? smart_alerts : (current.smart_alerts !== undefined && current.smart_alerts !== null ? current.smart_alerts : 1),
          week_start_day !== undefined ? week_start_day : (current.week_start_day || 'Monday'),
          sync_to_cloud !== undefined ? sync_to_cloud : (current.sync_to_cloud !== undefined && current.sync_to_cloud !== null ? current.sync_to_cloud : 1),
          userId
        ]
      });

      const currentSetReq = await db.execute({
        sql: `SELECT timezone, chat_reset_time, workout_split_type, workout_templates, week_start_day,
              water_target_goal, water_reminder_interval, water_reminder_enabled, water_reminder_start, water_reminder_end,
              reminders_global_enabled,
              sleep_reminder_enabled, sleep_reminder_time,
              workout_reminder_enabled, workout_reminder_time, workout_reminder_repeat,
              summary_reminder_enabled, summary_reminder_time,
              workout_start_count, manual_day_offset
              FROM user_settings WHERE user_id = ?`,
        args: [userId]
      });
      const currentSet = currentSetReq.rows.length > 0 ? currentSetReq.rows[0] : {
        timezone: 'UTC', chat_reset_time: '00:00', workout_split_type: 'weekly',
        workout_templates: null, week_start_day: 'Monday',
        water_target_goal: 2.5, water_reminder_interval: 60, water_reminder_enabled: 0,
        water_reminder_start: '08:00', water_reminder_end: '22:00',
        reminders_global_enabled: 1,
        sleep_reminder_enabled: 0, sleep_reminder_time: '22:00',
        workout_reminder_enabled: 0, workout_reminder_time: '07:00', workout_reminder_repeat: '{"type":"daily"}',
        summary_reminder_enabled: 0, summary_reminder_time: '07:00',
        workout_start_count: 0, manual_day_offset: 0
      };

      await db.execute({
        sql: `INSERT INTO user_settings (
                user_id, timezone, chat_reset_time, workout_split_type, workout_templates, week_start_day,
                water_target_goal, water_reminder_interval, water_reminder_enabled, water_reminder_start, water_reminder_end,
                reminders_global_enabled,
                sleep_reminder_enabled, sleep_reminder_time,
                workout_reminder_enabled, workout_reminder_time, workout_reminder_repeat,
                summary_reminder_enabled, summary_reminder_time,
                workout_start_count, manual_day_offset
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT (user_id) DO UPDATE SET
                timezone = excluded.timezone, chat_reset_time = excluded.chat_reset_time,
                workout_split_type = excluded.workout_split_type, workout_templates = excluded.workout_templates,
                week_start_day = excluded.week_start_day,
                water_target_goal = excluded.water_target_goal, water_reminder_interval = excluded.water_reminder_interval,
                water_reminder_enabled = excluded.water_reminder_enabled, water_reminder_start = excluded.water_reminder_start,
                water_reminder_end = excluded.water_reminder_end,
                reminders_global_enabled = excluded.reminders_global_enabled,
                sleep_reminder_enabled = excluded.sleep_reminder_enabled, sleep_reminder_time = excluded.sleep_reminder_time,
                workout_reminder_enabled = excluded.workout_reminder_enabled, workout_reminder_time = excluded.workout_reminder_time,
                workout_reminder_repeat = excluded.workout_reminder_repeat,
                summary_reminder_enabled = excluded.summary_reminder_enabled, summary_reminder_time = excluded.summary_reminder_time,
                workout_start_count = excluded.workout_start_count, manual_day_offset = excluded.manual_day_offset`,
        args: [
          userId,
          timezone !== undefined ? timezone : currentSet.timezone,
          chat_reset_time !== undefined ? chat_reset_time : currentSet.chat_reset_time,
          workout_split_type !== undefined ? workout_split_type : currentSet.workout_split_type,
          workout_templates !== undefined ? workout_templates : currentSet.workout_templates,
          week_start_day !== undefined ? week_start_day : (currentSet.week_start_day || 'Monday'),
          water_target_goal !== undefined ? water_target_goal : (currentSet.water_target_goal !== undefined ? currentSet.water_target_goal : 2.5),
          water_reminder_interval !== undefined ? water_reminder_interval : (currentSet.water_reminder_interval !== undefined ? currentSet.water_reminder_interval : 60),
          water_reminder_enabled !== undefined ? water_reminder_enabled : (currentSet.water_reminder_enabled !== undefined ? currentSet.water_reminder_enabled : 0),
          water_reminder_start !== undefined ? water_reminder_start : (currentSet.water_reminder_start || '08:00'),
          water_reminder_end !== undefined ? water_reminder_end : (currentSet.water_reminder_end || '22:00'),
          reminders_global_enabled !== undefined ? reminders_global_enabled : (currentSet.reminders_global_enabled !== undefined ? currentSet.reminders_global_enabled : 1),
          sleep_reminder_enabled !== undefined ? sleep_reminder_enabled : (currentSet.sleep_reminder_enabled !== undefined ? currentSet.sleep_reminder_enabled : 0),
          sleep_reminder_time !== undefined ? sleep_reminder_time : (currentSet.sleep_reminder_time || '22:00'),
          workout_reminder_enabled !== undefined ? workout_reminder_enabled : (currentSet.workout_reminder_enabled !== undefined ? currentSet.workout_reminder_enabled : 0),
          workout_reminder_time !== undefined ? workout_reminder_time : (currentSet.workout_reminder_time || '07:00'),
          workout_reminder_repeat !== undefined ? workout_reminder_repeat : (currentSet.workout_reminder_repeat || '{"type":"daily"}'),
          summary_reminder_enabled !== undefined ? summary_reminder_enabled : (currentSet.summary_reminder_enabled !== undefined ? currentSet.summary_reminder_enabled : 0),
          summary_reminder_time !== undefined ? summary_reminder_time : (currentSet.summary_reminder_time || '07:00'),
          workout_start_count !== undefined ? workout_start_count : (currentSet.workout_start_count !== undefined ? currentSet.workout_start_count : 0),
          manual_day_offset !== undefined ? manual_day_offset : (currentSet.manual_day_offset !== undefined ? currentSet.manual_day_offset : 0),
        ]
      });
      return res.status(200).json({ success: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
