// src/utils/reminderScheduler.js
// Uses Capacitor LocalNotifications on native mobile + Web Notification API fallback on web.
// Works when app is killed or after reboot on native devices.

import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor, registerPlugin } from '@capacitor/core';

const NativeAlarmScheduler = registerPlugin('NativeAlarmScheduler');
const NativeHabitScheduler = registerPlugin('NativeHabitScheduler');
const NativeWaterScheduler = registerPlugin('NativeWaterScheduler');
const NativeDailyScheduler = registerPlugin('NativeDailyScheduler');

const LAST_SCHEDULED_DAY_KEY = 'reminder_last_scheduled_day';

// Web timer storage
const webTimers = [];

// Profile, habits, and settings load independently during startup. Only the
// newest habit-scheduling run may update Android's saved alarm configuration.
let habitScheduleGeneration = 0;

// Collapse rapid regenerateAllReminders calls (startup + settings churn) so we
// don't cancel alarms and get killed before the final schedule completes.
let regenDebounceTimer = null;
let regenPendingArgs = null;

async function dispatchNotifications(notifications) {
  if (!notifications || notifications.length === 0 || Capacitor.getPlatform() === 'web') return;

  try {
    await LocalNotifications.schedule({ notifications });
    console.log(`[reminderScheduler] Scheduled ${notifications.length} LocalNotifications.`);
  } catch (err) {
    console.warn('[reminderScheduler] LocalNotifications schedule error:', err);
  }

  // Dual-scheduling: Also schedule via Android System Alarm Clock for 100% exact lockscreen/killed-app delivery
  if (Capacitor.getPlatform() === 'android' && NativeAlarmScheduler) {
    const validNotifs = notifications.filter(n => {
      const fireAt = n.schedule?.at ? new Date(n.schedule.at).getTime() : null;
      return fireAt && fireAt > Date.now();
    });

    // Fire all native alarm registrations concurrently in parallel (~30ms total)
    await Promise.all(
      validNotifs.map(n => 
        NativeAlarmScheduler.scheduleAlarm({
          id: n.id,
          title: n.title,
          body: n.body,
          timestamp: new Date(n.schedule.at).getTime()
        }).catch(err => console.warn('[reminderScheduler] NativeAlarmScheduler error:', err))
      )
    );
  }
}

function clearWebTimers(type) {
  if (type) {
    for (let i = webTimers.length - 1; i >= 0; i--) {
      if (webTimers[i].type === type) {
        clearTimeout(webTimers[i].id);
        webTimers.splice(i, 1);
      }
    }
  } else {
    webTimers.forEach(t => clearTimeout(t.id));
    webTimers.length = 0;
  }
}

// ─── Ensure Exact Alarm Permission ──────────────────────────────────────────
export async function ensureExactAlarmPermission() {
  if (Capacitor.getPlatform() !== 'android' || !NativeAlarmScheduler) return true;
  try {
    const result = await NativeAlarmScheduler.checkExactAlarmPermission();
    if (result.granted) return true;
    // requestExactAlarmPermission opens the system settings screen and returns
    // immediately — it does NOT block until the user grants. So we optimistically
    // continue scheduling; the native alarm receiver will work once the user
    // grants the permission in the settings screen they just opened.
    NativeAlarmScheduler.requestExactAlarmPermission().catch(() => {});
    return true; // don't block habit scheduling while user is on the settings screen
  } catch (e) {
    console.warn('[reminderScheduler] Exact Alarm Permission error:', e);
    return true; // fail open — let the OS reject the alarm if truly denied
  }
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
      sound: 'default',
      lights: true,
      lightColor: '#4F46E5',
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

  const testId = 999999;
  const fireDate = new Date(Date.now() + 4000); // 4 seconds in future
  await dispatchNotifications([{
    id: testId,
    title,
    body,
    schedule: { at: fireDate, allowWhileIdle: true },
    channelId: 'default',
    sound: 'default',
  }]);
  return true;
}

// ─── Deterministic integer ID (never returns NaN) ────────────────────────────
function safeInt(val) {
  if (typeof val === 'number' && !isNaN(val)) return Math.abs(Math.floor(val)) % 10000;
  const str = String(val !== undefined && val !== null ? val : '');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 10000;
}

export function makeNotifId(entityType, entityId, reminderId, dayOffset) {
  const typeMap = { event: 1, habit: 2, water: 3, sleep: 4, workout: 5, summary: 6 };
  const t = typeMap[entityType] || 7;
  const eId = safeInt(entityId);
  const rId = safeInt(reminderId);
  const dOff = Math.abs(Number(dayOffset) || 0) % 100;

  const id = (dOff * 10_000_000 + t * 1_000_000 + eId * 100 + rId) % 2_147_483_647;
  return id || 100000;
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

// ─── Build fire Date from event date + event time + offset_minutes ──────────
function buildEventFireDate(eventDateStr, eventTimeStr, offsetMinutes) {
  if (!eventDateStr) return new Date(0);
  const cleanDateStr = String(eventDateStr).split('T')[0];
  const parts = cleanDateStr.split('-').map(Number);
  if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    return new Date(0);
  }
  const t = parseTime(eventTimeStr) || { hour: 0, minute: 0 };
  const d = new Date(parts[0], parts[1] - 1, parts[2], t.hour, t.minute, 0, 0);
  d.setMinutes(d.getMinutes() - (offsetMinutes || 0));
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
function scheduleWebFallback(title, body, fireDate, entityType = 'general') {
  if (Capacitor.getPlatform() !== 'web') return;
  const delay = fireDate.getTime() - Date.now();
  if (delay <= 0 || delay > 86400000) return; // max 24h for web timeout
  const timerId = setTimeout(async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          new Notification(title, { body, icon: '/favicon.ico' });
        } catch (e) {
          console.warn('[reminderScheduler] Web Notification create failed:', e);
        }
      } else if (Notification.permission === 'default') {
        try {
          const perm = await Notification.requestPermission();
          if (perm === 'granted') {
            new Notification(title, { body, icon: '/favicon.ico' });
          }
        } catch (e) {}
      }
    }
  }, delay);
  webTimers.push({ id: timerId, type: entityType });
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
        if (Capacitor.getPlatform() === 'android' && NativeAlarmScheduler) {
          NativeAlarmScheduler.cancelAlarm({ id: n.id }).catch(() => {});
        }
      }
    }
    if (toCancel.length > 0) {
      await LocalNotifications.cancel({ notifications: toCancel });
      console.log(`[reminderScheduler] Cancelled ${toCancel.length} ${entityType} reminders for entity ${entityId}.`);
    }
  } catch (e) {
    console.warn('[reminderScheduler] cancelEntityReminders error:', e);
  }
}

// ─── Cancel all reminders of a given type (e.g., water, sleep) ───────────────
export async function cancelAllOfType(entityType) {
  if (Capacitor.getPlatform() === 'web') {
    clearWebTimers(entityType);
    console.log(`[reminderScheduler] Cleared web timers for ${entityType}.`);
    return;
  }
  try {
    const pending = await LocalNotifications.getPending();
    const toCancel = [];
    for (const n of (pending?.notifications || [])) {
      if (n.extra && n.extra.entityType === entityType) {
        toCancel.push({ id: n.id });
        if (Capacitor.getPlatform() === 'android' && NativeAlarmScheduler) {
          NativeAlarmScheduler.cancelAlarm({ id: n.id }).catch(() => {});
        }
      }
    }
    if (toCancel.length > 0) {
      await LocalNotifications.cancel({ notifications: toCancel });
      console.log(`[reminderScheduler] Cancelled ${toCancel.length} ${entityType} native reminders.`);
    }
  } catch (e) {
    console.warn('[reminderScheduler] cancelAllOfType error:', e);
  }
}

// Schedule new alarms first, then remove stale ones. Avoids a killed-app window
// where everything was cancelled but nothing new was registered yet.
async function replaceNotificationsOfType(entityType, notifications) {
  if (Capacitor.getPlatform() === 'web') return;

  const newIds = new Set((notifications || []).map(n => n.id));

  if (notifications && notifications.length > 0) {
    await dispatchNotifications(notifications);
  }

  try {
    const pending = await LocalNotifications.getPending();
    const toCancel = [];
    for (const n of (pending?.notifications || [])) {
      if (n.extra && n.extra.entityType === entityType && !newIds.has(n.id)) {
        toCancel.push({ id: n.id });
        if (Capacitor.getPlatform() === 'android' && NativeAlarmScheduler) {
          NativeAlarmScheduler.cancelAlarm({ id: n.id }).catch(() => {});
        }
      }
    }
    if (toCancel.length > 0) {
      await LocalNotifications.cancel({ notifications: toCancel });
      console.log(`[reminderScheduler] Removed ${toCancel.length} stale ${entityType} reminders.`);
    }
  } catch (e) {
    console.warn('[reminderScheduler] replaceNotificationsOfType error:', e);
  }
}

// ─── Schedule event reminders for next 7 days ────────────────────────────────
export async function scheduleEventReminders(events, globalEnabled = true) {
  if (!globalEnabled) {
    await cancelAllOfType('event');
    return;
  }
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    await cancelAllOfType('event');
    return;
  }

  const notifications = [];
  const now = Date.now();

  for (const event of (events || [])) {
    if (!event.date) continue;
    const reminders = Array.isArray(event.reminders) && event.reminders.length > 0
      ? event.reminders
      : [{ id: 1, offset_minutes: 0, enabled: true }];

    for (const rem of reminders) {
      const isEnabled = rem.enabled !== false && rem.enabled !== 0 && rem.enabled !== '0';
      if (!isEnabled) continue;
      const fireDate = buildEventFireDate(event.date, event.time, rem.offset_minutes || 0);
      if (isNaN(fireDate.getTime()) || fireDate.getTime() <= now) continue;
      const diffDays = Math.floor((fireDate.getTime() - now) / 86400000);
      if (diffDays > 7) continue;

      const title = `📅 ${event.title || 'Upcoming Event'}`;
      const body = (rem.offset_minutes || 0) === 0 ? 'Event starting now!' : `Event in ${rem.offset_minutes} minutes`;

      if (Capacitor.getPlatform() === 'web') {
        scheduleWebFallback(title, body, fireDate, 'event');
      } else {
        const id = makeNotifId('event', event.id || 1, rem.id || 1, 0);
        notifications.push({
          id,
          title,
          body,
          schedule: { at: fireDate, allowWhileIdle: true },
          channelId: 'default',
          sound: 'default',
          extra: { entityType: 'event', entityId: String(event.id || 1), reminderId: String(rem.id || 1) }
        });
      }
    }
  }

  if (notifications.length > 0) {
    await replaceNotificationsOfType('event', notifications);
  } else {
    await cancelAllOfType('event');
  }
}

// ─── Schedule habit reminders ──────────────────────────────────────────────────
export async function scheduleHabitReminders(habitsOrObj, globalEnabled = true) {
  const generation = ++habitScheduleGeneration;

  if (!globalEnabled) {
    await cancelAllOfType('habit');
    if (Capacitor.getPlatform() === 'android') {
      await NativeHabitScheduler.configure({ enabled: false, habitsJson: '[]' }).catch(() => {});
    }
    return;
  }

  const hasPermission = await requestNotificationPermission();
  if (generation !== habitScheduleGeneration) return;
  if (!hasPermission) {
    await cancelAllOfType('habit');
    if (Capacitor.getPlatform() === 'android') {
      await NativeHabitScheduler.configure({ enabled: false, habitsJson: '[]' }).catch(() => {});
    }
    return;
  }

  await ensureExactAlarmPermission();
  if (generation !== habitScheduleGeneration) return;

  let habits = [];
  let daily7pmEnabled = false;
  let userName = 'User';

  if (Array.isArray(habitsOrObj)) {
    habits = habitsOrObj;
  } else if (habitsOrObj && typeof habitsOrObj === 'object') {
    habits = Array.isArray(habitsOrObj.habits) ? habitsOrObj.habits : [];
    daily7pmEnabled = !!habitsOrObj.daily7pmEnabled;
    userName = habitsOrObj.userName || 'User';
  }

  const notifications = [];
  const habitPayloads = [];
  const now = Date.now();

  // 1. Individual per-habit reminders
  for (let i = 0; i < habits.length; i++) {
    const habit = habits[i];
    if (!habit || habit.archived) continue;

    let rems = [];
    if (Array.isArray(habit.reminders)) {
      rems = habit.reminders;
    } else if (typeof habit.reminders === 'string') {
      try {
        rems = JSON.parse(habit.reminders);
      } catch (e) {
        rems = [];
      }
    }

    const singleTime = habit.reminder_time || habit.reminderTime || habit.time;
    if ((!Array.isArray(rems) || rems.length === 0) && singleTime) {
      rems = [{ id: 1, reminder_time: singleTime, enabled: true }];
    }

    if (!Array.isArray(rems) || rems.length === 0) continue;

    for (const rem of rems) {
      const isEnabled = rem.enabled !== false && rem.enabled !== 0 && rem.enabled !== '0';
      if (!isEnabled) continue;

      const timeStr = rem.reminder_time || rem.time || rem.reminderTime;
      const t = parseTime(timeStr);
      if (!t) continue;

      if (Capacitor.getPlatform() === 'android') {
        habitPayloads.push({
          slot: habitPayloads.length + 1,
          title: habit.title || habit.label || 'Habit Reminder',
          time: `${String(t.hour).padStart(2, '0')}:${String(t.minute).padStart(2, '0')}`,
          enabled: true,
        });
      }

      let repeatRule = { type: 'daily' };
      if (rem.repeat_rule) {
        try {
          repeatRule = typeof rem.repeat_rule === 'string' ? JSON.parse(rem.repeat_rule) : rem.repeat_rule;
        } catch {
          repeatRule = { type: 'daily' };
        }
      } else if (habit.frequency) {
        repeatRule = { type: habit.frequency, customDays: habit.custom_days ? String(habit.custom_days).split(',') : [] };
      }

      for (let day = 0; day < 14; day++) {
        const fireDate = buildDailyFireDate(day, t.hour, t.minute);
        if (fireDate.getTime() <= now) continue;
        if (!isRepeatDayMatch(repeatRule, fireDate)) continue;

        const habitName = habit.title || habit.label || 'Habit';
        const title = `✅ ${habitName}`;
        const body = `Reminder to complete your habit: ${habitName}`;

        if (Capacitor.getPlatform() === 'web') {
          scheduleWebFallback(title, body, fireDate, 'habit');
        } else {
          const id = makeNotifId('habit', habit.id || i, rem.id || 1, day);
          notifications.push({
            id,
            title,
            body,
            schedule: { at: fireDate, allowWhileIdle: true },
            channelId: 'default',
            sound: 'default',
            extra: { entityType: 'habit', entityId: String(habit.id || i), reminderId: String(rem.id || 1) }
          });
        }
      }
    }
  }

  // 2. Global Daily 7 PM Check-in reminder
  if (daily7pmEnabled) {
    if (Capacitor.getPlatform() === 'android') {
      habitPayloads.push({
        slot: habitPayloads.length + 1,
        title: 'Daily Habit Check-in',
        time: '19:00',
        enabled: true,
      });
    }
    for (let day = 0; day < 7; day++) {
      const fireDate = buildDailyFireDate(day, 19, 0);
      if (fireDate.getTime() <= now) continue;

      const title = '🔥 Daily Habit Check-in';
      const body = `Hey ${userName}! Time to check off your habits for today.`;

      if (Capacitor.getPlatform() === 'web') {
        scheduleWebFallback(title, body, fireDate, 'habit');
      } else {
        const id = makeNotifId('habit', 9999, 7000, day);
        notifications.push({
          id,
          title,
          body,
          schedule: { at: fireDate, allowWhileIdle: true },
          channelId: 'default',
          sound: 'default',
          extra: { entityType: 'habit', entityId: '9999', reminderId: '7000' }
        });
      }
    }
  }

  if (generation !== habitScheduleGeneration) return;

  // Register native rolling alarms FIRST so a swipe-kill during JS scheduling
  // still leaves OS-level habit alarms active.
  if (Capacitor.getPlatform() === 'android') {
    try {
      await NativeHabitScheduler.configure({
        enabled: globalEnabled && habitPayloads.length > 0,
        habitsJson: JSON.stringify(habitPayloads),
      }).catch(e => console.warn('[reminderScheduler] NativeHabitScheduler configure error:', e));

      console.log(`[reminderScheduler] NativeHabitScheduler configured with ${habitPayloads.length} independent habit alarms.`);

      try {
        const batResult = await NativeAlarmScheduler.checkBatteryOptimization();
        if (!batResult.isIgnoring) {
          NativeAlarmScheduler.requestBatteryOptimizationExemption().catch(() => {});
        }
      } catch (e) { /* ignore */ }
    } catch (err) {
      console.warn('[reminderScheduler] NativeHabitScheduler plugin error:', err);
    }
  }

  if (generation !== habitScheduleGeneration) return;

  if (notifications.length > 0) {
    await replaceNotificationsOfType('habit', notifications);
  } else {
    await cancelAllOfType('habit');
  }
}

// ─── Schedule water reminders ─────────────────────────────────────────────────
export async function scheduleWaterReminders({ enabled, startTime, endTime, intervalMinutes, goal, hydration }, globalEnabled = true) {
  const isActive = enabled && globalEnabled;

  if (!isActive) {
    await cancelAllOfType('water');
    if (Capacitor.getPlatform() === 'android') {
      await NativeWaterScheduler.configure({
        enabled: false,
        startTime: startTime || '08:00',
        endTime: endTime || '22:00',
        intervalMinutes: Number(intervalMinutes) || 60,
        goal: Number(goal) || 2.5,
        hydration: Number(hydration) || 0,
      }).catch(() => {});
    }
    return;
  }

  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    await cancelAllOfType('water');
    return;
  }

  const sTime = parseTime(startTime || '08:00');
  const eTime = parseTime(endTime || '22:00');
  const interval = Number(intervalMinutes) || 60;
  if (!sTime || !eTime) return;

  // Native rolling alarm survives swipe-kill; register before batch scheduling.
  if (Capacitor.getPlatform() === 'android') {
    await NativeWaterScheduler.configure({
      enabled: true,
      startTime: startTime || '08:00',
      endTime: endTime || '22:00',
      intervalMinutes: interval,
      goal: Number(goal) || 2.5,
      hydration: Number(hydration) || 0,
    }).catch(e => console.warn('[reminderScheduler] NativeWaterScheduler configure error:', e));
  }

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
          scheduleWebFallback(title, body, fireDate, 'water');
        } else {
          const id = makeNotifId('water', 1, slotId, day);
          notifications.push({
            id,
            title,
            body,
            schedule: { at: fireDate, allowWhileIdle: true },
            channelId: 'default',
            sound: 'default',
            extra: { entityType: 'water', entityId: '1', reminderId: String(slotId) }
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

  if (notifications.length > 0) {
    await replaceNotificationsOfType('water', notifications);
  } else {
    await cancelAllOfType('water');
  }
}

async function configureNativeDailyReminders({
  sleepSettings = {},
  workoutSettings = {},
  summarySettings = {},
  globalEnabled = true,
} = {}) {
  if (Capacitor.getPlatform() !== 'android' || !NativeDailyScheduler) return;

  const fmt = (timeStr, fallback) => {
    const t = parseTime(timeStr || fallback);
    return t ? `${String(t.hour).padStart(2, '0')}:${String(t.minute).padStart(2, '0')}` : fallback;
  };

  const name = summarySettings.userName || 'User';
  const config = {
    sleep: {
      enabled: !!(sleepSettings.enabled && globalEnabled),
      time: fmt(sleepSettings.reminderTime, '22:00'),
      title: 'Bedtime Reminder',
      body: 'Time to wind down and get ready for bed!',
    },
    workout: {
      enabled: !!(workoutSettings.enabled && globalEnabled),
      time: fmt(workoutSettings.reminderTime, '07:00'),
      title: 'Workout Reminder',
      body: "Time to hit the gym! Don't skip today's workout.",
    },
    summary: {
      enabled: !!(summarySettings.enabled && globalEnabled),
      time: fmt(summarySettings.reminderTime, '07:00'),
      title: 'Morning Summary',
      body: `Good morning ${name}!`,
    },
  };

  await NativeDailyScheduler.configure({ configJson: JSON.stringify(config) }).catch(e =>
    console.warn('[reminderScheduler] NativeDailyScheduler configure error:', e)
  );
}

export async function scheduleSleepReminders({ enabled, reminderTime }, globalEnabled = true) {
  if (!enabled || !globalEnabled) {
    await cancelAllOfType('sleep');
    return;
  }
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    await cancelAllOfType('sleep');
    return;
  }

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
      scheduleWebFallback(title, body, fireDate, 'sleep');
    } else {
      const id = makeNotifId('sleep', 1, 1, day);
      notifications.push({
        id,
        title,
        body,
        schedule: { at: fireDate, allowWhileIdle: true },
        channelId: 'default',
        sound: 'default',
        extra: { entityType: 'sleep', entityId: '1', reminderId: '1' }
      });
    }
  }

  if (notifications.length > 0) {
    await replaceNotificationsOfType('sleep', notifications);
  } else {
    await cancelAllOfType('sleep');
  }
}

// ─── Schedule workout reminders ───────────────────────────────────────────────
export async function scheduleWorkoutReminders({ enabled, reminderTime, repeatRule }, globalEnabled = true) {
  if (!enabled || !globalEnabled) {
    await cancelAllOfType('workout');
    return;
  }
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    await cancelAllOfType('workout');
    return;
  }

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
      scheduleWebFallback(title, body, fireDate, 'workout');
    } else {
      const id = makeNotifId('workout', 1, 1, day);
      notifications.push({
        id,
        title,
        body,
        schedule: { at: fireDate, allowWhileIdle: true },
        channelId: 'default',
        sound: 'default',
        extra: { entityType: 'workout', entityId: '1', reminderId: '1' }
      });
    }
  }

  if (notifications.length > 0) {
    await replaceNotificationsOfType('workout', notifications);
  } else {
    await cancelAllOfType('workout');
  }
}

// ─── Schedule morning summary notifications ───────────────────────────────────
export async function scheduleMorningSummaryReminders({ enabled, reminderTime, userName, calendarEvents }, globalEnabled = true) {
  if (!enabled || !globalEnabled) {
    await cancelAllOfType('summary');
    return;
  }
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    await cancelAllOfType('summary');
    return;
  }

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
      scheduleWebFallback(title, body, fireDate, 'summary');
    } else {
      const id = makeNotifId('summary', 1, 1, day);
      notifications.push({
        id,
        title,
        body,
        schedule: { at: fireDate, allowWhileIdle: true },
        channelId: 'default',
        sound: 'default',
        extra: { entityType: 'summary', entityId: '1', reminderId: '1' }
      });
    }
  }

  if (notifications.length > 0) {
    await replaceNotificationsOfType('summary', notifications);
  } else {
    await cancelAllOfType('summary');
  }
}

async function regenerateAllRemindersNow({
  habits = [],
  events = [],
  waterSettings = {},
  sleepSettings = {},
  workoutSettings = {},
  summarySettings = {},
  globalEnabled = true,
} = {}) {
  console.log('[reminderScheduler] Regenerating all reminders...');
  // Native OS alarms first — survive swipe-kill like water reminders.
  await scheduleHabitReminders(habits, globalEnabled);
  await configureNativeDailyReminders({ sleepSettings, workoutSettings, summarySettings, globalEnabled });
  await Promise.all([
    scheduleEventReminders(events, globalEnabled),
    scheduleWaterReminders(waterSettings, globalEnabled),
    scheduleSleepReminders(sleepSettings, globalEnabled),
    scheduleWorkoutReminders(workoutSettings, globalEnabled),
    scheduleMorningSummaryReminders(summarySettings, globalEnabled),
  ]);
  localStorage.setItem(LAST_SCHEDULED_DAY_KEY, new Date().toISOString().split('T')[0]);
  console.log('[reminderScheduler] Done regenerating reminders.');
}

// ─── Regenerate ALL reminders (called on app launch, edits, reboot) ───────────
export function regenerateAllReminders(args = {}) {
  regenPendingArgs = args;
  if (regenDebounceTimer) clearTimeout(regenDebounceTimer);

  return new Promise((resolve, reject) => {
    regenDebounceTimer = setTimeout(async () => {
      regenDebounceTimer = null;
      const pending = regenPendingArgs;
      regenPendingArgs = null;
      try {
        await regenerateAllRemindersNow(pending || {});
        resolve();
      } catch (err) {
        reject(err);
      }
    }, 400);
  });
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
