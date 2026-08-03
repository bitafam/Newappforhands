/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { CameraFeed } from './components/CameraFeed';
import { GestureMappingConfig } from './components/GestureMappingConfig';
import { ScreenshotGallery } from './components/ScreenshotGallery';
import { AndroidPermissionsWizard } from './components/AndroidPermissionsWizard';
import { BackgroundServiceController } from './components/BackgroundServiceController';
import { CalibrationModal } from './components/CalibrationModal';
import { OnboardingPermissionsModal } from './components/OnboardingPermissionsModal';
import { AlertCircle, ShieldAlert, Camera, Sparkles } from 'lucide-react';
import {
  GestureConfig,
  GestureMapping,
  GestureType,
  HandDetectionResult,
  CapturedScreenshot,
  AndroidPermissions,
  BackgroundServiceState
} from './types';
import { soundFx } from './utils/audio';
import {
  loadSavedPermissions,
  savePermissions,
  verifyAndRequestStartupPermissions,
  isAndroidApk
} from './utils/androidPermissions';

export default function App() {
  const [activeTab, setActiveTab] = useState<'service' | 'permissions' | 'config' | 'camera' | 'gallery'>('service');
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isCalibrationOpen, setIsCalibrationOpen] = useState(false);

  // Android Permissions State initialized from storage or defaults to FALSE (OFF)
  const [permissions, setPermissions] = useState<AndroidPermissions>(() => loadSavedPermissions());
  
  // Modal state for initial step-by-step onboarding permission wizard
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(() => {
    const loaded = loadSavedPermissions();
    return !loaded.camera || !loaded.accessibilityService;
  });

  // Run startup permission check upon entry (especially in APK mode)
  useEffect(() => {
    let isMounted = true;
    verifyAndRequestStartupPermissions(permissions).then(({ updatedPermissions }) => {
      if (isMounted) {
        setPermissions(updatedPermissions);
        savePermissions(updatedPermissions);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Background Service & Overlay State
  const [serviceState, setServiceState] = useState<BackgroundServiceState>({
    isRunning: true,
    activeApp: 'Instagram (اینستاگرام)',
    floatingBubbleEnabled: true,
    floatingBubblePosition: { x: 20, y: 80 },
    floatingBubbleSize: 'medium',
    notificationsEnabled: true,
    autoStartOnBoot: true
  });

  // Configuration State
  const [config, setConfig] = useState<GestureConfig>({
    pinchThreshold: 0.35,
    fistThreshold: 0.75,
    holdTimeMs: 200,
    cooldownMs: 800,
    vibrationEnabled: true,
    soundEnabled: true,
    mirrorCamera: true,
    showSkeleton: true,
    showHud: true,
    cameraFacingMode: 'user'
  });

  // Default Mappings as requested by user
  const [mappings, setMappings] = useState<GestureMapping[]>([
    { gesture: 'FIST', action: 'SCREENSHOT', enabled: true, labelFa: '✊ مشت کردن (گرفتن اسکرین‌شات)', iconName: 'Camera' },
    { gesture: 'PINCH', action: 'SCROLL_DOWN', enabled: true, labelFa: '🤏 پینچ دو انگشت (اسکرول به پایین)', iconName: 'ArrowDown' },
    { gesture: 'OPEN_PALM', action: 'NONE', enabled: true, labelFa: '🖐️ کف دست باز (Open Palm)', iconName: 'Hand' },
    { gesture: 'POINTING', action: 'SCROLL_UP', enabled: true, labelFa: '👆 اشاره با یک انگشت (اسکرول بالا)', iconName: 'ArrowUp' },
    { gesture: 'V_SIGN', action: 'VOLUME_UP', enabled: true, labelFa: '✌️ علامت ۲ (افزایش صدا)', iconName: 'Volume2' },
    { gesture: 'THUMBS_UP', action: 'HOME', enabled: true, labelFa: '👍 شست بالا (بازگشت به خانه)', iconName: 'Home' }
  ]);

  // Gallery screenshots list
  const [screenshots, setScreenshots] = useState<CapturedScreenshot[]>([]);
  const [lastDetection, setLastDetection] = useState<HandDetectionResult | null>(null);

  // Active Trigger State
  const [activeGesture, setActiveGesture] = useState<GestureType>('NONE');
  const [lastActionTriggered, setLastActionTriggered] = useState<string | null>(null);

  // Timers to handle Hold Time and Cooldown
  const holdStartTimeRef = useRef<{ gesture: GestureType; time: number } | null>(null);
  const lastTriggerTimeRef = useRef<number>(0);

  // Add Screenshot helper
  const handleAddScreenshot = (newShot: CapturedScreenshot) => {
    setScreenshots((prev) => [newShot, ...prev]);
  };

  // Handle detection updates from CameraFeed
  const handleGestureDetected = useCallback((result: HandDetectionResult) => {
    setLastDetection(result);
    const now = performance.now();

    // Check if cooldown period is active
    if (now - lastTriggerTimeRef.current < config.cooldownMs) {
      return;
    }

    const currentGesture = result.gesture;

    if (currentGesture === 'NONE') {
      holdStartTimeRef.current = null;
      setActiveGesture('NONE');
      return;
    }

    // Check mapping
    const mapping = mappings.find((m) => m.gesture === currentGesture && m.enabled);
    if (!mapping || mapping.action === 'NONE') {
      setActiveGesture(currentGesture);
      return;
    }

    // Verify hold time threshold
    if (!holdStartTimeRef.current || holdStartTimeRef.current.gesture !== currentGesture) {
      holdStartTimeRef.current = { gesture: currentGesture, time: now };
    } else {
      const heldDuration = now - holdStartTimeRef.current.time;
      if (heldDuration >= config.holdTimeMs) {
        // Trigger action!
        setActiveGesture(currentGesture);
        lastTriggerTimeRef.current = now;
        holdStartTimeRef.current = null;

        if (mapping.action === 'SCREENSHOT') {
          const shot: CapturedScreenshot = {
            id: `shot_${Date.now()}`,
            dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="500" viewBox="0 0 300 500"><rect width="300" height="500" fill="%23f8fafc"/><text x="150" y="220" fill="%234f46e5" font-size="16" text-anchor="middle" font-family="sans-serif">اسکرین‌شات خودکار پس‌زمینه</text><text x="150" y="260" fill="%23059669" font-size="12" text-anchor="middle" font-family="sans-serif">برنامه فعال: اینستاگرام</text></svg>',
            timestamp: new Date().toLocaleTimeString('fa-IR'),
            triggeredBy: 'FIST',
            appName: serviceState.activeApp
          };
          handleAddScreenshot(shot);
          if (soundEnabled) soundFx.playShutterSound();
          if (config.vibrationEnabled) soundFx.vibrate([80, 40, 80]);
          setLastActionTriggered(`📸 اسکرین‌شات از ${serviceState.activeApp} ثبت شد (${new Date().toLocaleTimeString('fa-IR')})`);
        } else if (mapping.action === 'SCROLL_DOWN') {
          if (soundEnabled) soundFx.playScrollTick();
          if (config.vibrationEnabled) soundFx.vibrate(30);
          setLastActionTriggered(`👇 اسکرول خودکار به پایین در ${serviceState.activeApp} (${new Date().toLocaleTimeString('fa-IR')})`);
        } else {
          setLastActionTriggered(`⚡ اقدام ${mapping.action} اجرا شد (${new Date().toLocaleTimeString('fa-IR')})`);
        }
      }
    }
  }, [config.cooldownMs, config.holdTimeMs, config.vibrationEnabled, mappings, serviceState.activeApp, soundEnabled]);

  const handleDeleteScreenshot = (id: string) => {
    setScreenshots((prev) => prev.filter((s) => s.id !== id));
  };

  const handleClearAllScreenshots = () => {
    setScreenshots([]);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white dir-rtl">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCameraActive={isCameraActive}
        activeGesture={activeGesture}
        screenshotCount={screenshots.length}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        onOpenCalibration={() => setIsCalibrationOpen(true)}
        isBackgroundRunning={serviceState.isRunning}
      />

      {/* Main App Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Warning banner when permissions are missing */}
        {(!permissions.camera || !permissions.accessibilityService) && activeTab !== 'permissions' && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-100 text-rose-700">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-rose-900">
                  برخی دسترسی‌های ضروری APK خاموش هستند (عدم اعطا)
                </h4>
                <p className="text-[11px] text-rose-700">
                  {!permissions.camera && '• سنسور دوربین خاموش است. '}
                  {!permissions.accessibilityService && '• دسترسی دسترسی‌پذیری سیستم خاموش است.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsOnboardingOpen(true)}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                راهنمای گام‌به‌گام اعطا
              </button>

              <button
                onClick={() => setActiveTab('permissions')}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
              >
                مدیریت دسترسی‌ها ←
              </button>
            </div>
          </div>
        )}

        {/* Tab 1: Background Service Controller (Main Hub) */}
        {activeTab === 'service' && (
          <div className="space-y-6">
            <BackgroundServiceController
              permissions={permissions}
              serviceState={serviceState}
              setServiceState={setServiceState}
              activeGesture={activeGesture}
              lastActionTriggered={lastActionTriggered}
              onTakeScreenshot={handleAddScreenshot}
              vibrationEnabled={config.vibrationEnabled}
              soundEnabled={soundEnabled}
            />

            {/* Background Camera Tracker Frame */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="w-full md:w-64 h-36">
                <CameraFeed
                  config={config}
                  onGestureDetected={handleGestureDetected}
                  isCameraActive={isCameraActive}
                  setIsCameraActive={setIsCameraActive}
                  miniMode={true}
                />
              </div>

              <div className="flex-1 space-y-1">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  سنسور لایو پردازش مفاصل دست
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full font-mono font-bold">
                    MediaPipe Vision API
                  </span>
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  هنگامی که اینستاگرام را باز کنید، سنسور فوق مفاصل دست را رصد می‌کند. با بستن دست به شکل <strong>مشت (✊)</strong> عکس گرفته شده و با نزدیک کردن دو انگشت <strong>(🤏 پینچ)</strong> اسکرول انجام می‌شود.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Android Permissions & Battery Bypass Setup */}
        {activeTab === 'permissions' && (
          <AndroidPermissionsWizard
            permissions={permissions}
            setPermissions={setPermissions}
            onContinue={() => setActiveTab('service')}
          />
        )}

        {/* Tab 3: Gesture Mappings & Threshold Sliders */}
        {activeTab === 'config' && (
          <GestureMappingConfig
            config={config}
            setConfig={setConfig}
            mappings={mappings}
            setMappings={setMappings}
          />
        )}

        {/* Tab 4: Dedicated High-FPS Camera Viewfinder & Skeleton */}
        {activeTab === 'camera' && (
          <CameraFeed
            config={config}
            onGestureDetected={handleGestureDetected}
            isCameraActive={isCameraActive}
            setIsCameraActive={setIsCameraActive}
            miniMode={false}
          />
        )}

        {/* Tab 5: Captured Screenshots Gallery */}
        {activeTab === 'gallery' && (
          <ScreenshotGallery
            screenshots={screenshots}
            onDeleteScreenshot={handleDeleteScreenshot}
            onClearAll={handleClearAllScreenshots}
          />
        )}
      </main>

      {/* Interactive Onboarding Permissions Modal */}
      {isOnboardingOpen && (
        <OnboardingPermissionsModal
          permissions={permissions}
          setPermissions={setPermissions}
          onClose={() => setIsOnboardingOpen(false)}
        />
      )}

      {/* Interactive Calibration Modal */}
      <CalibrationModal
        isOpen={isCalibrationOpen}
        onClose={() => setIsCalibrationOpen(false)}
        lastDetection={lastDetection}
        config={config}
        setConfig={setConfig}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500">
        برنامه کنترل حرکتی دست اندروید (ویژه پس‌زمینه و اینستاگرام) • پیاده‌سازی شده با React 19، Tailwind CSS v4 و MediaPipe Vision API
      </footer>
    </div>
  );
}
