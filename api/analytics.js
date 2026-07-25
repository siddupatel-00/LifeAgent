import dotenv from 'dotenv';
dotenv.config();
import db from '../lib/db.js';
import { getUserId } from '../lib/auth.js';

export default async function handler(req, res) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const range = req.query?.range || '7d';
  const clientDate = /^\d{4}-\d{2}-\d{2}$/.test(req.query?.client_date || '') ? req.query.client_date : null;
  const todayDate = clientDate || new Date().toISOString().slice(0, 10);

  // Default fallback data structures
  let habitsData = { total: 0, completedToday: 0, consistency: 0, totalStreaks: 0, bestStreak: 0, breakdown: [], categories: {} };
  let financeData = { totalEarned: 0, totalSpent: 0, netBalance: 0 };
  let todayData = { total: 0, done: 0 };
  let notesData = { count: 0 };
  let sleepData = { avgHours: 0 };
  let workoutsData = { thisWeek: 0, totalMinutes: 0, totalCalories: 0 };

  // 1. Habits summary
  try {
    const habitsResult = await db.execute({ sql: 'SELECT * FROM habits WHERE user_id = ?', args: [userId] });
    const habits = habitsResult.rows || [];
    const totalHabits = habits.length;
    const todayItemsResult = await db.execute({
      sql: 'SELECT habit_id, checked FROM today_items WHERE user_id = ? AND date = ?',
      args: [userId, todayDate]
    });
    const completedHabitIds = new Set((todayItemsResult.rows || []).filter(item => item.checked && item.habit_id).map(item => item.habit_id));
    const completedToday = habits.filter(h => completedHabitIds.has(h.id)).length;
    const consistency = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;
    const totalStreaks = habits.reduce((sum, h) => sum + (Number(h.streak) || 0), 0);
    const bestStreak = habits.reduce((max, h) => Math.max(max, Number(h.streak) || 0), 0);
    const habitBreakdown = habits.map(h => ({
      label: h.label || h.title || 'Habit',
      category: h.category || 'General',
      streak: Number(h.streak) || 0,
      checkedToday: completedHabitIds.has(h.id)
    }));

    const categories = {};
    for (const h of habits) {
      const cat = h.category || 'General';
      if (!categories[cat]) categories[cat] = { total: 0, done: 0 };
      categories[cat].total++;
      if (completedHabitIds.has(h.id)) categories[cat].done++;
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

  // 2. Financial summary
  try {
    const txnResult = await db.execute({
      sql: 'SELECT type, amount FROM transactions WHERE user_id = ?',
      args: [userId]
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

  // 3. Today items summary
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

  // 4. Notes count
  try {
    const notesResult = await db.execute({
      sql: 'SELECT count(*) as count FROM notes WHERE user_id = ? AND (is_trashed = 0 OR is_trashed IS NULL)',
      args: [userId]
    });
    notesData = { count: Number(notesResult.rows[0]?.count) || 0 };
  } catch (err) {
    console.error('Analytics Notes Error:', err.message);
  }

  // 5. Sleep average
  try {
    const sleepResult = await db.execute({
      sql: 'SELECT hours, minutes FROM sleep_logs WHERE user_id = ? ORDER BY date DESC LIMIT 7',
      args: [userId]
    });
    const rows = sleepResult.rows || [];
    if (rows.length > 0) {
      const totalMins = rows.reduce((sum, r) => sum + ((Number(r.hours) || 0) * 60) + (Number(r.minutes) || 0), 0);
      sleepData = { avgHours: Math.round((totalMins / rows.length / 60) * 10) / 10 };
    }
  } catch (err) {
    console.error('Analytics Sleep Error:', err.message);
  }

  // 6. Workouts
  try {
    const workoutsResult = await db.execute({
      sql: 'SELECT duration_mins, calories FROM workouts WHERE user_id = ?',
      args: [userId]
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
    habits: habitsData,
    finance: financeData,
    today: todayData,
    notes: notesData,
    sleep: sleepData,
    workouts: workoutsData
  });
}
