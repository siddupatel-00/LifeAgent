package com.lifeagent.app;

import android.content.Context;
import android.content.SharedPreferences;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONArray;
import org.json.JSONObject;

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
        String previousHabitsJson = prefs().getString("habitsJson", "[]");

        // Persist first so boot receiver can restore even if the process dies mid-schedule.
        SharedPreferences.Editor editor = prefs().edit();
        editor.putBoolean("enabled", enabled);
        editor.putString("habitsJson", habitsJson);
        editor.apply();

        Context ctx = getContext();

        // Schedule-first: register new OS alarms before removing stale ones so a
        // swipe-kill mid-configure never leaves zero habit alarms.
        if (enabled) {
            HabitAlarmReceiver.scheduleAllFromPrefs(ctx);
        } else {
            cancelAlarmsFromJson(ctx, previousHabitsJson);
        }

        cancelStaleAlarms(ctx, previousHabitsJson, habitsJson);

        call.resolve();
    }

    private void cancelStaleAlarms(Context ctx, String previousHabitsJson, String newHabitsJson) {
        java.util.HashSet<Integer> newIds = habitIdsFromJson(newHabitsJson);
        if (previousHabitsJson == null || previousHabitsJson.trim().isEmpty()) return;
        try {
            JSONArray habits = new JSONArray(previousHabitsJson);
            for (int i = 0; i < habits.length(); i++) {
                JSONObject habit = habits.optJSONObject(i);
                if (habit == null) continue;
                int id = habit.optInt("id", i);
                if (!newIds.contains(id)) {
                    HabitAlarmReceiver.cancelHabit(ctx, id);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void cancelAlarmsFromJson(Context ctx, String habitsJson) {
        if (habitsJson == null || habitsJson.trim().isEmpty()) return;
        try {
            JSONArray habits = new JSONArray(habitsJson);
            for (int i = 0; i < habits.length(); i++) {
                JSONObject habit = habits.optJSONObject(i);
                if (habit != null) {
                    HabitAlarmReceiver.cancelHabit(ctx, habit.optInt("id", i));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private java.util.HashSet<Integer> habitIdsFromJson(String habitsJson) {
        java.util.HashSet<Integer> ids = new java.util.HashSet<>();
        if (habitsJson == null || habitsJson.trim().isEmpty()) return ids;
        try {
            JSONArray habits = new JSONArray(habitsJson);
            for (int i = 0; i < habits.length(); i++) {
                JSONObject habit = habits.optJSONObject(i);
                if (habit != null) ids.add(habit.optInt("id", i));
            }
        } catch (Exception ignored) {}
        return ids;
    }
}
