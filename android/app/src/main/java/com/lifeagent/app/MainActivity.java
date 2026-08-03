package com.lifeagent.app;

import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Capacitor builds its plugin bridge inside super.onCreate(). Custom
        // plugins therefore must be registered first; otherwise calls made
        // while the app is alive can fall back to web notifications, but the
        // native habit-alarm path is not reliably configured for background use.
        registerPlugin(NativeWaterSchedulerPlugin.class);
        registerPlugin(NativeHabitSchedulerPlugin.class);
        registerPlugin(NativeAlarmSchedulerPlugin.class);

        super.onCreate(savedInstanceState);
        
        Window window = getWindow();
        window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        window.getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE | 
            View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | 
            View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
        );
    }
}
