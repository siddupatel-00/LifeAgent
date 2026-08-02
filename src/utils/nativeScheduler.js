// src/utils/nativeScheduler.js
import { openDB } from 'idb';

const DB_NAME = 'reminder-db';
const STORE_NAME = 'reminder-mapping';

async function getDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
}

export async function getMapping() {
  const db = await getDB();
  const stored = await db.get(STORE_NAME, 'mapping');
  return stored || [];
}

export async function persistMapping(mapping) {
  const db = await getDB();
  await db.put(STORE_NAME, mapping, 'mapping');
}

function removeFromMapping(reminderId) {
  return getMapping().then((mapping) => {
    const updated = mapping.filter((m) => m.reminderId !== reminderId);
    return persistMapping(updated);
  });
}

export function computeTimestamp(payload) {
  if (!payload) return null;
  if (payload.time) {
    const ts = typeof payload.time === 'string' ? Date.parse(payload.time) : +payload.time;
    if (!isNaN(ts)) return ts;
  }
  const now = Date.now();
  const ms =
    ((payload.days || 0) * 24 * 60 * 60 * 1000) +
    ((payload.hours || 0) * 60 * 60 * 1000) +
    ((payload.minutes || 0) * 60 * 1000) +
    ((payload.seconds || 0) * 1000);
  return now + ms;
}

export async function scheduleReminders(reminders) {
  if (!Array.isArray(reminders)) throw new Error('reminders must be an array');
  const existing = await getMapping();
  const newMappings = [];

  reminders.forEach((rem) => {
    const ts = computeTimestamp(rem);
    if (!ts) return;
    const delay = ts - Date.now();
    if (delay <= 0) return;
    const timerId = setTimeout(() => {
      console.log('🔔 Reminder fired:', rem);
      removeFromMapping(rem.id);
    }, delay);
    newMappings.push({ reminderId: rem.id, timerId, entityId: rem.entityId, entityType: rem.entityType });
  });

  const combined = existing.concat(newMappings);
  await persistMapping(combined);
  return newMappings;
}

export async function cancelRemindersByEntity(entityType, entityId) {
  const mapping = await getMapping();
  const toCancel = mapping.filter((m) => m.entityId === entityId && m.entityType === entityType);
  toCancel.forEach((m) => clearTimeout(m.timerId));
  const remaining = mapping.filter((m) => !(m.entityId === entityId && m.entityType === entityType));
  await persistMapping(remaining);
  return toCancel.map((m) => m.reminderId);
}

export default {
  scheduleReminders,
  cancelRemindersByEntity,
  persistMapping,
  getMapping,
  computeTimestamp,
};
