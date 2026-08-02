import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export const checkAndRequestNotificationPermissions = async () => {
  if (Capacitor.getPlatform() === 'web') return true;
  
  const status = await LocalNotifications.checkPermissions();
  if (status.display === 'granted') {
    return true;
  }
  
  const requestStatus = await LocalNotifications.requestPermissions();
  return requestStatus.display === 'granted';
};

/**
 * Schedules a daily repeating notification.
 * @param {number} id Unique ID for the notification
 * @param {string} title Notification Title
 * @param {string} body Notification Body
 * @param {number} hour 24-hour format hour (0-23)
 * @param {number} minute Minute (0-59)
 */
export const scheduleDailyNotification = async (id, title, body, hour, minute) => {
  if (Capacitor.getPlatform() === 'web') {
    console.log(`[Web] Simulated Daily Notification Scheduled: ID ${id} at ${hour}:${minute} - "${title}"`);
    return;
  }
  
  const hasPermission = await checkAndRequestNotificationPermissions();
  if (!hasPermission) return;

  // Cancel any existing notification with this ID first
  await cancelNotification(id);

  await LocalNotifications.schedule({
    notifications: [
      {
        id,
        title,
        body,
        schedule: {
          repeats: true,
          every: 'day',
          on: {
            hour,
            minute
          }
        },
        actionTypeId: '',
        extra: null
      }
    ]
  });
};

/**
 * Schedules a one-off future notification.
 * @param {number} id Unique ID
 * @param {string} title Notification Title
 * @param {string} body Notification Body
 * @param {Date} date Javascript Date object for when it should fire
 */
export const scheduleFutureNotification = async (id, title, body, date) => {
  if (Capacitor.getPlatform() === 'web') {
    console.log(`[Web] Simulated Future Notification Scheduled: ID ${id} at ${date.toString()} - "${title}"`);
    return;
  }

  const hasPermission = await checkAndRequestNotificationPermissions();
  if (!hasPermission) return;

  // Do not schedule in the past
  if (date.getTime() < Date.now()) return;

  await cancelNotification(id);

  await LocalNotifications.schedule({
    notifications: [
      {
        id,
        title,
        body,
        schedule: {
          at: date,
          allowWhileIdle: true // Ensures it fires even if device is in Doze mode
        },
        actionTypeId: '',
        extra: null
      }
    ]
  });
};

/**
 * Cancels a previously scheduled notification by ID.
 * @param {number} id Unique ID
 */
export const cancelNotification = async (id) => {
  if (Capacitor.getPlatform() === 'web') return;
  
  await LocalNotifications.cancel({
    notifications: [{ id }]
  });
};

/**
 * Gets a list of all currently pending notifications.
 */
export const getPendingNotifications = async () => {
  if (Capacitor.getPlatform() === 'web') return { notifications: [] };
  return await LocalNotifications.getPending();
};
