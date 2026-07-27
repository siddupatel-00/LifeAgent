import dotenv from 'dotenv';
dotenv.config();
import db from '../lib/db.js';
import { getUserId } from '../lib/auth.js';

function getOffsetDate(baseDateStr, daysBack) {
  const [y, m, d] = (baseDateStr || new Date().toISOString().slice(0, 10)).split('-').map(Number);
  const dateObj = new Date(Date.UTC(y, m - 1, d));
  dateObj.setUTCDate(dateObj.getUTCDate() - daysBack);
  return dateObj.toISOString().slice(0, 10);
}

export default async function handler(req, res) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const currentUserReq = await db.execute({ sql: 'SELECT email FROM users WHERE id = ?', args: [userId] });
  const userEmail = currentUserReq.rows[0]?.email;

  if (req.method === 'POST' && req.query.type === 'metrics') {
    try {
      const { date, metric_type, metric_name, metric_value } = req.body;
      await db.execute({
        sql: 'INSERT INTO daily_metrics (user_email, date, metric_type, metric_name, metric_value) VALUES (?, ?, ?, ?, ?)',
        args: [userEmail, date, metric_type, metric_name, metric_value.toString()]
      });
      return res.status(200).json({ success: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method === 'GET' && req.query.type === 'logs') {
    try {
      const result = await db.execute({
        sql: 'SELECT * FROM daily_metrics WHERE user_email = ? ORDER BY created_at DESC',
        args: [userEmail]
      });
      return res.status(200).json(result.rows);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const range = req.query?.range || '7d';
  const clientDate = /^\d{4}-\d{2}-\d{2}$/.test(req.query?.client_date || '') 
    ? req.query.client_date 
    : new Date().toISOString().slice(0, 10);
  const todayDate = clientDate;
  const customStart = /^\d{4}-\d{2}-\d{2}$/.test(req.query?.start_date || '') ? req.query.start_date : null;
  const customEnd = /^\d{4}-\d{2}-\d{2}$/.test(req.query?.end_date || '') ? req.query.end_date : null;

  let startDateStr = todayDate;
  let endDateStr = todayDate;

  if (range === 'custom' && (customStart || customEnd)) {
    startDateStr = customStart || getOffsetDate(customEnd || todayDate, 6);
    endDateStr = customEnd || todayDate;
    if (startDateStr > endDateStr) {
      const tmp = startDateStr;
      startDateStr = endDateStr;
      endDateStr = tmp;
    }
  } else if (range === '14d') {
    startDateStr = getOffsetDate(todayDate, 13);
    endDateStr = todayDate;
  } else if (range === '30d') {
    startDateStr = getOffsetDate(todayDate, 29);
    endDateStr = todayDate;
  } else if (range === '90d') {
    startDateStr = getOffsetDate(todayDate, 89);
    endDateStr = todayDate;
  } else {
    // Default 7d
    startDateStr = getOffsetDate(todayDate, 6);
    endDateStr = todayDate;
  }

  // Default fallback data structures
  let habitsData = { total: 0, completedToday: 0, consistency: 0, totalStreaks: 0, bestStreak: 0, breakdown: [], categories: {} };
  let financeData = { totalEarned: 0, totalSpent: 0, netBalance: 0 };
  let todayData = { total: 0, done: 0 };
  let notesData = { count: 0 };
  let sleepData = { avgHours: 0 };
  let workoutsData = { thisWeek: 0, totalMinutes: 0, totalCalories: 0 };

  // 1. Habits summary & today_items consistency in range
  try {
    const habitsResult = await db.execute({ sql: 'SELECT * FROM habits WHERE user_id = ?', args: [userId] });
    const habits = habitsResult.rows || [];
    const totalHabits = habits.length;
    const todayItemsResult = await db.execute({
      sql: 'SELECT habit_id, checked, date FROM today_items WHERE user_id = ? AND date >= ? AND date <= ?',
      args: [userId, startDateStr, endDateStr]
    });
    const rangeTodayItems = todayItemsResult.rows || [];
    const completedHabitIdsToday = new Set(
      rangeTodayItems.filter(item => item.date === todayDate && item.checked && item.habit_id).map(item => item.habit_id)
    );
    const completedToday = habits.filter(h => completedHabitIdsToday.has(h.id)).length;
    const totalRangeItems = rangeTodayItems.length;
    const completedRangeItems = rangeTodayItems.filter(item => !!item.checked).length;
    const consistency = totalRangeItems > 0 
      ? Math.round((completedRangeItems / totalRangeItems) * 100) 
      : (totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0);
    const totalStreaks = habits.reduce((sum, h) => sum + (Number(h.streak) || 0), 0);
    const bestStreak = habits.reduce((max, h) => Math.max(max, Number(h.streak) || 0), 0);
    const daysInRange = Math.max(1, Math.round((new Date(endDateStr) - new Date(startDateStr)) / (1000*60*60*24)) + 1);

    const habitCheckCounts = {};
    for (const item of rangeTodayItems) {
      if (!habitCheckCounts[item.habit_id]) habitCheckCounts[item.habit_id] = { checked: 0, total: 0 };
      habitCheckCounts[item.habit_id].total++;
      if (item.checked) habitCheckCounts[item.habit_id].checked++;
    }

    const habitBreakdown = habits.map(h => {
      const counts = habitCheckCounts[h.id] || { checked: 0, total: 0 };
      const completionRate = counts.total > 0 ? Math.round((counts.checked / counts.total) * 100) : 0;
      return {
        label: h.label || h.title || 'Habit',
        category: h.category || 'General',
        streak: Number(h.streak) || 0,
        checkedToday: completedHabitIdsToday.has(h.id),
        completionRate,
        daysChecked: counts.checked,
        daysTotal: counts.total
      };
    });

    const categories = {};
    for (const h of habits) {
      const cat = h.category || 'General';
      if (!categories[cat]) categories[cat] = { total: 0, done: 0, totalDays: 0, checkedDays: 0 };
      categories[cat].total++;
      if (completedHabitIdsToday.has(h.id)) categories[cat].done++;
      const counts = habitCheckCounts[h.id] || { checked: 0, total: 0 };
      categories[cat].totalDays += counts.total;
      categories[cat].checkedDays += counts.checked;
    }

    habitsData = {
      total: totalHabits,
      completedToday,
      consistency,
      totalStreaks,
      bestStreak,
      breakdown: habitBreakdown,
      categories
    };
  } catch (err) {
    console.error('Analytics Habits Error:', err.message);
  }

  // 2. Financial summary (date-bounded)
  try {
    const txnResult = await db.execute({
      sql: 'SELECT type, amount FROM transactions WHERE user_id = ? AND date >= ? AND date <= ?',
      args: [userId, startDateStr, endDateStr]
    });
    let totalEarned = 0, totalSpent = 0;
    for (const row of (txnResult.rows || [])) {
      const amt = Number(row.amount) || 0;
      if (row.type === 'income' || row.type === 'earn') totalEarned += amt;
      else if (row.type === 'expense' || row.type === 'spend') totalSpent += amt;
    }
    financeData = {
      totalEarned,
      totalSpent,
      netBalance: totalEarned - totalSpent
    };
  } catch (err) {
    console.error('Analytics Finance Error:', err.message);
  }

  // 3. Today items summary (for current todayDate)
  try {
    const todayResult = await db.execute({
      sql: 'SELECT checked FROM today_items WHERE user_id = ? AND date = ?',
      args: [userId, todayDate]
    });
    const rows = todayResult.rows || [];
    todayData = {
      total: rows.length,
      done: rows.filter(r => !!r.checked).length
    };
  } catch (err) {
    console.error('Analytics Today Error:', err.message);
  }

  // 4. Notes count (date-bounded)
  try {
    const notesResult = await db.execute({
      sql: 'SELECT count(*) as count FROM notes WHERE user_id = ? AND (is_trashed = 0 OR is_trashed IS NULL) AND date >= ? AND date <= ?',
      args: [userId, startDateStr, endDateStr]
    });
    notesData = { count: Number(notesResult.rows[0]?.count) || 0 };
  } catch (err) {
    console.error('Analytics Notes Error:', err.message);
  }

  // 5. Sleep average (date-bounded)
  try {
    const sleepResult = await db.execute({
      sql: 'SELECT hours, minutes FROM sleep_logs WHERE user_id = ? AND date >= ? AND date <= ? ORDER BY date DESC',
      args: [userId, startDateStr, endDateStr]
    });
    const rows = sleepResult.rows || [];
    if (rows.length > 0) {
      const totalMins = rows.reduce((sum, r) => sum + ((Number(r.hours) || 0) * 60) + (Number(r.minutes) || 0), 0);
      sleepData = { avgHours: Math.round((totalMins / rows.length / 60) * 10) / 10 };
    }
  } catch (err) {
    console.error('Analytics Sleep Error:', err.message);
  }

  // 6. Workouts (date-bounded)
  try {
    const workoutsResult = await db.execute({
      sql: 'SELECT duration_mins, calories FROM workouts WHERE user_id = ? AND date >= ? AND date <= ?',
      args: [userId, startDateStr, endDateStr]
    });
    const rows = workoutsResult.rows || [];
    const totalMins = rows.reduce((sum, r) => sum + (Number(r.duration_mins) || 0), 0);
    const totalCal = rows.reduce((sum, r) => sum + (Number(r.calories) || 0), 0);
    workoutsData = {
      thisWeek: rows.length,
      totalMinutes: totalMins,
      totalCalories: totalCal
    };
  } catch (err) {
    console.error('Analytics Workouts Error:', err.message);
  }

  return res.status(200).json({
    range,
    startDate: startDateStr,
    endDate: endDateStr,
    habits: habitsData,
    finance: financeData,
    today: todayData,
    notes: notesData,
    sleep: sleepData,
    workouts: workoutsData
  });
}
