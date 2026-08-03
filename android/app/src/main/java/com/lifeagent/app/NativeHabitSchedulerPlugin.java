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

        // Cancel the IDs from the previous configuration before replacing it.
        // The old implementation iterated through 10,001 possible IDs on every
        // save. That work ran on the plugin call and could make habit alarms slow
        // or unreliable, especially when several habits were edited together.
        cancelPreviouslyConfiguredAlarms(getContext(), prefs().getString("habitsJson", "[]"));

        // Persist so boot receiver can re-schedule without JS bridge
        SharedPreferences.Editor editor = prefs().edit();
        editor.putBoolean("enabled", enabled);
        editor.putString("habitsJson", habitsJson);
        editor.apply();

        Context ctx = getContext();

        if (enabled) {
            // Schedule one independent alarm per habit
            HabitAlarmReceiver.scheduleAllFromPrefs(ctx);
        }

        call.resolve();
    }

    /** Cancel just the alarms represented by the last saved configuration. */
    private void cancelPreviouslyConfiguredAlarms(Context ctx, String previousHabitsJson) {
        if (previousHabitsJson == null || previousHabitsJson.trim().isEmpty()) return;
        try {
            JSONArray habits = new JSONArray(previousHabitsJson);
            for (int i = 0; i < habits.length(); i++) {
                JSONObject habit = habits.optJSONObject(i);
                if (habit != null) {
                    HabitAlarmReceiver.cancelHabit(ctx, habit.optInt("id", i + 1));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
