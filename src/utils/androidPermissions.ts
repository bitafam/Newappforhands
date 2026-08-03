import { AndroidPermissions } from '../types';

const STORAGE_KEY = 'android_gesture_app_permissions_v2';

/**
 * Default permissions state on clean startup:
 * ALL permissions are set to FALSE until verified or explicitly granted by the user.
 */
export const DEFAULT_PERMISSIONS: AndroidPermissions = {
  controlOtherApps: false,
  accessibilityService: false,
  backgroundAutoStart: false,
  ignoreBatteryOptimizations: false,
  camera: false,
  systemAlertWindow: false,
  foregroundService: false,
};

/**
 * Checks if the app is running inside an APK / Capacitor / Android WebView container
 */
export function isAndroidApk(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check for Capacitor object injected in native Android shell
  const isCapacitor = Boolean(
    (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.() ||
    (window as unknown as { Capacitor?: { platform?: string } }).Capacitor?.platform === 'android'
  );

  // Check user agent for Android WebView / APK indicators
  const ua = navigator.userAgent.toLowerCase();
  const isWebView = /(wv|capacitor|cordova|ionic)/.test(ua) || (ua.includes('android') && ua.includes('version/'));

  return isCapacitor || isWebView;
}

/**
 * Load persisted permissions from localStorage or return ungranted default
 */
export function loadSavedPermissions(): AndroidPermissions {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_PERMISSIONS,
        ...parsed,
      };
    }
  } catch (e) {
    console.warn('Failed to load saved permissions:', e);
  }
  return { ...DEFAULT_PERMISSIONS };
}

/**
 * Save permissions state to localStorage
 */
export function savePermissions(permissions: AndroidPermissions): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(permissions));
  } catch (e) {
    console.warn('Failed to save permissions:', e);
  }
}

/**
 * Test real camera hardware permission using mediaDevices / navigator.permissions
 */
export async function checkRealCameraPermission(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
    return false;
  }

  // First try navigator.permissions if available
  if (navigator.permissions && navigator.permissions.query) {
    try {
      const status = await navigator.permissions.query({ name: 'camera' as PermissionName });
      if (status.state === 'granted') return true;
      if (status.state === 'denied') return false;
    } catch {
      // Permission query for 'camera' might fail on some browsers/webviews, fall back to getUserMedia check
    }
  }

  return false;
}

/**
 * Request real camera access via WebRTC API (triggers native APK / Browser camera permission popup)
 */
export async function requestRealCameraPermission(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return false;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    // Immediately stop tracks after testing
    stream.getTracks().forEach((track) => track.stop());
    return true;
  } catch (err) {
    console.warn('Camera permission request denied or failed:', err);
    return false;
  }
}

/**
 * Open Android System Settings pages using Android Intent URLs or web fallback
 */
export function openAndroidSystemSettings(permissionKey: keyof AndroidPermissions): void {
  if (typeof window === 'undefined') return;

  const intentMap: Record<keyof AndroidPermissions, string> = {
    accessibilityService: 'intent:#Intent;action=android.settings.ACCESSIBILITY_SETTINGS;end',
    systemAlertWindow: 'intent:#Intent;action=android.settings.ACTION_MANAGE_OVERLAY_PERMISSION;end',
    ignoreBatteryOptimizations: 'intent:#Intent;action=android.settings.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS;end',
    controlOtherApps: 'intent:#Intent;action=android.settings.APPLICATION_DETAILS_SETTINGS;end',
    backgroundAutoStart: 'intent:#Intent;action=android.settings.APPLICATION_DETAILS_SETTINGS;end',
    foregroundService: 'intent:#Intent;action=android.settings.APPLICATION_DETAILS_SETTINGS;end',
    camera: 'intent:#Intent;action=android.settings.APPLICATION_DETAILS_SETTINGS;end',
  };

  const targetIntent = intentMap[permissionKey];

  try {
    if (isAndroidApk()) {
      // Attempt to launch intent URL directly in APK container
      window.location.href = targetIntent;
    } else {
      // Browser fallback warning
      console.info(`Opening settings helper for ${permissionKey}`);
    }
  } catch (err) {
    console.warn('Failed to launch native settings intent:', err);
  }
}

/**
 * Startup helper to query & request real permissions on initial app load
 */
export async function verifyAndRequestStartupPermissions(
  currentPerms: AndroidPermissions
): Promise<{ updatedPermissions: AndroidPermissions; isCameraGranted: boolean }> {
  // Check real camera status or prompt
  const cameraGranted = await requestRealCameraPermission();

  const updated: AndroidPermissions = {
    ...currentPerms,
    camera: cameraGranted,
  };

  savePermissions(updated);

  return {
    updatedPermissions: updated,
    isCameraGranted: cameraGranted,
  };
}
