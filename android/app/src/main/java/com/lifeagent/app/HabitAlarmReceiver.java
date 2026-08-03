package com.lifeagent.app;

import android.app.*;
import android.content.*;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.Calendar;

/** Per-habit rolling alarms — same minimal pattern as WaterAlarmReceiver. */
public class HabitAlarmReceiver extends BroadcastReceiver {
    static final String PREFS = "habit_reminders";
    static final String CHANNEL = "reminders";
    static final int BASE = 710100;

    static PendingIntent pi(Context c, int slot) {
        Intent i = new Intent(c, HabitAlarmReceiver.class);
        i.putExtra("slot", slot);
        return PendingIntent.getBroadcast(c, BASE + slot, i,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    static void scheduleSlot(Context c, int slot, String timeStr, String title) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am == null || timeStr == null || timeStr.trim().isEmpty()) return;
        PendingIntent pending = pi(c, slot);
        am.cancel(pending);

        int hour = 0, minute = 0;
        try {
            String clean = timeStr.trim().toUpperCase();
            boolean isPM = clean.contains("PM");
            boolean isAM = clean.contains("AM");
            String[] parts = clean.replaceAll("[^0-9:]", "").split(":");
            if (parts.length < 2) return;
            hour = Integer.parseInt(parts[0].trim());
            minute = Integer.parseInt(parts[1].trim());
            if (isPM && hour < 12) hour += 12;
            if (isAM && hour == 12) hour = 0;
        } catch (Exception e) { return; }

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
    }

    static void cancelSlot(Context c, int slot) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        PendingIntent pending = pi(c, slot);
        am.cancel(pending);
        pending.cancel();
    }

    public static void scheduleAllFromPrefs(Context c) {
        SharedPreferences p = c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        if (!p.getBoolean("enabled", false)) return;
        String json = p.getString("habitsJson", "[]");
        if (json == null || json.equals("[]")) return;
        try {
            JSONArray habits = new JSONArray(json);
            for (int i = 0; i < habits.length(); i++) {
                JSONObject h = habits.getJSONObject(i);
                if (!h.optBoolean("enabled", true)) continue;
                int slot = h.optInt("slot", i + 1);
                String time = h.optString("time", "");
                String title = h.optString("title", "Habit Reminder");
                if (!time.trim().isEmpty()) scheduleSlot(c, slot, time, title);
            }
        } catch (Exception e) { e.printStackTrace(); }
    }

    static JSONObject findBySlot(Context c, int slot) {
        try {
            JSONArray habits = new JSONArray(c.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString("habitsJson", "[]"));
            for (int i = 0; i < habits.length(); i++) {
                JSONObject h = habits.getJSONObject(i);
                if (h.optInt("slot", i + 1) == slot) return h;
            }
        } catch (Exception ignored) {}
        return null;
    }

    @Override
    public void onReceive(Context c, Intent intent) {
        SharedPreferences p = c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        if (!p.getBoolean("enabled", false)) return;

        int slot = intent != null ? intent.getIntExtra("slot", -1) : -1;
        JSONObject h = slot > 0 ? findBySlot(c, slot) : null;
        if (h == null) return;

        String title = h.optString("title", "Habit Reminder");
        String time = h.optString("time", "");

        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;
        if (Build.VERSION.SDK_INT >= 26) {
            nm.createNotificationChannel(new NotificationChannel(CHANNEL, "Reminders", NotificationManager.IMPORTANCE_DEFAULT));
        }
        nm.notify(BASE + slot, new NotificationCompat.Builder(c, CHANNEL)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title)
            .setContentText("Don't forget to complete your habit today!")
            .setAutoCancel(true)
            .build());

        scheduleSlot(c, slot, time, title);
    }
}
