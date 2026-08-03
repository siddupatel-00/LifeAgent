package com.lifeagent.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/**
 * Receives BOOT_COMPLETED / LOCKED_BOOT_COMPLETED / MY_PACKAGE_REPLACED.
 * Re-schedules all alarms from SharedPreferences because AlarmManager alarms
 * are wiped when the device reboots.
 *
 * IMPORTANT: android:exported="true" is required in the manifest so the
 * Android system can actually deliver these broadcasts.
 */
public class ReminderBootReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null) return;

        // Re-schedule water reminders (reads SharedPreferences, no JS bridge needed)
        WaterAlarmReceiver.scheduleNext(context);

        // Re-schedule one independent alarm per habit from stored JSON
        HabitAlarmReceiver.scheduleAllFromPrefs(context);

        // Re-schedule sleep / workout / summary daily reminders
        DailyReminderReceiver.scheduleAllFromPrefs(context);

        // Re-schedule calendar event reminders
        EventAlarmReceiver.scheduleAllFromPrefs(context);
    }
}
