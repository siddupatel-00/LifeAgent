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
import org.json.JSONObject;
import java.util.Calendar;

/** Sleep / workout / summary — exact WaterAlarmReceiver pattern with fixed slots. */
public class DailyReminderReceiver extends BroadcastReceiver {
    public static final String PREFS = "daily_reminders";
    public static final String CHANNEL_ID = "reminders";
    public static final int SLEEP = 710002;
    public static final int WORKOUT = 710003;
    public static final int SUMMARY = 710004;

    static PendingIntent pi(Context c, int req) {
        Intent i = new Intent(c, DailyReminderReceiver.class);
        i.putExtra("req", req);
        return PendingIntent.getBroadcast(c, req, i,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    static int reqForType(String type) {
        if ("sleep".equals(type)) return SLEEP;
        if ("workout".equals(type)) return WORKOUT;
        if ("summary".equals(type)) return SUMMARY;
        return 0;
    }

    public static void scheduleType(Context c, String type) {
        SharedPreferences p = c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String json = p.getString("config", "{}");
        int req = reqForType(type);
        if (req == 0) return;

        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        PendingIntent pending = pi(c, req);
        am.cancel(pending);

        try {
            JSONObject item = new JSONObject(json).optJSONObject(type);
            if (item == null || !item.optBoolean("enabled", false)) return;

            String timeStr = item.optString("time", "");
            int hour = 0, minute = 0;
            String clean = timeStr.trim().toUpperCase();
            boolean isPM = clean.contains("PM");
            boolean isAM = clean.contains("AM");
            String[] parts = clean.replaceAll("[^0-9:]", "").split(":");
            if (parts.length < 2) return;
            hour = Integer.parseInt(parts[0].trim());
            minute = Integer.parseInt(parts[1].trim());
            if (isPM && hour < 12) hour += 12;
            if (isAM && hour == 12) hour = 0;

            Calendar next = Calendar.getInstance();
            next.set(Calendar.HOUR_OF_DAY, hour);
            next.set(Calendar.MINUTE, minute);
            next.set(Calendar.SECOND, 0);
            next.set(Calendar.MILLISECOND, 0);
            if (next.getTimeInMillis() <= System.currentTimeMillis() + 10_000) {
                next.add(Calendar.DATE, 1);
            }

            if (Build.VERSION.SDK_INT >= 21) {
                try {
                    am.setAlarmClock(new AlarmManager.AlarmClockInfo(next.getTimeInMillis(), pending), pending);
                } catch (Exception ex) {
                    if (Build.VERSION.SDK_INT >= 23) {
                        am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, next.getTimeInMillis(), pending);
                    } else {
                        am.set(AlarmManager.RTC_WAKEUP, next.getTimeInMillis(), pending);
                    }
                }
            } else {
                am.set(AlarmManager.RTC_WAKEUP, next.getTimeInMillis(), pending);
            }
        } catch (Exception e) { e.printStackTrace(); }
    }

    public static void scheduleAllFromPrefs(Context c) {
        scheduleType(c, "sleep");
        scheduleType(c, "workout");
        scheduleType(c, "summary");
    }

    static String typeForReq(int req) {
        if (req == SLEEP) return "sleep";
        if (req == WORKOUT) return "workout";
        if (req == SUMMARY) return "summary";
        return null;
    }

    @Override
    public void onReceive(Context c, Intent intent) {
        try {
            int req = intent != null ? intent.getIntExtra("req", 0) : 0;
            String type = typeForReq(req);
            if (type == null) return;

            // Acquire PowerManager WakeLock so screen lights up when phone is locked
            PowerManager pm = (PowerManager) c.getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                @SuppressWarnings("deprecation")
                PowerManager.WakeLock wl = pm.newWakeLock(
                    PowerManager.FULL_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP | PowerManager.ON_AFTER_RELEASE,
                    "lifeagent:daily_alarm_wakelock"
                );
                wl.acquire(3000);
            }

            JSONObject item;
            try {
                item = new JSONObject(c.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString("config", "{}"))
                    .optJSONObject(type);
            } catch (Exception e) { return; }
            if (item == null || !item.optBoolean("enabled", false)) return;

            String title = item.optString("title", "Reminder");
            String body = item.optString("body", "You have a scheduled reminder.");

            NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) return;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationChannel ch = new NotificationChannel(
                    CHANNEL_ID, "Reminders", NotificationManager.IMPORTANCE_HIGH);
                ch.setDescription("Daily sleep, workout, and summary reminders");
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

            Intent launch = c.getPackageManager().getLaunchIntentForPackage(c.getPackageName());
            PendingIntent tapIntent = null;
            if (launch != null) {
                launch.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
                int piFlags = PendingIntent.FLAG_UPDATE_CURRENT;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    piFlags |= PendingIntent.FLAG_IMMUTABLE;
                }
                tapIntent = PendingIntent.getActivity(c, req + 50000, launch, piFlags);
            }

            Uri sound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);

            NotificationCompat.Builder builder = new NotificationCompat.Builder(c, CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setAutoCancel(true)
                .setSound(sound)
                .setVibrate(new long[]{0, 300, 200, 300});

            if (tapIntent != null) {
                builder.setContentIntent(tapIntent);
            }

            nm.notify(req, builder.build());

            // Reschedule for tomorrow
            scheduleType(c, type);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
