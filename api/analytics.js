import db from '../lib/db.js';
import { getUserId } from '../lib/auth.js';

export default async function handler(req, res) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const range = req.query?.range || '7d';
    
    // Calculate date boundary based on range
    let dateFilter;
    const today = new Date().toISOString().split('T')[0];
    switch (range) {
      case '7d': dateFilter = "date('now', '-7 days')"; break;
      case '14d': dateFilter = "date('now', '-14 days')"; break;
      case '30d': dateFilter = "date('now', '-30 days')"; break;
      case '90d': dateFilter = "date('now', '-90 days')"; break;
      default: dateFilter = "date('now', '-7 days')";
    }

    // 1. Habits summary
    const habitsResult = await db.execute({ sql: 'SELECT * FROM habits WHERE user_id = ?', args: [userId] });
    const habits = habitsResult.rows;
    const totalHabits = habits.length;
    const completedToday = habits.filter(h => h.checked_today).length;
    const consistency = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;
    const totalStreaks = habits.reduce((sum, h) => sum + (h.streak || 0), 0);
    const bestStreak = habits.reduce((max, h) => Math.max(max, h.streak || 0), 0);
    const habitBreakdown = habits.map(h => ({
      label: h.label || h.title,
      category: h.category,
      streak: h.streak || 0,
      checkedToday: !!h.checked_today
    }));

    // 2. Financial summary
    const txnResult = await db.execute({
      sql: `SELECT type, SUM(amount) as total FROM transactions WHERE user_id = ? AND date >= ${dateFilter} GROUP BY type`,
      args: [userId]
    });
    let totalEarned = 0, totalSpent = 0;
    for (const row of txnResult.rows) {
      if (row.type === 'income' || row.type === 'earn') totalEarned = row.total || 0;
      else if (row.type === 'expense' || row.type === 'spend') totalSpent = row.total || 0;
    }
    const netBalance = totalEarned - totalSpent;

    // 3. Today items summary
    const todayResult = await db.execute({
      sql: "SELECT COUNT(*) as total, SUM(CASE WHEN checked = 1 THEN 1 ELSE 0 END) as done FROM today_items WHERE user_id = ? AND date = date('now')",
      args: [userId]
    });
    const todayTotal = todayResult.rows[0]?.total || 0;
    const todayDone = todayResult.rows[0]?.done || 0;

    // 4. Notes count
    const notesResult = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM notes WHERE user_id = ? AND is_trashed = 0',
      args: [userId]
    });
    const notesCount = notesResult.rows[0]?.count || 0;

    // 5. Sleep average (last 7 entries)
    const sleepResult = await db.execute({
      sql: 'SELECT hours, minutes FROM sleep_logs WHERE user_id = ? ORDER BY date DESC LIMIT 7',
      args: [userId]
    });
    let avgSleepHours = 0;
    if (sleepResult.rows.length > 0) {
      const totalMins = sleepResult.rows.reduce((sum, r) => sum + (r.hours * 60) + (r.minutes || 0), 0);
      avgSleepHours = Math.round((totalMins / sleepResult.rows.length / 60) * 10) / 10;
    }

    // 6. Workouts this week
    const workoutsResult = await db.execute({
      sql: "SELECT COUNT(*) as count, SUM(duration_mins) as totalMins, SUM(calories) as totalCal FROM workouts WHERE user_id = ? AND date >= date('now', '-7 days')",
      args: [userId]
    });
    const workoutsThisWeek = workoutsResult.rows[0]?.count || 0;
    const workoutMinutes = workoutsResult.rows[0]?.totalMins || 0;
    const workoutCalories = workoutsResult.rows[0]?.totalCal || 0;

    // 7. Category breakdown for habits
    const categories = {};
    for (const h of habits) {
      const cat = h.category || 'Other';
      if (!categories[cat]) categories[cat] = { total: 0, done: 0 };
      categories[cat].total++;
      if (h.checked_today) categories[cat].done++;
    }

    return res.status(200).json({
      range,
      habits: {
        total: totalHabits,
        completedToday,
        consistency,
        totalStreaks,
        bestStreak,
        breakdown: habitBreakdown,
        categories
      },
      finance: {
        totalEarned,
        totalSpent,
        netBalance
      },
      today: {
        total: todayTotal,
        done: todayDone
      },
      notes: { count: notesCount },
      sleep: { avgHours: avgSleepHours },
      workouts: {
        thisWeek: workoutsThisWeek,
        totalMinutes: workoutMinutes,
        totalCalories: workoutCalories
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
