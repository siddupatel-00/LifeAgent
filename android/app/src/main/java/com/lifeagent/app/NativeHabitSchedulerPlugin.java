package com.lifeagent.app;

import android.content.Context;
import android.content.SharedPreferences;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Capacitor plugin that JS calls to configure habit reminders.
 * Stores the habits JSON in SharedPreferences, then schedules
 * an individual independent alarm for each habit.
 */
@CapacitorPlugin(name = "NativeHabitScheduler")
public class NativeHabitSchedulerPlugin extends Plugin {

    private SharedPreferences prefs() {
        return getContext().getSharedPreferences("habit_reminders", Context.MODE_PRIVATE);
    }

    @PluginMethod
    public void configure(PluginCall call) {
        boolean enabled   = call.getBoolean("enabled", true);
        String habitsJson = call.getString("habitsJson", "[]");

        // Persist so boot receiver can re-schedule without JS bridge
        SharedPreferences.Editor editor = prefs().edit();
        editor.putBoolean("enabled", enabled);
        editor.putString("habitsJson", habitsJson);
        editor.apply();

        Context ctx = getContext();

        // First cancel ALL previously scheduled habit alarms across full range (IDs 0..10000)
        // so stale alarms for deleted / modified habits don't keep firing.
        cancelAllHabitAlarms(ctx);

        if (enabled) {
            // Schedule one independent alarm per habit
            HabitAlarmReceiver.scheduleAllFromPrefs(ctx);
        }

        call.resolve();
    }

    /**
     * Cancel alarms for all potential habit IDs across the full HABIT_BASE range (0..10000,
     * request codes 820000..830000) so we get a clean slate before re-scheduling.
     */
    private void cancelAllHabitAlarms(Context ctx) {
        try {
            for (int i = 0; i <= 10000; i++) {
                HabitAlarmReceiver.cancelHabit(ctx, i);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}

