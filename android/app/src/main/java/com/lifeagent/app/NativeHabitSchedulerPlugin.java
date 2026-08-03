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

        // Persist so boot receiver can re-schedule without JS bridge
        SharedPreferences.Editor editor = prefs().edit();
        editor.putBoolean("enabled", enabled);
        editor.putString("habitsJson", habitsJson);
        editor.apply();

        Context ctx = getContext();

        // First cancel ALL previously scheduled habit alarms so stale alarms
        // for deleted / modified habits don't keep firing.
        cancelAllHabitAlarms(ctx, habitsJson);

        if (enabled) {
            // Schedule one independent alarm per habit
            HabitAlarmReceiver.scheduleAllFromPrefs(ctx);
        }

        call.resolve();
    }

    /**
     * Cancel alarms for every habit ID present in the stored JSON so we get a
     * clean slate before re-scheduling. We iterate up to a wide range to catch
     * any IDs that may have been persisted from previous sessions.
     */
    private void cancelAllHabitAlarms(Context ctx, String habitsJson) {
        try {
            JSONArray habits = new JSONArray(habitsJson == null ? "[]" : habitsJson);
            for (int i = 0; i < habits.length(); i++) {
                JSONObject h = habits.getJSONObject(i);
                int id = h.optInt("id", i);
                HabitAlarmReceiver.cancelHabit(ctx, id);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
