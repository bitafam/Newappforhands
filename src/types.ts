export type GestureType = 
  | 'FIST' 
  | 'PINCH' 
  | 'THREE_FINGERS'
  | 'OPEN_PALM' 
  | 'POINTING' 
  | 'V_SIGN' 
  | 'THUMBS_UP' 
  | 'NONE';

export type ActionType = 
  | 'SCREENSHOT' 
  | 'SCROLL_DOWN' 
  | 'SCROLL_UP' 
  | 'VOLUME_UP' 
  | 'VOLUME_DOWN' 
  | 'BACK' 
  | 'HOME' 
  | 'TOGGLE_TORCH' 
  | 'OPEN_INSTAGRAM'
  | 'NONE';

export interface LandmarkPoint {
  x: number;
  y: number;
  z: number;
}

export interface HandDetectionResult {
  landmarks: LandmarkPoint[];
  handedness: 'Left' | 'Right';
  score: number;
  gesture: GestureType;
  pinchDistance: number;
  fistTightness: number;
  rawPinchDistance: number;
}

export interface GestureMapping {
  gesture: GestureType;
  action: ActionType;
  enabled: boolean;
  labelFa: string;
  iconName: string;
}

export interface GestureConfig {
  pinchThreshold: number;     // Normalized scale threshold (e.g., 0.35)
  fistThreshold: number;      // Normalized scale threshold (e.g., 0.75)
  holdTimeMs: number;         // Time required to hold gesture before triggering (e.g., 200ms)
  cooldownMs: number;         // Pause after trigger to avoid repeat spam (e.g., 1000ms)
  vibrationEnabled: boolean;
  soundEnabled: boolean;
  mirrorCamera: boolean;
  showSkeleton: boolean;
  showHud: boolean;
  cameraFacingMode: 'user' | 'environment';
}

export interface AndroidPermissions {
  controlOtherApps: boolean;           // کنترل سایر برنامه‌ها (Control other apps)
  accessibilityService: boolean;     // سرویس دسترسی‌پذیری (Accessibility Permission - Required)
  backgroundAutoStart: boolean;      // شروع خودکار در پس‌زمینه (Background Auto Start - Recommended)
  ignoreBatteryOptimizations: boolean; // استثنا از بهینه‌سازی باتری (Exclude from Battery Optimization - Recommended)
  camera: boolean;                   // دسترسی به دوربین (Camera)
  systemAlertWindow: boolean;        // نمایش پنجره شناور (Overlay / Display Over Other Apps)
  foregroundService: boolean;        // سرویس پیش‌زمینه (Foreground Service)
}

export interface BackgroundServiceState {
  isRunning: boolean;
  activeApp: string; // e.g. "اینستاگرام (Instagram)", "تلگرام (Telegram)", "مرورگر کرم"
  floatingBubbleEnabled: boolean;
  floatingBubblePosition: { x: number; y: number };
  floatingBubbleSize: 'small' | 'medium' | 'large';
  notificationsEnabled: boolean;
  autoStartOnBoot: boolean;
}

export interface CapturedScreenshot {
  id: string;
  dataUrl: string;
  timestamp: string;
  triggeredBy: GestureType;
  appName?: string;
}

export interface GestureLogItem {
  id: string;
  gesture: GestureType;
  action: ActionType;
  timestamp: string;
  success: boolean;
}

declare global {
  interface Window {
    AndroidBridge?: {
      performAction: (actionType: string) => void;
      enterPip: () => void;
      minimizeApp: () => void;
    };
  }
}
