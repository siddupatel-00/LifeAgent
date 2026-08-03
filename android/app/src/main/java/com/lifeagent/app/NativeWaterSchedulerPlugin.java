package com.lifeagent.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NativeWaterScheduler")
public class NativeWaterSchedulerPlugin extends Plugin {
  private SharedPreferences prefs() { return getContext().getSharedPreferences("water_reminders", Context.MODE_PRIVATE); }
  @PluginMethod public void configure(PluginCall call) {
    SharedPreferences.Editor e = prefs().edit();
    e.putBoolean("enabled", call.getBoolean("enabled", false)); e.putString("start", call.getString("startTime", "08:00"));
    e.putString("end", call.getString("endTime", "22:00")); e.putInt("interval", call.getInt("intervalMinutes", 60));
    e.putFloat("goal", call.getFloat("goal", 2.5f)); e.putFloat("hydration", call.getFloat("hydration", 0f)); e.apply();
    WaterAlarmReceiver.scheduleNext(getContext()); call.resolve();
  }
  @PluginMethod public void updateProgress(PluginCall call) { prefs().edit().putFloat("hydration", call.getFloat("hydration", 0f)).putFloat("goal", call.getFloat("goal", 2.5f)).apply(); WaterAlarmReceiver.scheduleNext(getContext()); call.resolve(); }
}
