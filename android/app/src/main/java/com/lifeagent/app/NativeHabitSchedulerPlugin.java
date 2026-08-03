package com.lifeagent.app;

import android.content.Context;
import android.content.SharedPreferences;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONArray;
import org.json.JSONObject;

@CapacitorPlugin(name = "NativeHabitScheduler")
public class NativeHabitSchedulerPlugin extends Plugin {

    private SharedPreferences prefs() {
        return getContext().getSharedPreferences(HabitAlarmReceiver.PREFS, Context.MODE_PRIVATE);
    }

    @PluginMethod
    public void configure(PluginCall call) {
        boolean enabled = call.getBoolean("enabled", false);
        String habitsJson = call.getString("habitsJson", "[]");
        String previousJson = prefs().getString("habitsJson", "[]");

        prefs().edit()
            .putBoolean("enabled", enabled)
            .putString("habitsJson", habitsJson)
            .apply();

        Context ctx = getContext();
        if (enabled) {
            HabitAlarmReceiver.scheduleAllFromPrefs(ctx);
        }
        cancelStaleSlots(ctx, previousJson, habitsJson);

        call.resolve();
    }

    private void cancelStaleSlots(Context ctx, String oldJson, String newJson) {
        java.util.HashSet<Integer> keep = new java.util.HashSet<>();
        try {
            JSONArray arr = new JSONArray(newJson);
            for (int i = 0; i < arr.length(); i++) {
                JSONObject h = arr.optJSONObject(i);
                if (h != null) keep.add(h.optInt("slot", i + 1));
            }
        } catch (Exception ignored) {}

        try {
            JSONArray arr = new JSONArray(oldJson);
            for (int i = 0; i < arr.length(); i++) {
                JSONObject h = arr.optJSONObject(i);
                if (h == null) continue;
                int slot = h.optInt("slot", i + 1);
                if (!keep.contains(slot)) HabitAlarmReceiver.cancelSlot(ctx, slot);
            }
        } catch (Exception ignored) {}
    }
}
