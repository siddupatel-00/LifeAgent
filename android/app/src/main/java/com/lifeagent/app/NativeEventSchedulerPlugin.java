package com.lifeagent.app;

import android.content.Context;
import android.content.SharedPreferences;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NativeEventScheduler")
public class NativeEventSchedulerPlugin extends Plugin {
    private SharedPreferences prefs() {
        return getContext().getSharedPreferences(EventAlarmReceiver.PREFS, Context.MODE_PRIVATE);
    }

    @PluginMethod
    public void configure(PluginCall call) {
        boolean enabled = call.getBoolean("enabled", true);
        String eventsJson = call.getString("eventsJson", "[]");

        prefs().edit()
            .putBoolean("enabled", enabled)
            .putString("eventsJson", eventsJson)
            .apply();

        if (enabled) {
            EventAlarmReceiver.scheduleAllFromPrefs(getContext());
        }

        call.resolve();
    }
}
