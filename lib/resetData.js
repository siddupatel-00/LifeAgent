import db from './db.js';

export async function resetUserData(userId) {
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
    { sql: 'DELETE FROM daily_metrics WHERE user_id = ? OR (user_email IS NOT NULL AND user_email = ?)', args: [userId, userEmail || ''] },
    { sql: 'DELETE FROM user_settings WHERE user_id = ?', args: [userId] }
  ];

  for (const q of queries) {
    try {
      await db.execute(q);
    } catch (e) {
      console.warn(`Reset table deletion warning (${q.sql}):`, e.message);
    }
  }
}
