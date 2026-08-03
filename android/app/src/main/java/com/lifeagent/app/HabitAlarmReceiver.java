package com.lifeagent.app;

import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import androidx.core.app.NotificationCompat;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.Calendar;

/**
 * Handles per-habit alarms. Each habit gets its own PendingIntent using
 * (HABIT_BASE + habitId) as the request code, making alarms fully independent.
 * One habit failing or being rescheduled cannot affect any other habit.
 */
public class HabitAlarmReceiver extends BroadcastReceiver {

    // Base offset so habit IDs don't clash with other receivers
    static final int HABIT_BASE = 820000;
    static final String CHANNEL_ID = "habit_reminders";

    // ── Build the PendingIntent for one specific habit ──────────────────────
    static PendingIntent buildIntent(Context c, int habitId, String title, String timeStr) {
        Intent i = new Intent(c, HabitAlarmReceiver.class);
        i.putExtra("habitId", habitId);
        i.putExtra("title", title);
        i.putExtra("timeStr", timeStr);  // "HH:MM" — needed so onReceive can reschedule for next day

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        // Unique request code per habit ensures each has its own independent alarm slot
        return PendingIntent.getBroadcast(c, HABIT_BASE + habitId, i, flags);
    }

    // ── Schedule (or reschedule) ONE habit ──────────────────────────────────
    public static void scheduleHabit(Context c, int habitId, String title, String timeStr) {
        if (timeStr == null || timeStr.trim().isEmpty()) return;

        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;

        String[] parts = timeStr.split(":");
        if (parts.length < 2) return;

        int hour, minute;
        try {
            hour   = Integer.parseInt(parts[0].trim());
            minute = Integer.parseInt(parts[1].trim());
        } catch (NumberFormatException e) {
            return;
        }

        Calendar fire = Calendar.getInstance();
        fire.set(Calendar.HOUR_OF_DAY, hour);
        fire.set(Calendar.MINUTE, minute);
        fire.set(Calendar.SECOND, 0);
        fire.set(Calendar.MILLISECOND, 0);

        // If the time already passed today, schedule for tomorrow
        if (fire.getTimeInMillis() <= System.currentTimeMillis()) {
            fire.add(Calendar.DATE, 1);
        }

        PendingIntent pi = buildIntent(c, habitId, title, timeStr);

        // setAlarmClock() is the ONLY AlarmManager method that:
        //   1. Bypasses Doze mode completely (fires even when screen is locked/off)
        //   2. Does NOT require SCHEDULE_EXACT_ALARM permission on Android 12+
        //   3. Shows alarm icon in status bar (visible indicator the alarm is set)
        // This is what clock/alarm apps use — it's the most reliable delivery method.
        Intent launchIntent = c.getPackageManager().getLaunchIntentForPackage(c.getPackageName());
        PendingIntent showIntent = null;
        if (launchIntent != null) {
            int showFlags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) showFlags |= PendingIntent.FLAG_IMMUTABLE;
            // Unique request code so each habit's show-intent doesn't overwrite others
            showIntent = PendingIntent.getActivity(c, HABIT_BASE + habitId + 100000, launchIntent, showFlags);
        }
        AlarmManager.AlarmClockInfo clockInfo = new AlarmManager.AlarmClockInfo(fire.getTimeInMillis(), showIntent);
        am.setAlarmClock(clockInfo, pi);
    }

    // ── Cancel ONE habit's alarm ────────────────────────────────────────────
    public static void cancelHabit(Context c, int habitId) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;

        // Create a matching (but empty extras) intent just to cancel
        Intent i = new Intent(c, HabitAlarmReceiver.class);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent pi = PendingIntent.getBroadcast(c, HABIT_BASE + habitId, i, flags);
        am.cancel(pi);
        pi.cancel();
    }

    // ── Re-schedule ALL habits from SharedPreferences ──────────────────────
    //    Called from boot receiver and plugin configure
    public static void scheduleAllFromPrefs(Context c) {
        SharedPreferences p = c.getSharedPreferences("habit_reminders", Context.MODE_PRIVATE);
        if (!p.getBoolean("enabled", true)) return;

        String json = p.getString("habitsJson", "[]");
        if (json == null || json.trim().isEmpty() || json.equals("[]")) return;

        try {
            JSONArray habits = new JSONArray(json);
            for (int i = 0; i < habits.length(); i++) {
                JSONObject h  = habits.getJSONObject(i);
                boolean enabled = h.optBoolean("enabled", true);
                if (!enabled) continue;

                int    habitId = h.optInt("id", i);
                String title   = h.optString("title", "Habit Reminder");
                String timeStr = h.optString("time", "");
                if (timeStr.trim().isEmpty()) continue;

                scheduleHabit(c, habitId, title, timeStr);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    // ── Broadcast received: show notification, then reschedule for next day ─
    @Override
    public void onReceive(Context c, Intent intent) {
        // Hold a wake lock so the CPU doesn't sleep before we post the notification
        PowerManager pm = (PowerManager) c.getSystemService(Context.POWER_SERVICE);
        PowerManager.WakeLock wl = null;
        if (pm != null) {
            wl = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "LifeAgent::HabitWakeLock");
            wl.acquire(30_000L);
        }

        try {
            if (intent == null) return;

            int    habitId = intent.getIntExtra("habitId", -1);
            String title   = intent.getStringExtra("title");
            String timeStr = intent.getStringExtra("timeStr");

            if (title == null || title.trim().isEmpty()) title = "Habit Reminder";

            // Create notification channel (Android 8+)
            NotificationManager nm =
                (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) return;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationChannel ch = new NotificationChannel(
                    CHANNEL_ID, "Habit Reminders", NotificationManager.IMPORTANCE_HIGH);
                ch.setDescription("Reminders for your daily habits");
                ch.enableLights(true);
                ch.setLightColor(Color.BLUE);
                ch.enableVibration(true);
                ch.setVibrationPattern(new long[]{0, 300, 200, 300});
                ch.setLockscreenVisibility(NotificationCompat.VISIBILITY_PUBLIC);
                ch.setBypassDnd(true);

                Uri soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
                if (soundUri != null) {
                    AudioAttributes aa = new AudioAttributes.Builder()
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .build();
                    ch.setSound(soundUri, aa);
                }
                nm.createNotificationChannel(ch);
            }

            // Tap-to-open intent
            Intent launch = c.getPackageManager().getLaunchIntentForPackage(c.getPackageName());
            PendingIntent tapIntent = null;
            if (launch != null) {
                launch.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
                int piFlags = PendingIntent.FLAG_UPDATE_CURRENT;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    piFlags |= PendingIntent.FLAG_IMMUTABLE;
                }
                // Unique request code per habit so tap targets don't overwrite each other
                tapIntent = PendingIntent.getActivity(c, HABIT_BASE + habitId + 50000, launch, piFlags);
            }

            Uri sound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);

            NotificationCompat.Builder builder = new NotificationCompat.Builder(c, CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle("✅ " + title)
                .setContentText("Don't forget to complete your habit today!")
                .setStyle(new NotificationCompat.BigTextStyle()
                    .bigText("Don't forget to complete your habit today!"))
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setAutoCancel(true)
                .setSound(sound)
                .setVibrate(new long[]{0, 300, 200, 300})
                .setDefaults(NotificationCompat.DEFAULT_LIGHTS);

            if (tapIntent != null) {
                builder.setContentIntent(tapIntent);
            }

            // Use HABIT_BASE + habitId so each habit has a unique notification slot
            nm.notify(HABIT_BASE + habitId, builder.build());

            // ── Reschedule this exact alarm for the same time tomorrow ──────
            // This is critical: we don't rely on a central "scheduleNext" loop.
            // Each habit independently reschedules itself 24 hours later.
            if (timeStr != null && !timeStr.trim().isEmpty() && habitId >= 0) {
                SharedPreferences prefs = c.getSharedPreferences("habit_reminders", Context.MODE_PRIVATE);
                if (prefs.getBoolean("enabled", true)) {
                    scheduleHabit(c, habitId, title, timeStr);
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            if (wl != null && wl.isHeld()) wl.release();
        }
    }
}
