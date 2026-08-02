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

public class HabitAlarmReceiver extends BroadcastReceiver {
    private static final String PREFS_NAME = "habit_reminders";
    private static final String CHANNEL_ID = "habit_reminders_channel";
    private static final String CHANNEL_NAME = "Habit Reminders";
    private static final int BASE_REQUEST_CODE = 820000;

    public static PendingIntent getPendingIntent(Context context, int habitId) {
        Intent intent = new Intent(context, HabitAlarmReceiver.class);
        intent.putExtra("habit_id", habitId);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        return PendingIntent.getBroadcast(context, BASE_REQUEST_CODE + Math.abs(habitId % 10000), intent, flags);
    }

    public static void scheduleNext(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String jsonString = prefs.getString("habits_data", "[]");
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) return;

        try {
            JSONArray habitsArray = new JSONArray(jsonString);
            Calendar now = Calendar.getInstance();
            long nextFireTime = Long.MAX_VALUE;
            int nextHabitId = 0;

            for (int i = 0; i < habitsArray.length(); i++) {
                JSONObject habit = habitsArray.getJSONObject(i);
                boolean enabled = habit.optBoolean("enabled", true);
                if (!enabled) continue;

                String timeStr = habit.optString("time", "08:00");
                int habitId = habit.optInt("id", i + 1);

                String[] timeParts = timeStr.split(":");
                if (timeParts.length < 2) continue;
                int hour = Integer.parseInt(timeParts[0].trim());
                int minute = Integer.parseInt(timeParts[1].trim());

                Calendar fireCal = Calendar.getInstance();
                fireCal.set(Calendar.HOUR_OF_DAY, hour);
                fireCal.set(Calendar.MINUTE, minute);
                fireCal.set(Calendar.SECOND, 0);
                fireCal.set(Calendar.MILLISECOND, 0);

                if (fireCal.before(now) || fireCal.getTimeInMillis() <= now.getTimeInMillis() + 1000) {
                    fireCal.add(Calendar.DATE, 1);
                }

                long fireMillis = fireCal.getTimeInMillis();
                if (fireMillis < nextFireTime) {
                    nextFireTime = fireMillis;
                    nextHabitId = habitId;
                }
            }

            if (nextFireTime != Long.MAX_VALUE) {
                PendingIntent pi = getPendingIntent(context, nextHabitId);
                alarmManager.cancel(pi);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, nextFireTime, pi);
                } else {
                    alarmManager.set(AlarmManager.RTC_WAKEUP, nextFireTime, pi);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        if (context == null) return;

        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String jsonString = prefs.getString("habits_data", "[]");
        Calendar now = Calendar.getInstance();
        int currentHour = now.get(Calendar.HOUR_OF_DAY);
        int currentMinute = now.get(Calendar.MINUTE);

        try {
            JSONArray habitsArray = new JSONArray(jsonString);
            for (int i = 0; i < habitsArray.length(); i++) {
                JSONObject habit = habitsArray.getJSONObject(i);
                boolean enabled = habit.optBoolean("enabled", true);
                if (!enabled) continue;

                String timeStr = habit.optString("time", "08:00");
                String title = habit.optString("title", "Habit Reminder");
                int habitId = habit.optInt("id", i + 1);

                String[] timeParts = timeStr.split(":");
                if (timeParts.length < 2) continue;
                int hour = Integer.parseInt(timeParts[0].trim());
                int minute = Integer.parseInt(timeParts[1].trim());

                // Match within 3 minutes window
                int timeDiff = Math.abs((currentHour * 60 + currentMinute) - (hour * 60 + minute));
                if (timeDiff <= 3 || timeDiff >= 1437) {
                    showNotification(context, habitId, title);
                }
            }
        } catch (Exception e) {
            showNotification(context, 82001, "Habit Reminder");
        }

        // Immediately schedule the next upcoming habit alarm
        scheduleNext(context);
    }

    private void showNotification(Context context, int notificationId, String title) {
        NotificationManager notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (notificationManager == null) return;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("High-priority alerts for habit reminders");
            channel.enableLights(true);
            channel.setLightColor(Color.GREEN);
            channel.enableVibration(true);
            channel.setLockscreenVisibility(NotificationCompat.VISIBILITY_PUBLIC);

            Uri defaultSound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setUsage(AudioAttributes.USAGE_ALARM)
                .build();
            channel.setSound(defaultSound, audioAttributes);

            notificationManager.createNotificationChannel(channel);
        }

        Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        PendingIntent contentIntent = null;
        if (launchIntent != null) {
            launchIntent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }
            contentIntent = PendingIntent.getActivity(context, notificationId, launchIntent, flags);
        }

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle("✅ " + title)
            .setContentText("Time to complete your habit today!")
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setAutoCancel(true)
            .setDefaults(NotificationCompat.DEFAULT_ALL);

        if (contentIntent != null) {
            builder.setContentIntent(contentIntent);
        }

        notificationManager.notify(notificationId, builder.build());
    }
}
