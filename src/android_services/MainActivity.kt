package com.remix.gesture.controller

import android.content.Intent
import android.os.Build
import android.os.Bundle
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate()
        startGestureForegroundService()
    }

    override fun onUserLeaveHint() {
        super.onUserLeaveHint()
        // Automatically launch Picture-in-Picture mode when leaving to Instagram or Home
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                enterPictureInPictureMode()
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    private fun startGestureForegroundService() {
        try {
            val serviceIntent = Intent(this, GestureForegroundService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(serviceIntent)
            } else {
                startService(serviceIntent)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
