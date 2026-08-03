package com.lifeagent.app;

import android.content.Context;
import android.content.SharedPreferences;
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
    boolean enabled = call.getBoolean("enabled", true);
    String habitsJson = call.getString("habitsJson", "[]");

    SharedPreferences.Editor editor = prefs().edit();
    editor.putBoolean("enabled", enabled);
    editor.putString("habitsJson", habitsJson);
    editor.apply();

    HabitAlarmReceiver.scheduleNext(getContext());
    call.resolve();
  }
}
