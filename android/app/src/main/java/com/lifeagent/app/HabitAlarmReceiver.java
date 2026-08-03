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
    // Use the same verified channel as water reminders. Android persists channel
    // settings by ID, so a separately created habit channel can remain blocked
    // or silent even when water notifications are allowed on the lock screen.
    static final String CHANNEL_ID = "reminders";

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

        int hour = 0, minute = 0;
        try {
            String clean = timeStr.trim().toUpperCase();
            boolean isPM = clean.contains("PM");
            boolean isAM = clean.contains("AM");
            String digitsOnly = clean.replaceAll("[^0-9:]", "").trim();
            String[] parts = digitsOnly.split(":");
            if (parts.length < 2) return;
            hour   = Integer.parseInt(parts[0].trim());
            minute = Integer.parseInt(parts[1].trim());
            if (isPM && hour < 12) hour += 12;
            if (isAM && hour == 12) hour = 0;
        } catch (Exception e) {
            return;
        }

        Calendar fire = Calendar.getInstance();
        fire.set(Calendar.HOUR_OF_DAY, hour);
        fire.set(Calendar.MINUTE, minute);
        fire.set(Calendar.SECOND, 0);
        fire.set(Calendar.MILLISECOND, 0);

        // Add a 10-second buffer: exact alarms can fire a few ms early, and without
        // the buffer the reschedule would land in the past, causing an instant re-fire
        // and an infinite notification storm.
        if (fire.getTimeInMillis() <= System.currentTimeMillis() + 10_000) {
            fire.add(Calendar.DATE, 1);
        }

        PendingIntent pi = buildIntent(c, habitId, title, timeStr);

        // setAlarmClock is an OS-level Alarm Clock signal. Android OS NEVER defers
        // or suppresses setAlarmClock, even when the app is closed/swiped away,
        // screen is off, or the phone is in deep Doze mode.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            try {
                AlarmManager.AlarmClockInfo clockInfo = new AlarmManager.AlarmClockInfo(fire.getTimeInMillis(), pi);
                am.setAlarmClock(clockInfo, pi);
            } catch (Exception e) {
                // Fallback for unexpected security policies
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, fire.getTimeInMillis(), pi);
                } else {
                    am.set(AlarmManager.RTC_WAKEUP, fire.getTimeInMillis(), pi);
                }
            }
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            am.setExact(AlarmManager.RTC_WAKEUP, fire.getTimeInMillis(), pi);
        } else {
            am.set(AlarmManager.RTC_WAKEUP, fire.getTimeInMillis(), pi);
        }
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
                    CHANNEL_ID, "Reminders", NotificationManager.IMPORTANCE_HIGH);
                ch.setDescription("Water and habit reminders");
                ch.enableLights(true);
                ch.setLightColor(Color.BLUE);
                ch.enableVibration(true);
                ch.setVibrationPattern(new long[]{0, 300, 200, 300});
                ch.setLockscreenVisibility(NotificationCompat.VISIBILITY_PUBLIC);

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
        }
    }
}
