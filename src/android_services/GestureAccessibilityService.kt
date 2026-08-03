package com.remix.gesture.controller

import android.accessibilityservice.AccessibilityService
import android.view.accessibility.AccessibilityEvent

class GestureAccessibilityService : AccessibilityService() {

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // Accessibility event receiver for background gesture actions
    }

    override fun onInterrupt() {
        // Handle service interruption
    }
}
