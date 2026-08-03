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

public class HabitAlarmReceiver extends BroadcastReceiver {
  static final int REQUEST = 820001;

  static PendingIntent intent(Context c) {
    int flags = PendingIntent.FLAG_UPDATE_CURRENT;
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      flags |= PendingIntent.FLAG_IMMUTABLE;
    }
    return PendingIntent.getBroadcast(c, REQUEST, new Intent(c, HabitAlarmReceiver.class), flags);
  }

  public static void scheduleNext(Context c) {
    SharedPreferences p = c.getSharedPreferences("habit_reminders", Context.MODE_PRIVATE);
    AlarmManager a = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
    if (a == null) return;

    a.cancel(intent(c));
    if (!p.getBoolean("enabled", true)) return;

    String jsonString = p.getString("habitsJson", "[]");
    if (jsonString == null || jsonString.trim().isEmpty() || jsonString.equals("[]")) return;

    try {
      JSONArray habitsArray = new JSONArray(jsonString);
      if (habitsArray.length() == 0) return;

      Calendar now = Calendar.getInstance();
      long nowMillis = now.getTimeInMillis();
      long nextFireMillis = Long.MAX_VALUE;

      for (int i = 0; i < habitsArray.length(); i++) {
        JSONObject habit = habitsArray.getJSONObject(i);
        boolean enabled = habit.optBoolean("enabled", true);
        if (!enabled) continue;

        String timeStr = habit.optString("time", "");
        if (timeStr.trim().isEmpty()) continue;

        String[] parts = timeStr.split(":");
        if (parts.length < 2) continue;
        int h = Integer.parseInt(parts[0].trim());
        int m = Integer.parseInt(parts[1].trim());

        Calendar candidate = (Calendar) now.clone();
        candidate.set(Calendar.HOUR_OF_DAY, h);
        candidate.set(Calendar.MINUTE, m);
        candidate.set(Calendar.SECOND, 0);
        candidate.set(Calendar.MILLISECOND, 0);

        // If candidate time today is in the past, schedule for tomorrow
        if (candidate.getTimeInMillis() <= nowMillis + 2000) {
          candidate.add(Calendar.DATE, 1);
        }

        long candidateMillis = candidate.getTimeInMillis();
        if (candidateMillis < nextFireMillis) {
          nextFireMillis = candidateMillis;
        }
      }

      if (nextFireMillis != Long.MAX_VALUE) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            a.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, nextFireMillis, intent(c));
        } else {
            a.set(AlarmManager.RTC_WAKEUP, nextFireMillis, intent(c));
        }
      }
    } catch (Exception e) {
      e.printStackTrace();
    }
  }

  @Override
  public void onReceive(Context c, Intent i) {
    PowerManager pm = (PowerManager) c.getSystemService(Context.POWER_SERVICE);
    PowerManager.WakeLock wakeLock = null;
    if (pm != null) {
      wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "LifeAgent::HabitAlarmWakeLock");
      wakeLock.acquire(60000); // 60 seconds max
    }

    try {
      SharedPreferences p = c.getSharedPreferences("habit_reminders", Context.MODE_PRIVATE);
      if (p.getBoolean("enabled", true)) {
        String jsonString = p.getString("habitsJson", "[]");
        Calendar now = Calendar.getInstance();
        int currentMinuteOfDay = now.get(Calendar.HOUR_OF_DAY) * 60 + now.get(Calendar.MINUTE);

        JSONArray habitsArray = new JSONArray(jsonString);
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);

        if (nm != null) {
          if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel channel = new NotificationChannel("reminders", "Reminders", NotificationManager.IMPORTANCE_HIGH);
            channel.setDescription("High priority alerts for habits and goals");
            channel.enableLights(true);
            channel.setLightColor(Color.BLUE);
            channel.enableVibration(true);
            channel.setLockscreenVisibility(NotificationCompat.VISIBILITY_PUBLIC);
            channel.setBypassDnd(true);
            
            Uri soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            if (soundUri != null) {
              AudioAttributes audioAttr = new AudioAttributes.Builder()
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setUsage(AudioAttributes.USAGE_ALARM)
                .build();
              channel.setSound(soundUri, audioAttr);
            }
            nm.createNotificationChannel(channel);
          }

          for (int idx = 0; idx < habitsArray.length(); idx++) {
            JSONObject habit = habitsArray.getJSONObject(idx);
            boolean enabled = habit.optBoolean("enabled", true);
            if (!enabled) continue;

            String timeStr = habit.optString("time", "");
            if (timeStr.trim().isEmpty()) continue;

            String[] parts = timeStr.split(":");
            if (parts.length < 2) continue;
            int h = Integer.parseInt(parts[0].trim());
            int m = Integer.parseInt(parts[1].trim());
            int habitMinuteOfDay = h * 60 + m;

            // Match within 4 minutes window
            int diff = Math.abs(currentMinuteOfDay - habitMinuteOfDay);
            if (diff <= 4 || diff >= 1436) {
              String title = habit.optString("title", "Habit Reminder");
              int notifId = REQUEST + idx + 1;

              Intent launchIntent = c.getPackageManager().getLaunchIntentForPackage(c.getPackageName());
              PendingIntent contentIntent = null;
              if (launchIntent != null) {
                launchIntent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
                int flags = PendingIntent.FLAG_UPDATE_CURRENT;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                  flags |= PendingIntent.FLAG_IMMUTABLE;
                }
                contentIntent = PendingIntent.getActivity(c, notifId, launchIntent, flags);
              }

              NotificationCompat.Builder builder = new NotificationCompat.Builder(c, "reminders")
                .setSmallIcon(com.lifeagent.app.R.mipmap.ic_launcher)
                .setContentTitle("✅ " + title)
                .setContentText("Don't forget to complete your habit today!")
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setAutoCancel(true)
                .setDefaults(NotificationCompat.DEFAULT_ALL);

              if (contentIntent != null) {
                builder.setContentIntent(contentIntent);
              }

              nm.notify(notifId, builder.build());
            }
          }
        }
      }
      scheduleNext(c);
    } catch (Exception e) {
      e.printStackTrace();
    } finally {
      if (wakeLock != null && wakeLock.isHeld()) {
        wakeLock.release();
      }
    }
  }
}
