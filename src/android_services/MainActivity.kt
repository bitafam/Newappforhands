package com.remix.gesture.controller

import android.app.PictureInPictureParams
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.util.Rational
import android.webkit.WebSettings
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        startGestureForegroundService()

        // Request Notification permission on Android 13+ (API 33+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                requestPermissions(arrayOf(android.Manifest.permission.POST_NOTIFICATIONS), 101)
            }
        }

        // Configure WebView settings to allow background camera and video playback
        bridge?.webView?.settings?.apply {
            mediaPlaybackRequiresUserGesture = false
            domStorageEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            javaScriptCanOpenWindowsAutomatically = true
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        }

        // Add Javascript Interface bridge to dispatch events to GestureAccessibilityService
        bridge?.webView?.addJavascriptInterface(object {
            @android.webkit.JavascriptInterface
            fun performAction(actionType: String) {
                try {
                    val intent = Intent("com.remix.gesture.PERFORM_ACTION").apply {
                        putExtra("ACTION_TYPE", actionType)
                    }
                    sendBroadcast(intent)
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }

            @android.webkit.JavascriptInterface
            fun enterPip() {
                runOnUiThread {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        try {
                            if (!isInPictureInPictureMode) {
                                val aspectRatio = Rational(9, 16)
                                val builder = PictureInPictureParams.Builder()
                                    .setAspectRatio(aspectRatio)
                                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                                    builder.setAutoEnterEnabled(true)
                                }
                                enterPictureInPictureMode(builder.build())
                            }
                        } catch (e: Exception) {
                            e.printStackTrace()
                        }
                    }
                }
            }

            @android.webkit.JavascriptInterface
            fun minimizeApp() {
                runOnUiThread {
                    moveTaskToBack(true)
                }
            }
        }, "AndroidBridge")

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            try {
                val aspectRatio = Rational(9, 16)
                val builder = PictureInPictureParams.Builder()
                    .setAspectRatio(aspectRatio)
                    .setAutoEnterEnabled(true)
                setPictureInPictureParams(builder.build())
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    override fun onPictureInPictureModeChanged(isInPictureInPictureMode: Boolean, newConfig: android.content.res.Configuration?) {
        super.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig)
        if (isInPictureInPictureMode) {
            // Keep WebView active during Picture-in-Picture mode
            bridge?.webView?.onResume()
            bridge?.webView?.resumeTimers()
        }

        // Notify React code
        bridge?.webView?.post {
            bridge?.webView?.evaluateJavascript("if (window.onPipModeChanged) { window.onPipModeChanged($isInPictureInPictureMode); }", null)
        }
    }

    override fun onUserLeaveHint() {
        super.onUserLeaveHint()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                if (!isInPictureInPictureMode) {
                    val aspectRatio = Rational(9, 16)
                    val builder = PictureInPictureParams.Builder()
                        .setAspectRatio(aspectRatio)
                    enterPictureInPictureMode(builder.build())
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    override fun onBackPressed() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                if (!isInPictureInPictureMode) {
                    val aspectRatio = Rational(9, 16)
                    val builder = PictureInPictureParams.Builder()
                        .setAspectRatio(aspectRatio)
                    enterPictureInPictureMode(builder.build())
                    return
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
        moveTaskToBack(true)
    }

    override fun onPause() {
        super.onPause()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N && isInPictureInPictureMode) {
            // Force WebView to stay active and resume timers even when Activity is paused in PiP mode
            bridge?.webView?.onResume()
            bridge?.webView?.resumeTimers()
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
