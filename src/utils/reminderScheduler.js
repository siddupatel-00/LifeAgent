// src/utils/reminderScheduler.js
// Uses Capacitor LocalNotifications on native mobile + Web Notification API fallback on web.
// Works when app is killed or after reboot on native devices.

import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

const LAST_SCHEDULED_DAY_KEY = 'reminder_last_scheduled_day';

// Web timer storage
const webTimers = [];

function clearWebTimers() {
  webTimers.forEach(id => clearTimeout(id));
  webTimers.length = 0;
}

// ─── Ensure Notification Channel on Android ─────────────────────────────────
export async function ensureNotificationChannel() {
  if (Capacitor.getPlatform() === 'web') return;
  try {
    await LocalNotifications.createChannel({
      id: 'default',
      name: 'Reminders & Alarms',
      description: 'High priority alerts for events, habits, and daily goals',
      importance: 5, // MAX importance (plays sound and shows banner)
      visibility: 1, // PUBLIC (shows on lock screen)
      vibration: true,
    });
  } catch (e) {
    console.warn('[reminderScheduler] createChannel error:', e);
  }
}

// ─── Permission ──────────────────────────────────────────────────────────────
export async function requestNotificationPermission() {
  if (Capacitor.getPlatform() === 'web') {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') return true;
      const perm = await Notification.requestPermission();
      return perm === 'granted';
    }
    return false;
  }
  try {
    await ensureNotificationChannel();
    const status = await LocalNotifications.checkPermissions();
    if (status.display === 'granted') return true;
    const req = await LocalNotifications.requestPermissions();
    return req.display === 'granted';
  } catch (e) {
    console.warn('[reminderScheduler] permission request failed:', e);
    return false;
  }
}

// ─── Test Instant Notification ───────────────────────────────────────────────
export async function testNotificationNow() {
  const title = "🔔 LifeAgent Notification Test";
  const body = "Success! Reminders & alarms are working correctly on your device.";

  if (Capacitor.getPlatform() === 'web') {
    if (!('Notification' in window)) {
      alert("Browser notifications are not supported.");
      return false;
    }
    if (Notification.permission !== 'granted') {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        alert("Please enable notification permissions in your browser settings.");
        return false;
      }
    }
    setTimeout(() => {
      new Notification(title, { body });
    }, 3000);
    return true;
  }

  // Native Android / iOS
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return false;

  const fireDate = new Date(Date.now() + 4000); // 4 seconds in future
  await LocalNotifications.schedule({
    notifications: [{
      id: 999999,
      title,
      body,
      schedule: { at: fireDate, allowWhileIdle: true },
      channelId: 'default',
    }]
  });
  return true;
}

// ─── Deterministic integer ID ─────────────────────────────────────────────────
export function makeNotifId(entityType, entityId, reminderId, dayOffset) {
  const typeMap = { event: 1, habit: 2, water: 3, sleep: 4, workout: 5, summary: 6 };
  const t = typeMap[entityType] || 7;
  return (dayOffset * 10_000_000 + t * 1_000_000 + (Number(entityId) % 1000) * 1000 + (Number(reminderId) % 1000)) % 2_147_483_647;
}

// ─── Parse time string ("HH:MM", "HH:MM:SS", "08:00 AM", "8:00 PM") ──────────
function parseTime(timeStr) {
  if (!timeStr) return null;
  const str = String(timeStr).trim().toUpperCase();
  const isPM = str.includes('PM');
  const isAM = str.includes('AM');
  const cleanStr = str.replace(/[A-Z\s]/g, '').trim();
  const parts = cleanStr.split(':');
  let h = parseInt(parts[0], 10);
  let m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return null;
  if (isPM && h < 12) h += 12;
  if (isAM && h === 12) h = 0;
  return { hour: h, minute: m };
}

// ─── Build fire Date from event date + offset_minutes ────────────────────────
function buildEventFireDate(eventDateStr, offsetMinutes) {
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

// Helper: schedule web fallback
function scheduleWebFallback(title, body, fireDate) {
  if (Capacitor.getPlatform() !== 'web') return;
  const delay = fireDate.getTime() - Date.now();
  if (delay <= 0 || delay > 86400000) return; // max 24h for web timeout
  const timerId = setTimeout(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  }, delay);
  webTimers.push(timerId);
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
  if (Capacitor.getPlatform() === 'web') {
    clearWebTimers();
    return;
  }
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
  if (!globalEnabled) return;
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  const notifications = [];
  const now = Date.now();

  for (const event of events) {
    if (!event.date || !Array.isArray(event.reminders) || event.reminders.length === 0) continue;
    for (const rem of event.reminders) {
      const isEnabled = rem.enabled !== false && rem.enabled !== 0 && rem.enabled !== '0';
      if (!isEnabled) continue;
      const fireDate = buildEventFireDate(event.date, rem.offset_minutes || 0);
      if (fireDate.getTime() <= now) continue;
      const diffDays = Math.floor((fireDate.getTime() - now) / 86400000);
      if (diffDays > 7) continue;

      const title = `📅 ${event.title || 'Upcoming Event'}`;
      const body = rem.offset_minutes === 0 ? 'Event starting now!' : `Event in ${rem.offset_minutes} minutes`;

      if (Capacitor.getPlatform() === 'web') {
        scheduleWebFallback(title, body, fireDate);
      } else {
        const id = makeNotifId('event', event.id, rem.id, 0);
        notifications.push({
          id,
          title,
          body,
          schedule: { at: fireDate, allowWhileIdle: true },
          channelId: 'default',
          extra: { entityType: 'event', entityId: event.id, reminderId: rem.id }
        });
      }
    }
  }

  if (notifications.length > 0 && Capacitor.getPlatform() !== 'web') {
    await LocalNotifications.schedule({ notifications });
  }
}

// ─── Schedule habit reminders for next 7 days ─────────────────────────────────
export async function scheduleHabitReminders(habits, globalEnabled = true) {
  await cancelAllOfType('habit');
  if (!globalEnabled) return;
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  const notifications = [];
  const now = Date.now();

  for (const habit of habits) {
    if (!Array.isArray(habit.reminders) || habit.reminders.length === 0) continue;
    for (const rem of habit.reminders) {
      const isEnabled = rem.enabled !== false && rem.enabled !== 0 && rem.enabled !== '0';
      if (!isEnabled) continue;
      const t = parseTime(rem.reminder_time);
      if (!t) continue;

      const repeatRule = rem.repeat_rule ? (typeof rem.repeat_rule === 'string' ? JSON.parse(rem.repeat_rule) : rem.repeat_rule) : { type: 'daily' };
      for (let day = 0; day < 7; day++) {
        const fireDate = buildDailyFireDate(day, t.hour, t.minute);
        if (fireDate.getTime() <= now) continue;
        if (!isRepeatDayMatch(repeatRule, fireDate)) continue;

        const title = `✅ ${habit.title || habit.label || 'Habit Reminder'}`;
        const body = "Don't forget to complete your habit today!";

        if (Capacitor.getPlatform() === 'web') {
          scheduleWebFallback(title, body, fireDate);
        } else {
          const id = makeNotifId('habit', habit.id, rem.id, day);
          notifications.push({
            id,
            title,
            body,
            schedule: { at: fireDate, allowWhileIdle: true },
            channelId: 'default',
            extra: { entityType: 'habit', entityId: habit.id, reminderId: rem.id }
          });
        }
      }
    }
  }

  if (notifications.length > 0 && Capacitor.getPlatform() !== 'web') {
    await LocalNotifications.schedule({ notifications });
  }
}

// ─── Schedule water reminders ─────────────────────────────────────────────────
export async function scheduleWaterReminders({ enabled, startTime, endTime, intervalMinutes }, globalEnabled = true) {
  await cancelAllOfType('water');
  if (!enabled || !globalEnabled) return;
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  const sTime = parseTime(startTime || '08:00');
  const eTime = parseTime(endTime || '22:00');
  const interval = Number(intervalMinutes) || 60;
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
        const title = '💧 Hydration Reminder';
        const body = "Time to drink some water! Stay hydrated.";
        if (Capacitor.getPlatform() === 'web') {
          scheduleWebFallback(title, body, fireDate);
        } else {
          const id = makeNotifId('water', 1, slotId, day);
          notifications.push({
            id,
            title,
            body,
            schedule: { at: fireDate, allowWhileIdle: true },
            channelId: 'default',
            extra: { entityType: 'water', entityId: 1, reminderId: slotId }
          });
        }
      }
      slotId++;
      const totalMinutes = hour * 60 + minute + interval;
      hour = Math.floor(totalMinutes / 60);
      minute = totalMinutes % 60;
      if (hour >= 24) break;
    }
  }

  if (notifications.length > 0 && Capacitor.getPlatform() !== 'web') {
    await LocalNotifications.schedule({ notifications });
  }
}

// ─── Schedule sleep reminder ──────────────────────────────────────────────────
export async function scheduleSleepReminders({ enabled, reminderTime }, globalEnabled = true) {
  await cancelAllOfType('sleep');
  if (!enabled || !globalEnabled) return;
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  const t = parseTime(reminderTime || '22:00');
  if (!t) return;

  const notifications = [];
  const now = Date.now();

  for (let day = 0; day < 7; day++) {
    const fireDate = buildDailyFireDate(day, t.hour, t.minute);
    if (fireDate.getTime() <= now) continue;

    const title = '😴 Bedtime Reminder';
    const body = "Time to wind down and get ready for bed!";
    if (Capacitor.getPlatform() === 'web') {
      scheduleWebFallback(title, body, fireDate);
    } else {
      const id = makeNotifId('sleep', 1, 1, day);
      notifications.push({
        id,
        title,
        body,
        schedule: { at: fireDate, allowWhileIdle: true },
        channelId: 'default',
        extra: { entityType: 'sleep', entityId: 1, reminderId: 1 }
      });
    }
  }

  if (notifications.length > 0 && Capacitor.getPlatform() !== 'web') {
    await LocalNotifications.schedule({ notifications });
  }
}

// ─── Schedule workout reminders ───────────────────────────────────────────────
export async function scheduleWorkoutReminders({ enabled, reminderTime, repeatRule }, globalEnabled = true) {
  await cancelAllOfType('workout');
  if (!enabled || !globalEnabled) return;
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

    const title = '💪 Workout Reminder';
    const body = "Time to hit the gym! Don't skip today's workout.";
    if (Capacitor.getPlatform() === 'web') {
      scheduleWebFallback(title, body, fireDate);
    } else {
      const id = makeNotifId('workout', 1, 1, day);
      notifications.push({
        id,
        title,
        body,
        schedule: { at: fireDate, allowWhileIdle: true },
        channelId: 'default',
        extra: { entityType: 'workout', entityId: 1, reminderId: 1 }
      });
    }
  }

  if (notifications.length > 0 && Capacitor.getPlatform() !== 'web') {
    await LocalNotifications.schedule({ notifications });
  }
}

// ─── Schedule morning summary notifications ───────────────────────────────────
export async function scheduleMorningSummaryReminders({ enabled, reminderTime, userName, calendarEvents }, globalEnabled = true) {
  await cancelAllOfType('summary');
  if (!enabled || !globalEnabled) return;
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

    const title = '🌅 Morning Summary';
    if (Capacitor.getPlatform() === 'web') {
      scheduleWebFallback(title, body, fireDate);
    } else {
      const id = makeNotifId('summary', 1, 1, day);
      notifications.push({
        id,
        title,
        body,
        schedule: { at: fireDate, allowWhileIdle: true },
        channelId: 'default',
        extra: { entityType: 'summary', entityId: 1, reminderId: 1 }
      });
    }
  }

  if (notifications.length > 0 && Capacitor.getPlatform() !== 'web') {
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
