import { handleCors } from '../lib/cors.js';
import db, { ensureDbSchema } from '../lib/db.js';
import { getUserId } from '../lib/auth.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    await ensureDbSchema();

    const clientDate = req.query.client_date || new Date().toISOString().split('T')[0];

    // Auto-expire past calendar events before fetching
    db.execute({
      sql: `UPDATE calendar_events SET status = 'expired' WHERE user_id = ? AND date < ? AND (status = 'upcoming' OR status IS NULL) AND status != 'completed'`,
      args: [userId, clientDate]
    }).catch(() => {});

    // Run ALL queries in ONE parallel execution batch
    const [
      userRes,
      settingsRes,
      todayRes,
      habitsRes,
      habitRemRes,
      statsRes,
      calendarRes,
      calRemRes,
      workoutsRes,
      txRes,
      notesRes,
      sleepRes
    ] = await Promise.all([
      db.execute({ sql: 'SELECT id, name, email, phone, handle, theme, ai_name, gemini_api_key, groq_api_key, ai_provider, currency, ai_tone, morning_audit, smart_alerts, week_start_day, sync_to_cloud FROM users WHERE id = ?', args: [userId] }),
      db.execute({ sql: 'SELECT * FROM user_settings WHERE user_id = ?', args: [userId] }),
      db.execute({ sql: 'SELECT * FROM today_items WHERE user_id = ? AND date = ?', args: [userId, clientDate] }),
      db.execute({ sql: 'SELECT * FROM habits WHERE user_id = ?', args: [userId] }),
      db.execute({ sql: "SELECT * FROM reminders WHERE entity_type = 'habit' AND user_id = ?", args: [userId] }),
      db.execute({ sql: 'SELECT * FROM body_stats WHERE user_id = ? ORDER BY date DESC LIMIT 1', args: [userId] }),
      db.execute({ sql: 'SELECT * FROM calendar_events WHERE user_id = ? ORDER BY date ASC', args: [userId] }),
      db.execute({ sql: "SELECT * FROM reminders WHERE entity_type = 'event' AND user_id = ?", args: [userId] }),
      db.execute({ sql: 'SELECT * FROM workouts WHERE user_id = ? ORDER BY date DESC, id DESC', args: [userId] }),
      db.execute({ sql: 'SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC, id DESC', args: [userId] }),
      db.execute({ sql: 'SELECT * FROM notes WHERE user_id = ? ORDER BY date DESC', args: [userId] }),
      db.execute({ sql: 'SELECT * FROM sleep_logs WHERE user_id = ? ORDER BY date DESC', args: [userId] })
    ]);

    // Group habit reminders
    const habitRemindersMap = {};
    for (const r of (habitRemRes.rows || [])) {
      if (!habitRemindersMap[r.entity_id]) habitRemindersMap[r.entity_id] = [];
      habitRemindersMap[r.entity_id].push({ ...r, time: r.reminder_time || r.time || '08:00' });
    }

    // Group calendar reminders
    const calRemindersMap = {};
    for (const r of (calRemRes.rows || [])) {
      if (!calRemindersMap[r.entity_id]) calRemindersMap[r.entity_id] = [];
      calRemindersMap[r.entity_id].push({ ...r, time: r.reminder_time || r.time || '' });
    }

    const habits = (habitsRes.rows || []).map(h => ({
      ...h,
      reminders: habitRemindersMap[h.id] || []
    }));

    const calendarEvents = (calendarRes.rows || []).map(c => ({
      ...c,
      reminders: calRemindersMap[c.id] || []
    }));

    const userRow = userRes.rows[0] || {};
    const settingsRow = settingsRes.rows[0] || {};
    const mergedSettings = {
      ...settingsRow,
      ...userRow,
      name: userRow.name || '',
      email: userRow.email || '',
      phone: userRow.phone || '',
      handle: userRow.handle || '',
      theme: userRow.theme || 'light',
      ai_name: userRow.ai_name || 'AI',
      currency: userRow.currency || '$',
      gemini_api_key: userRow.gemini_api_key || '',
      groq_api_key: userRow.groq_api_key || '',
      ai_provider: userRow.ai_provider || 'gemini',
      ai_tone: userRow.ai_tone || settingsRow.ai_tone || 'Analytical & Direct',
      week_start_day: userRow.week_start_day || settingsRow.week_start_day || 'Monday'
    };

    return res.status(200).json({
      settings: mergedSettings,
      todayItems: todayRes.rows || [],
      habits,
      bodyStats: statsRes.rows[0] || null,
      calendarEvents,
      workouts: workoutsRes.rows || [],
      transactions: txRes.rows || [],
      notes: notesRes.rows || [],
      sleepLogs: sleepRes.rows || []
    });
  } catch (error) {
    console.error('Bootstrap error:', error);
    return res.status(500).json({ error: error.message });
  }
}
