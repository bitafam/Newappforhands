package com.remix.gesture.controller

import android.accessibilityservice.AccessibilityService
import android.view.accessibility.AccessibilityEvent

class GestureAccessibilityService : AccessibilityService() {

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // Accessibility events monitoring for gesture execution
    }

    override fun onInterrupt() {
        // Handle accessibility service interruption
    }
}
