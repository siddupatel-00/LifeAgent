package com.lifeagent.app;

import android.content.Context;
import android.content.SharedPreferences;
import com.getcapacitor.JSArray;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NativeHabitScheduler")
public class NativeHabitSchedulerPlugin extends Plugin {
    private SharedPreferences prefs() {
        return getContext().getSharedPreferences("habit_reminders", Context.MODE_PRIVATE);
    }

    @PluginMethod
    public void configure(PluginCall call) {
        JSArray habitsArray = call.getArray("habits");
        String jsonString = habitsArray != null ? habitsArray.toString() : "[]";

        SharedPreferences.Editor editor = prefs().edit();
        editor.putString("habits_data", jsonString);
        editor.apply();

        HabitAlarmReceiver.scheduleNext(getContext());
        call.resolve();
    }
}
