// src/utils/reminderScheduler.js
// Uses Capacitor LocalNotifications exclusively (no setTimeout).
// Works when app is killed or after reboot.

import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

const LAST_SCHEDULED_DAY_KEY = 'reminder_last_scheduled_day';

// ─── Permission ──────────────────────────────────────────────────────────────
export async function requestNotificationPermission() {
  if (Capacitor.getPlatform() === 'web') return true;
  const status = await LocalNotifications.checkPermissions();
  if (status.display === 'granted') return true;
  const req = await LocalNotifications.requestPermissions();
  return req.display === 'granted';
}

// ─── Deterministic integer ID ─────────────────────────────────────────────────
// Must fit in a 32-bit signed integer for Capacitor.
export function makeNotifId(entityType, entityId, reminderId, dayOffset) {
  const typeMap = { event: 1, habit: 2, water: 3, sleep: 4, workout: 5, summary: 6 };
  const t = typeMap[entityType] || 7;
  // Pack: (dayOffset 0-6) * 10_000_000 + t * 1_000_000 + (entityId % 1000) * 1000 + (reminderId % 1000)
  return (dayOffset * 10_000_000 + t * 1_000_000 + (Number(entityId) % 1000) * 1000 + (Number(reminderId) % 1000)) % 2_147_483_647;
}

// ─── Parse "HH:MM" time string into {hour, minute} ───────────────────────────
function parseTime(timeStr) {
  if (!timeStr) return null;
  const parts = timeStr.split(':');
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return null;
  return { hour: h, minute: m };
}

// ─── Build fire Date from event date + offset_minutes ────────────────────────
function buildEventFireDate(eventDateStr, offsetMinutes) {
  // eventDateStr: "YYYY-MM-DD"
  const parts = eventDateStr.split('-').map(Number);
  const d = new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
  d.setMinutes(d.getMinutes() - offsetMinutes);
  return d;
}

// ─── Build fire Date for a daily reminder at a given time on a day offset ─────
function buildDailyFireDate(dayOffset, hour, minute) {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d;
}

// ─── Cancel all notifications for an entity ──────────────────────────────────
export async function cancelEntityReminders(entityType, entityId) {
  if (Capacitor.getPlatform() === 'web') return;
  try {
    const pending = await LocalNotifications.getPending();
    const toCancel = [];
    for (const n of (pending?.notifications || [])) {
      if (n.extra && n.extra.entityType === entityType && String(n.extra.entityId) === String(entityId)) {
        toCancel.push({ id: n.id });
      }
    }
    if (toCancel.length > 0) {
      await LocalNotifications.cancel({ notifications: toCancel });
    }
  } catch (e) {
    console.warn('[reminderScheduler] cancelEntityReminders error:', e);
  }
}

// ─── Cancel all reminders of a given type (e.g., water, sleep) ───────────────
export async function cancelAllOfType(entityType) {
  if (Capacitor.getPlatform() === 'web') return;
  try {
    const pending = await LocalNotifications.getPending();
    const toCancel = [];
    for (const n of (pending?.notifications || [])) {
      if (n.extra && n.extra.entityType === entityType) {
        toCancel.push({ id: n.id });
      }
    }
    if (toCancel.length > 0) {
      await LocalNotifications.cancel({ notifications: toCancel });
    }
  } catch (e) {
    console.warn('[reminderScheduler] cancelAllOfType error:', e);
  }
}

// ─── Schedule event reminders for next 7 days ────────────────────────────────
export async function scheduleEventReminders(events, globalEnabled = true) {
  await cancelAllOfType('event');
  if (!globalEnabled || Capacitor.getPlatform() === 'web') return;
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  const notifications = [];
  const now = Date.now();

  for (const event of events) {
    if (!event.date || !Array.isArray(event.reminders) || event.reminders.length === 0) continue;
    for (const rem of event.reminders) {
      if (!rem.enabled) continue;
      const fireDate = buildEventFireDate(event.date, rem.offset_minutes || 0);
      if (fireDate.getTime() <= now) continue;
      const diffDays = Math.floor((fireDate.getTime() - now) / 86400000);
      if (diffDays > 7) continue;

      const id = makeNotifId('event', event.id, rem.id, 0);
      notifications.push({
        id,
        title: `📅 ${event.title}`,
        body: rem.offset_minutes === 0 ? 'Event starting now!' : `Event in ${rem.offset_minutes} minutes`,
        schedule: { at: fireDate, allowWhileIdle: true },
        extra: { entityType: 'event', entityId: event.id, reminderId: rem.id }
      });
    }
  }

  if (notifications.length > 0) {
    await LocalNotifications.schedule({ notifications });
  }
}

// ─── Schedule habit reminders for next 7 days ─────────────────────────────────
export async function scheduleHabitReminders(habits, globalEnabled = true) {
  await cancelAllOfType('habit');
  if (!globalEnabled || Capacitor.getPlatform() === 'web') return;
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  const notifications = [];
  const now = Date.now();

  for (const habit of habits) {
    if (!Array.isArray(habit.reminders) || habit.reminders.length === 0) continue;
    for (const rem of habit.reminders) {
      if (!rem.enabled) continue;
      const t = parseTime(rem.reminder_time);
      if (!t) continue;

      // Determine which days (next 7) this reminder fires
      const repeatRule = rem.repeat_rule ? (typeof rem.repeat_rule === 'string' ? JSON.parse(rem.repeat_rule) : rem.repeat_rule) : { type: 'daily' };
      for (let day = 0; day < 7; day++) {
        const fireDate = buildDailyFireDate(day, t.hour, t.minute);
        if (fireDate.getTime() <= now) continue;
        if (!isRepeatDayMatch(repeatRule, fireDate)) continue;
        const id = makeNotifId('habit', habit.id, rem.id, day);
        notifications.push({
          id,
          title: `✅ ${habit.label}`,
          body: `Don't forget to complete your habit today!`,
          schedule: { at: fireDate, allowWhileIdle: true },
          extra: { entityType: 'habit', entityId: habit.id, reminderId: rem.id }
        });
      }
    }
  }

  if (notifications.length > 0) {
    await LocalNotifications.schedule({ notifications });
  }
}

// ─── Schedule water reminders ─────────────────────────────────────────────────
export async function scheduleWaterReminders({ enabled, startTime, endTime, intervalMinutes }, globalEnabled = true) {
  await cancelAllOfType('water');
  if (!enabled || !globalEnabled || Capacitor.getPlatform() === 'web') return;
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  const sTime = parseTime(startTime || '08:00');
  const eTime = parseTime(endTime || '22:00');
  const interval = intervalMinutes || 60;
  if (!sTime || !eTime) return;

  const notifications = [];
  const now = Date.now();

  for (let day = 0; day < 7; day++) {
    let hour = sTime.hour;
    let minute = sTime.minute;
    let slotId = 0;

    while (hour < eTime.hour || (hour === eTime.hour && minute <= eTime.minute)) {
      const fireDate = buildDailyFireDate(day, hour, minute);
      if (fireDate.getTime() > now) {
        const id = makeNotifId('water', 1, slotId, day);
        notifications.push({
          id,
          title: '💧 Hydration Reminder',
          body: "Time to drink some water! Stay hydrated.",
          schedule: { at: fireDate, allowWhileIdle: true },
          extra: { entityType: 'water', entityId: 1, reminderId: slotId }
        });
      }
      slotId++;
      const totalMinutes = hour * 60 + minute + interval;
      hour = Math.floor(totalMinutes / 60);
      minute = totalMinutes % 60;
      if (hour >= 24) break;
    }
  }

  if (notifications.length > 0) {
    await LocalNotifications.schedule({ notifications });
  }
}

// ─── Schedule sleep reminder ──────────────────────────────────────────────────
export async function scheduleSleepReminders({ enabled, reminderTime }, globalEnabled = true) {
  await cancelAllOfType('sleep');
  if (!enabled || !globalEnabled || Capacitor.getPlatform() === 'web') return;
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  const t = parseTime(reminderTime || '22:00');
  if (!t) return;

  const notifications = [];
  const now = Date.now();

  for (let day = 0; day < 7; day++) {
    const fireDate = buildDailyFireDate(day, t.hour, t.minute);
    if (fireDate.getTime() <= now) continue;
    const id = makeNotifId('sleep', 1, 1, day);
    notifications.push({
      id,
      title: '😴 Bedtime Reminder',
      body: "Time to wind down and get ready for bed!",
      schedule: { at: fireDate, allowWhileIdle: true },
      extra: { entityType: 'sleep', entityId: 1, reminderId: 1 }
    });
  }

  if (notifications.length > 0) {
    await LocalNotifications.schedule({ notifications });
  }
}

// ─── Schedule workout reminders ───────────────────────────────────────────────
export async function scheduleWorkoutReminders({ enabled, reminderTime, repeatRule }, globalEnabled = true) {
  await cancelAllOfType('workout');
  if (!enabled || !globalEnabled || Capacitor.getPlatform() === 'web') return;
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  const t = parseTime(reminderTime || '07:00');
  if (!t) return;
  const rule = repeatRule ? (typeof repeatRule === 'string' ? JSON.parse(repeatRule) : repeatRule) : { type: 'daily' };

  const notifications = [];
  const now = Date.now();

  for (let day = 0; day < 7; day++) {
    const fireDate = buildDailyFireDate(day, t.hour, t.minute);
    if (fireDate.getTime() <= now) continue;
    if (!isRepeatDayMatch(rule, fireDate)) continue;
    const id = makeNotifId('workout', 1, 1, day);
    notifications.push({
      id,
      title: '💪 Workout Reminder',
      body: "Time to hit the gym! Don't skip today's workout.",
      schedule: { at: fireDate, allowWhileIdle: true },
      extra: { entityType: 'workout', entityId: 1, reminderId: 1 }
    });
  }

  if (notifications.length > 0) {
    await LocalNotifications.schedule({ notifications });
  }
}

// ─── Schedule morning summary notifications ───────────────────────────────────
export async function scheduleMorningSummaryReminders({ enabled, reminderTime, userName, calendarEvents }, globalEnabled = true) {
  await cancelAllOfType('summary');
  if (!enabled || !globalEnabled || Capacitor.getPlatform() === 'web') return;
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  const t = parseTime(reminderTime || '07:00');
  if (!t) return;

  const notifications = [];
  const now = Date.now();
  const name = userName || 'User';

  for (let day = 0; day < 7; day++) {
    const fireDate = buildDailyFireDate(day, t.hour, t.minute);
    if (fireDate.getTime() <= now) continue;
    const dateKey = fireDate.toISOString().split('T')[0];
    const todaysEvents = (calendarEvents || []).filter(e => {
      if (!e.date) return false;
      const eDate = typeof e.date === 'string' ? e.date.split('T')[0] : new Date(e.date).toISOString().split('T')[0];
      return eDate === dateKey;
    });
    let body = '';
    if (todaysEvents.length === 0) {
      body = `Good morning ${name}! You have a free day today.`;
    } else if (todaysEvents.length === 1) {
      body = `Good morning ${name}! Today: ${todaysEvents[0].title}.`;
    } else {
      body = `Good morning ${name}! ${todaysEvents.length} events today, starting with ${todaysEvents[0].title}.`;
    }
    const id = makeNotifId('summary', 1, 1, day);
    notifications.push({
      id,
      title: '🌅 Morning Summary',
      body,
      schedule: { at: fireDate, allowWhileIdle: true },
      extra: { entityType: 'summary', entityId: 1, reminderId: 1 }
    });
  }

  if (notifications.length > 0) {
    await LocalNotifications.schedule({ notifications });
  }
}

// ─── Regenerate ALL reminders (called on app launch, edits, reboot) ───────────
export async function regenerateAllReminders({
  habits = [],
  events = [],
  waterSettings = {},
  sleepSettings = {},
  workoutSettings = {},
  summarySettings = {},
  globalEnabled = true,
}) {
  console.log('[reminderScheduler] Regenerating all reminders...');
  await Promise.all([
    scheduleHabitReminders(habits, globalEnabled),
    scheduleEventReminders(events, globalEnabled),
    scheduleWaterReminders(waterSettings, globalEnabled),
    scheduleSleepReminders(sleepSettings, globalEnabled),
    scheduleWorkoutReminders(workoutSettings, globalEnabled),
    scheduleMorningSummaryReminders(summarySettings, globalEnabled),
  ]);
  // Record the day we last scheduled so app launch can check if regen is needed
  localStorage.setItem(LAST_SCHEDULED_DAY_KEY, new Date().toISOString().split('T')[0]);
  console.log('[reminderScheduler] Done regenerating reminders.');
}

// ─── Check whether regeneration is needed on app launch ──────────────────────
export function isRegenNeeded() {
  const last = localStorage.getItem(LAST_SCHEDULED_DAY_KEY);
  const today = new Date().toISOString().split('T')[0];
  return last !== today;
}

// ─── Helper: Does repeatRule match given Date? ────────────────────────────────
function isRepeatDayMatch(rule, date) {
  if (!rule) return true;
  const type = rule.type || 'daily';
  if (type === 'daily' || type === 'once') return true;
  if (type === 'weekdays') {
    const dow = date.getDay(); // 0=Sun, 6=Sat
    return dow >= 1 && dow <= 5;
  }
  if (type === 'weekly') {
    const dow = date.getDay();
    const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const days = rule.customDays || [];
    return days.some(d => dayMap[d] === dow);
  }
  if (type === 'custom') {
    const dow = date.getDay();
    const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const days = rule.customDays || [];
    return days.some(d => dayMap[d] === dow);
  }
  return true;
}
