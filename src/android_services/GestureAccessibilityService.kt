package com.remix.gesture.controller

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.graphics.Path
import android.hardware.camera2.CameraManager
import android.media.AudioManager
import android.os.Build
import android.view.accessibility.AccessibilityEvent

class GestureAccessibilityService : AccessibilityService() {

    private var torchState = false

    private val actionReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            val actionType = intent?.getStringExtra("ACTION_TYPE") ?: return
            when (actionType) {
                "SCREENSHOT" -> takeSystemScreenshot()
                "SCROLL_DOWN" -> performScrollGesture(isDown = true)
                "SCROLL_UP" -> performScrollGesture(isDown = false)
                "BACK" -> performGlobalAction(GLOBAL_ACTION_BACK)
                "HOME" -> performGlobalAction(GLOBAL_ACTION_HOME)
                "OPEN_INSTAGRAM" -> launchInstagram(context)
                "TOGGLE_TORCH" -> toggleTorch(context)
                "VOLUME_UP" -> adjustVolume(context, isUp = true)
                "VOLUME_DOWN" -> adjustVolume(context, isUp = false)
            }
        }
    }

    override fun onCreate() {
        super.onCreate()
        val filter = IntentFilter("com.remix.gesture.PERFORM_ACTION")
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(actionReceiver, filter, RECEIVER_EXPORTED)
        } else {
            registerReceiver(actionReceiver, filter)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        try {
            unregisterReceiver(actionReceiver)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {}

    override fun onInterrupt() {}

    private fun takeSystemScreenshot() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            performGlobalAction(GLOBAL_ACTION_TAKE_SCREENSHOT)
        } else {
            performGlobalAction(GLOBAL_ACTION_QUICK_SETTINGS)
        }
    }

    private fun performScrollGesture(isDown: Boolean) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) return

        val displayMetrics = resources.displayMetrics
        val startX = displayMetrics.widthPixels / 2f
        val startY = if (isDown) displayMetrics.heightPixels * 0.75f else displayMetrics.heightPixels * 0.25f
        val endY = if (isDown) displayMetrics.heightPixels * 0.25f else displayMetrics.heightPixels * 0.75f

        val path = Path().apply {
            moveTo(startX, startY)
            lineTo(startX, endY)
        }

        val stroke = GestureDescription.StrokeDescription(path, 0, 300)
        val gesture = GestureDescription.Builder().addStroke(stroke).build()
        dispatchGesture(gesture, null, null)
    }

    private fun launchInstagram(context: Context?) {
        val pm = context?.packageManager ?: return
        val launchIntent = pm.getLaunchIntentForPackage("com.instagram.android")
        if (launchIntent != null) {
            launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(launchIntent)
        }
    }

    private fun toggleTorch(context: Context?) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            try {
                val cameraManager = context?.getSystemService(Context.CAMERA_SERVICE) as? CameraManager
                val cameraId = cameraManager?.cameraIdList?.firstOrNull() ?: return
                torchState = !torchState
                cameraManager.setTorchMode(cameraId, torchState)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    private fun adjustVolume(context: Context?, isUp: Boolean) {
        try {
            val audioManager = context?.getSystemService(Context.AUDIO_SERVICE) as? AudioManager
            audioManager?.adjustSuggestedStreamVolume(
                if (isUp) AudioManager.ADJUST_RAISE else AudioManager.ADJUST_LOWER,
                AudioManager.USE_DEFAULT_STREAM_TYPE,
                AudioManager.FLAG_SHOW_UI
            )
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
