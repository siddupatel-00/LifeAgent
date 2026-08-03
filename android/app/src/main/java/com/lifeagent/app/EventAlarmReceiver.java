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
 * Handles Calendar Event alarms natively.
 * Reads event reminders from SharedPreferences("event_reminders")
 * and sets exact setAlarmClock OS alarms. Survives app swipe-kill and reboots.
 */
public class EventAlarmReceiver extends BroadcastReceiver {
    public static final String PREFS = "event_reminders";
    public static final String CHANNEL_ID = "reminders";
    public static final int EVENT_BASE = 910000;

    public static PendingIntent buildIntent(Context c, int eventId, String title, String timeStr) {
        Intent i = new Intent(c, EventAlarmReceiver.class);
        i.putExtra("eventId", eventId);
        i.putExtra("title", title);
        i.putExtra("timeStr", timeStr);

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        return PendingIntent.getBroadcast(c, EVENT_BASE + (eventId % 100000), i, flags);
    }

    public static void scheduleAllFromPrefs(Context c) {
        SharedPreferences p = c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        if (!p.getBoolean("enabled", true)) return;

        String json = p.getString("eventsJson", "[]");
        if (json == null || json.trim().isEmpty() || json.equals("[]")) return;

        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;

        try {
            JSONArray events = new JSONArray(json);
            long now = System.currentTimeMillis();

            for (int i = 0; i < events.length(); i++) {
                JSONObject ev = events.optJSONObject(i);
                if (ev == null) continue;

                int eventId = ev.optInt("id", i + 1);
                String title = ev.optString("title", "Upcoming Event");
                String dateStr = ev.optString("date", ""); // "YYYY-MM-DD"
                String timeStr = ev.optString("time", "09:00"); // "HH:MM"
                int offsetMinutes = ev.optInt("offset", 0);

                if (dateStr.trim().isEmpty()) continue;

                String[] dateParts = dateStr.split("T")[0].split("-");
                if (dateParts.length < 3) continue;

                int year = Integer.parseInt(dateParts[0].trim());
                int month = Integer.parseInt(dateParts[1].trim()) - 1;
                int day = Integer.parseInt(dateParts[2].trim());

                int hour = 9, minute = 0;
                if (!timeStr.trim().isEmpty()) {
                    String[] tParts = timeStr.trim().split(":");
                    if (tParts.length >= 2) {
                        hour = Integer.parseInt(tParts[0].trim());
                        minute = Integer.parseInt(tParts[1].trim());
                    }
                }

                Calendar fire = Calendar.getInstance();
                fire.set(Calendar.YEAR, year);
                fire.set(Calendar.MONTH, month);
                fire.set(Calendar.DAY_OF_MONTH, day);
                fire.set(Calendar.HOUR_OF_DAY, hour);
                fire.set(Calendar.MINUTE, minute);
                fire.set(Calendar.SECOND, 0);
                fire.set(Calendar.MILLISECOND, 0);

                if (offsetMinutes > 0) {
                    fire.add(Calendar.MINUTE, -offsetMinutes);
                }

                if (fire.getTimeInMillis() <= now + 2000) continue; // Skip past events

                PendingIntent pi = buildIntent(c, eventId, title, timeStr);

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    try {
                        AlarmManager.AlarmClockInfo clockInfo = new AlarmManager.AlarmClockInfo(fire.getTimeInMillis(), pi);
                        am.setAlarmClock(clockInfo, pi);
                    } catch (Exception ex) {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                            am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, fire.getTimeInMillis(), pi);
                        } else {
                            am.set(AlarmManager.RTC_WAKEUP, fire.getTimeInMillis(), pi);
                        }
                    }
                } else {
                    am.set(AlarmManager.RTC_WAKEUP, fire.getTimeInMillis(), pi);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public void onReceive(Context c, Intent intent) {
        try {
            if (intent == null) return;

            PowerManager pm = (PowerManager) c.getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                @SuppressWarnings("deprecation")
                PowerManager.WakeLock wl = pm.newWakeLock(
                    PowerManager.FULL_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP | PowerManager.ON_AFTER_RELEASE,
                    "lifeagent:event_alarm_wakelock"
                );
                wl.acquire(3000);
            }

            int eventId = intent.getIntExtra("eventId", -1);
            String title = intent.getStringExtra("title");
            if (title == null || title.trim().isEmpty()) title = "Upcoming Event";

            NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) return;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationChannel ch = new NotificationChannel(
                    CHANNEL_ID, "Reminders", NotificationManager.IMPORTANCE_HIGH);
                ch.setDescription("Calendar and habit reminders");
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
                tapIntent = PendingIntent.getActivity(c, EVENT_BASE + eventId + 50000, launch, piFlags);
            }

            Uri sound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);

            NotificationCompat.Builder builder = new NotificationCompat.Builder(c, CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle("📅 " + title)
                .setContentText("You have an upcoming event scheduled now!")
                .setStyle(new NotificationCompat.BigTextStyle().bigText("You have an upcoming event scheduled now!"))
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setAutoCancel(true)
                .setSound(sound)
                .setVibrate(new long[]{0, 300, 200, 300});

            if (tapIntent != null) {
                builder.setContentIntent(tapIntent);
            }

            nm.notify(EVENT_BASE + (eventId > 0 ? eventId % 100000 : 99), builder.build());

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
