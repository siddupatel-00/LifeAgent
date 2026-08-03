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
import java.util.Calendar;

public class WaterAlarmReceiver extends BroadcastReceiver {
    public static final int REQUEST = 710001;
    public static final String CHANNEL_ID = "reminders";

    public static PendingIntent intent(Context c) {
        return PendingIntent.getBroadcast(c, REQUEST, new Intent(c, WaterAlarmReceiver.class), PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    public static void scheduleNext(Context c) {
        SharedPreferences p = c.getSharedPreferences("water_reminders", Context.MODE_PRIVATE);
        AlarmManager a = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (a != null) a.cancel(intent(c));
        if (a == null || !p.getBoolean("enabled", false) || p.getFloat("hydration", 0) >= p.getFloat("goal", 2.5f)) return;

        String[] s = p.getString("start", "08:00").split(":");
        String[] e = p.getString("end", "22:00").split(":");
        Calendar now = Calendar.getInstance();
        Calendar next = (Calendar) now.clone();
        next.set(Calendar.SECOND, 0);
        next.set(Calendar.MILLISECOND, 0);

        int start = Integer.parseInt(s[0]) * 60 + Integer.parseInt(s[1]);
        int end = Integer.parseInt(e[0]) * 60 + Integer.parseInt(e[1]);
        int current = now.get(Calendar.HOUR_OF_DAY) * 60 + now.get(Calendar.MINUTE);

        if (current < start) {
            next.set(Calendar.HOUR_OF_DAY, Integer.parseInt(s[0]));
            next.set(Calendar.MINUTE, Integer.parseInt(s[1]));
        } else if (current >= end) {
            next.add(Calendar.DATE, 1);
            next.set(Calendar.HOUR_OF_DAY, Integer.parseInt(s[0]));
            next.set(Calendar.MINUTE, Integer.parseInt(s[1]));
        } else {
            next.add(Calendar.MINUTE, p.getInt("interval", 60));
        }

        if (Build.VERSION.SDK_INT >= 21) {
            try {
                a.setAlarmClock(new AlarmManager.AlarmClockInfo(next.getTimeInMillis(), intent(c)), intent(c));
            } catch (Exception ex) {
                if (Build.VERSION.SDK_INT >= 23) a.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, next.getTimeInMillis(), intent(c));
                else a.set(AlarmManager.RTC_WAKEUP, next.getTimeInMillis(), intent(c));
            }
        } else {
            a.set(AlarmManager.RTC_WAKEUP, next.getTimeInMillis(), intent(c));
        }
    }

    @Override
    public void onReceive(Context c, Intent i) {
        try {
            PowerManager pm = (PowerManager) c.getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                @SuppressWarnings("deprecation")
                PowerManager.WakeLock wl = pm.newWakeLock(
                    PowerManager.FULL_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP | PowerManager.ON_AFTER_RELEASE,
                    "lifeagent:water_alarm_wakelock"
                );
                wl.acquire(3000);
            }

            SharedPreferences p = c.getSharedPreferences("water_reminders", Context.MODE_PRIVATE);
            if (p.getBoolean("enabled", false) && p.getFloat("hydration", 0) < p.getFloat("goal", 2.5f)) {
                NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
                if (nm != null) {
                    if (Build.VERSION.SDK_INT >= 26) {
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

                    Intent launch = c.getPackageManager().getLaunchIntentForPackage(c.getPackageName());
                    PendingIntent tapIntent = null;
                    if (launch != null) {
                        launch.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
                        int piFlags = PendingIntent.FLAG_UPDATE_CURRENT;
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                            piFlags |= PendingIntent.FLAG_IMMUTABLE;
                        }
                        tapIntent = PendingIntent.getActivity(c, REQUEST + 50000, launch, piFlags);
                    }

                    Uri sound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);

                    NotificationCompat.Builder builder = new NotificationCompat.Builder(c, CHANNEL_ID)
                        .setSmallIcon(R.mipmap.ic_launcher)
                        .setContentTitle("💧 Water reminder")
                        .setContentText("Time to drink some water. Stay hydrated!")
                        .setStyle(new NotificationCompat.BigTextStyle().bigText("Time to drink some water. Stay hydrated!"))
                        .setPriority(NotificationCompat.PRIORITY_MAX)
                        .setCategory(NotificationCompat.CATEGORY_ALARM)
                        .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                        .setAutoCancel(true)
                        .setSound(sound)
                        .setVibrate(new long[]{0, 300, 200, 300});

                    if (tapIntent != null) {
                        builder.setContentIntent(tapIntent);
                    }

                    nm.notify(REQUEST, builder.build());
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        scheduleNext(c);
    }
}
