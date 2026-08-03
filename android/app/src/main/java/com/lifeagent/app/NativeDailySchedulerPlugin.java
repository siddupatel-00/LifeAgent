package com.lifeagent.app;

import android.content.Context;
import android.content.SharedPreferences;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONObject;

@CapacitorPlugin(name = "NativeDailyScheduler")
public class NativeDailySchedulerPlugin extends Plugin {
    private SharedPreferences prefs() {
        return getContext().getSharedPreferences(DailyReminderReceiver.PREFS, Context.MODE_PRIVATE);
    }

    @PluginMethod
    public void configure(PluginCall call) {
        String incomingJson = call.getString("configJson", "{}");
        try {
            String existingJson = prefs().getString("config", "{}");
            JSONObject existingObj = new JSONObject(existingJson);
            JSONObject incomingObj = new JSONObject(incomingJson);

            // Deep merge incoming keys so sleep, workout, and summary never overwrite each other
            if (incomingObj.has("sleep")) {
                existingObj.put("sleep", incomingObj.getJSONObject("sleep"));
            }
            if (incomingObj.has("workout")) {
                existingObj.put("workout", incomingObj.getJSONObject("workout"));
            }
            if (incomingObj.has("summary")) {
                existingObj.put("summary", incomingObj.getJSONObject("summary"));
            }

            prefs().edit().putString("config", existingObj.toString()).apply();
        } catch (Exception e) {
            prefs().edit().putString("config", incomingJson).apply();
        }

        DailyReminderReceiver.scheduleAllFromPrefs(getContext());
        call.resolve();
    }
}
