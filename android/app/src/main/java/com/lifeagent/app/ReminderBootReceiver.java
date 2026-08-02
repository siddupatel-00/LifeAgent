package com.lifeagent.app;
import android.content.*;
public class ReminderBootReceiver extends BroadcastReceiver { 
    public void onReceive(Context context, Intent intent) { 
        WaterAlarmReceiver.scheduleNext(context); 
        HabitAlarmReceiver.scheduleNext(context); 
    } 
}
