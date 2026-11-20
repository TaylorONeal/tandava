package com.tandava.studio;

import android.os.Bundle;

import androidx.activity.EdgeToEdge;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Android 15+ draws edge-to-edge for targetSdk 35+. Opting in here gives the
        // same layout on older versions; Capacitor's SystemBars handles the insets.
        EdgeToEdge.enable(this);
        super.onCreate(savedInstanceState);
    }
}
