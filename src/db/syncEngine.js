import db from './db';
import { safeStorage } from '../utils/safeStorage';
import { getApiUrl } from '../utils/apiUrl';

let isSyncing = false;
const listeners = new Set();

export const getSyncStatus = async () => {
  if (typeof window !== 'undefined' && !navigator.onLine) {
    return 'Offline';
  }
  if (isSyncing) {
    return 'Syncing';
  }
  const pendingCount = await db.syncQueue.where('status').equals('pending').count();
  const shouldSyncState = await db.metaState.get('shouldSyncToday');
  const shouldSync = shouldSyncState ? shouldSyncState.value : true;

  if (pendingCount > 0 || shouldSync) {
    return 'Pending Sync';
  }
  return 'Synced';
};

export const subscribeSyncStatus = (callback) => {
  listeners.add(callback);
  getSyncStatus().then(status => callback(status));
  return () => listeners.delete(callback);
};

export const notifyStatusChange = async () => {
  const status = await getSyncStatus();
  listeners.forEach(cb => cb(status));
};

// Check and update shouldSyncToday internal flag at 00:00 or app launch
export const checkDailySyncFlag = async () => {
  const todayStr = new Date().toISOString().split('T')[0];
  const lastSyncDateState = await db.metaState.get('lastSyncDate');
  const lastSyncDate = lastSyncDateState?.value;

  if (lastSyncDate !== todayStr) {
    await db.metaState.put({ key: 'shouldSyncToday', value: true });
  }
  notifyStatusChange();
};

// Enqueue local mutation operation
export const queueMutation = async (table, op, recordId, payload) => {
  const now = new Date().toISOString();
  const item = {
    table,
    op,
    recordId: recordId ? recordId.toString() : (payload?.id ? payload.id.toString() : Date.now().toString()),
    payload: { ...(payload || {}), updatedAt: now },
    updatedAt: now,
    status: 'pending'
  };
  await db.syncQueue.add(item);
  notifyStatusChange();
};

// Main Background Sync Process
export const triggerSync = async () => {
  if (isSyncing) return;
  if (typeof window !== 'undefined' && !navigator.onLine) {
    notifyStatusChange();
    return;
  }

  const token = safeStorage.getItem('token');
  if (!token) {
    notifyStatusChange();
    return;
  }

  await checkDailySyncFlag();

  const shouldSyncState = await db.metaState.get('shouldSyncToday');
  const shouldSync = shouldSyncState ? shouldSyncState.value : true;
  const pendingCount = await db.syncQueue.where('status').equals('pending').count();

  if (!shouldSync && pendingCount === 0) {
    notifyStatusChange();
    return;
  }

  isSyncing = true;
  notifyStatusChange();

  try {
    const pendingItems = await db.syncQueue.where('status').equals('pending').toArray();

    // 1. Upload local queue changes to backend if any
    if (pendingItems.length > 0) {
      const response = await fetch(getApiUrl('/api/sync'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ items: pendingItems })
      });

      if (response.ok) {
        const qIds = pendingItems.map(item => item.qId);
        await db.syncQueue.bulkDelete(qIds);
      } else {
        throw new Error('Failed to push local changes to remote server');
      }
    }

    // 2. Fetch remote changes and merge using Last-Write-Wins (LWW)
    const lastSyncedState = await db.metaState.get('lastSyncedAt');
    const since = lastSyncedState?.value || '1970-01-01T00:00:00.000Z';

    const pullRes = await fetch(getApiUrl(`/api/sync?since=${encodeURIComponent(since)}`), {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (pullRes.ok) {
      const remoteData = await pullRes.json();

      // Merge remote tables using LWW conflict resolution based on updatedAt timestamp
      const tableNames = ['habits', 'todayItems', 'transactions', 'workouts', 'bodyStats', 'sleepLogs', 'notes', 'calendarEvents', 'aiMessages'];
      for (const tableName of tableNames) {
        const remoteRecords = remoteData[tableName] || [];
        for (const remoteRec of remoteRecords) {
          const localRec = await db[tableName].get(remoteRec.id);
          const remoteTime = new Date(remoteRec.updatedAt || remoteRec.updated_at || 0).getTime();
          const localTime = localRec ? new Date(localRec.updatedAt || localRec.updated_at || 0).getTime() : 0;

          if (!localRec || remoteTime >= localTime) {
            if (remoteRec.is_deleted) {
              await db[tableName].delete(remoteRec.id);
            } else {
              await db[tableName].put({ ...remoteRec, lastSyncedAt: new Date().toISOString() });
            }
          }
        }
      }

      const nowStr = new Date().toISOString();
      const todayStr = nowStr.split('T')[0];

      await db.metaState.put({ key: 'lastSyncedAt', value: nowStr });
      await db.metaState.put({ key: 'lastSyncDate', value: todayStr });
      await db.metaState.put({ key: 'shouldSyncToday', value: false });
    } else {
      throw new Error('Failed to fetch remote changes');
    }
  } catch (error) {
    console.warn('Sync engine background synchronization delayed:', error.message);
    await db.metaState.put({ key: 'shouldSyncToday', value: true });
  } finally {
    isSyncing = false;
    notifyStatusChange();
  }
};

// Initialize Background Listener for Network, Focus, and App Mount
export const initSyncListeners = () => {
  if (typeof window === 'undefined') return;

  window.addEventListener('online', () => {
    notifyStatusChange();
    triggerSync();
  });
  window.addEventListener('offline', () => {
    notifyStatusChange();
  });
  window.addEventListener('focus', () => {
    triggerSync();
  });

  // Check every hour for midnight day rollover
  setInterval(() => {
    checkDailySyncFlag().then(() => triggerSync());
  }, 3600000);

  // Initial trigger on app launch
  checkDailySyncFlag().then(() => triggerSync());
};
