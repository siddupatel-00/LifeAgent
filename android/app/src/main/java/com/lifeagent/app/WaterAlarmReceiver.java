package com.lifeagent.app;

import android.app.*;
import android.content.*;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import java.util.Calendar;

public class WaterAlarmReceiver extends BroadcastReceiver {
  static final int REQUEST = 710001;
  static PendingIntent intent(Context c) { return PendingIntent.getBroadcast(c, REQUEST, new Intent(c, WaterAlarmReceiver.class), PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE); }
  static void scheduleNext(Context c) {
    SharedPreferences p = c.getSharedPreferences("water_reminders", Context.MODE_PRIVATE); AlarmManager a = (AlarmManager)c.getSystemService(Context.ALARM_SERVICE); a.cancel(intent(c));
    if (!p.getBoolean("enabled", false) || p.getFloat("hydration", 0) >= p.getFloat("goal", 2.5f)) return;
    String[] s = p.getString("start", "08:00").split(":"); String[] e = p.getString("end", "22:00").split(":"); Calendar now = Calendar.getInstance(); Calendar next = (Calendar)now.clone(); next.set(Calendar.SECOND,0); next.set(Calendar.MILLISECOND,0);
    int start=Integer.parseInt(s[0])*60+Integer.parseInt(s[1]), end=Integer.parseInt(e[0])*60+Integer.parseInt(e[1]), current=now.get(Calendar.HOUR_OF_DAY)*60+now.get(Calendar.MINUTE);
    if (current < start) next.set(Calendar.HOUR_OF_DAY,Integer.parseInt(s[0])); else if (current >= end) { next.add(Calendar.DATE,1); next.set(Calendar.HOUR_OF_DAY,Integer.parseInt(s[0])); } else next.add(Calendar.MINUTE, p.getInt("interval",60));
    next.set(Calendar.MINUTE, current < start || current >= end ? Integer.parseInt(s[1]) : next.get(Calendar.MINUTE));
    if (Build.VERSION.SDK_INT >= 21) {
      try {
        a.setAlarmClock(new AlarmManager.AlarmClockInfo(next.getTimeInMillis(), intent(c)), intent(c));
      } catch (Exception ex) {
        if (Build.VERSION.SDK_INT >= 23) a.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, next.getTimeInMillis(), intent(c));
        else a.set(AlarmManager.RTC_WAKEUP, next.getTimeInMillis(), intent(c));
      }
    } else {
      a.set(AlarmManager.RTC_WAKEUP, next.getTimeInMillis(), intent(c));
    }
  }
  public void onReceive(Context c, Intent i) { SharedPreferences p=c.getSharedPreferences("water_reminders",Context.MODE_PRIVATE); if (p.getBoolean("enabled",false) && p.getFloat("hydration",0)<p.getFloat("goal",2.5f)) { NotificationManager nm=(NotificationManager)c.getSystemService(Context.NOTIFICATION_SERVICE); if(Build.VERSION.SDK_INT>=26) nm.createNotificationChannel(new NotificationChannel("reminders","Reminders",NotificationManager.IMPORTANCE_DEFAULT)); nm.notify(REQUEST,new NotificationCompat.Builder(c,"reminders").setSmallIcon(com.lifeagent.app.R.mipmap.ic_launcher).setContentTitle("Water reminder").setContentText("Time to drink some water.").setAutoCancel(true).build()); } scheduleNext(c); }
}
