import React, { useState } from 'react';
import { Play, Pause, Smartphone, CheckCircle2, ArrowDown, Camera, Bell, Activity, Radio } from 'lucide-react';
import { AndroidPermissions, BackgroundServiceState, CapturedScreenshot, GestureType } from '../types';
import { soundFx } from '../utils/audio';

interface BackgroundServiceControllerProps {
  permissions: AndroidPermissions;
  serviceState: BackgroundServiceState;
  setServiceState: React.Dispatch<React.SetStateAction<BackgroundServiceState>>;
  activeGesture: GestureType;
  lastActionTriggered: string | null;
  onTakeScreenshot: (screenshot: CapturedScreenshot) => void;
  vibrationEnabled: boolean;
  soundEnabled: boolean;
}

export const BackgroundServiceController: React.FC<BackgroundServiceControllerProps> = ({
  permissions,
  serviceState,
  setServiceState,
  activeGesture,
  lastActionTriggered,
  onTakeScreenshot,
  vibrationEnabled,
  soundEnabled
}) => {
  const [selectedApp, setSelectedApp] = useState<string>('Instagram (اینستاگرام)');
  const [simulatedScrollPos, setSimulatedScrollPos] = useState(0);
  const [overlayFeedback, setOverlayFeedback] = useState<string | null>(null);

  const toggleService = () => {
    setServiceState((prev) => {
      const nextState = !prev.isRunning;
      if (nextState) {
        if (soundEnabled) soundFx.playSuccessChime();
        if (vibrationEnabled) soundFx.vibrate([40, 40, 80]);
      }
      return { ...prev, isRunning: nextState };
    });
  };

  const appOptions = [
    { name: 'Instagram (اینستاگرام)', icon: '📸', color: 'from-purple-600 to-pink-600' },
    { name: 'Telegram (تلگرام)', icon: '✈️', color: 'from-sky-500 to-blue-600' },
    { name: 'YouTube (یوتیوب)', icon: '▶️', color: 'from-red-600 to-rose-700' },
    { name: 'Chrome (مرورگر وب)', icon: '🌐', color: 'from-amber-500 to-emerald-600' },
    { name: 'صفحه اصلی اندروید (Home Screen)', icon: '📱', color: 'from-indigo-600 to-purple-600' }
  ];

  const triggerManualScroll = () => {
    setSimulatedScrollPos((prev) => prev + 120);
    showOverlayToast('👇 اسکرول خودکار در ' + selectedApp);
    if (soundEnabled) soundFx.playScrollTick();
    if (vibrationEnabled) soundFx.vibrate(30);
  };

  const triggerManualScreenshot = () => {
    const shot: CapturedScreenshot = {
      id: `bg_shot_${Date.now()}`,
      dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="500" viewBox="0 0 300 500"><rect width="300" height="500" fill="%23f8fafc"/><text x="150" y="220" fill="%234f46e5" font-size="16" text-anchor="middle" font-family="sans-serif">اسکرین‌شات از ' + encodeURIComponent(selectedApp) + '</text><text x="150" y="260" fill="%23059669" font-size="12" text-anchor="middle" font-family="sans-serif">ثبت شده با حرکت مشت دست (Fist)</text></svg>',
      timestamp: new Date().toLocaleTimeString('fa-IR'),
      triggeredBy: 'FIST',
      appName: selectedApp
    };
    onTakeScreenshot(shot);
    showOverlayToast('📸 اسکرین‌شات از ' + selectedApp + ' ثبت شد!');
    if (soundEnabled) soundFx.playShutterSound();
    if (vibrationEnabled) soundFx.vibrate([80, 50, 100]);
  };

  const showOverlayToast = (msg: string) => {
    setOverlayFeedback(msg);
    setTimeout(() => setOverlayFeedback(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Background Service Status Card */}
      <div className={`p-6 rounded-2xl border transition-all ${
        serviceState.isRunning
          ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border-emerald-300 shadow-md shadow-emerald-500/10'
          : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${
              serviceState.isRunning ? 'bg-emerald-600 text-white shadow-emerald-600/20 animate-pulse' : 'bg-slate-200 text-slate-500'
            }`}>
              <Radio className="w-7 h-7" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  وضعیت سرویس پس‌زمینه (Background Foreground Service)
                </h2>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                  serviceState.isRunning ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  {serviceState.isRunning ? 'فعال و در حال اجرا' : 'غیرفعال'}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                برنامه حتی در صورت بستن فریم مرورگر یا باز کردن اینستاگرام، با سنسور دوربین حرکات دست را رصد می‌کند.
              </p>
            </div>
          </div>

          <button
            onClick={toggleService}
            className={`px-6 py-3 rounded-xl font-bold text-xs shadow-md transition flex items-center gap-2 ${
              serviceState.isRunning
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
            }`}
          >
            {serviceState.isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {serviceState.isRunning ? 'خاموش کردن سرویس پس‌زمینه' : 'روشن کردن سرویس پس‌زمینه'}
          </button>
        </div>
      </div>

      {/* Persistent Android Background Notification Preview */}
      {serviceState.isRunning && (
        <div className="bg-white border border-indigo-200 rounded-2xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-100 pb-2">
            <span className="flex items-center gap-1.5 text-indigo-700 font-semibold">
              <Bell className="w-4 h-4 text-indigo-600" />
              پیش‌نمایش اعلان زنده در نوار اعلانات اندروید (Foreground Notification)
            </span>
            <span className="font-mono text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">سرویس زنده</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
                🖐️
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">کنترل حرکتی دست اندروید در حال اجرا است</h4>
                <p className="text-[11px] text-slate-600">
                  در حال تعقیب حرکات مشت (اسکرین‌شات) و پینچ (اسکرول) روی برنامه: <strong className="text-indigo-700">{selectedApp}</strong>
                </p>
              </div>
            </div>

            <span className="text-[10px] bg-white border border-slate-200 text-slate-700 px-2 py-1 rounded-lg font-mono font-semibold">
              باتری: بی‌پایان
            </span>
          </div>
        </div>
      )}

      {/* Target App Switcher & Live Background Simulation */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">انتخاب برنامه هدف برای کنترل حرکتی (Target App)</h3>
          </div>
          <span className="text-xs text-slate-500">کارکرد روی تمام برنامه‌های اندروید</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {appOptions.map((app) => (
            <button
              key={app.name}
              onClick={() => setSelectedApp(app.name)}
              className={`p-3.5 rounded-xl border transition-all text-right flex items-center justify-between ${
                selectedApp === app.name
                  ? 'bg-indigo-50 border-indigo-400 text-indigo-900 shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-100/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xl">{app.icon}</span>
                <span className="text-xs font-bold">{app.name}</span>
              </div>
              {selectedApp === app.name && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            </button>
          ))}
        </div>

        {/* Live Simulation Card of Selected App with Overlay Widget */}
        <div className="relative rounded-2xl bg-slate-50 border border-slate-200 p-5 overflow-hidden space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="text-xs font-bold text-slate-900">
                محیط فرضی برنامه: <strong className="text-indigo-600">{selectedApp}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={triggerManualScreenshot}
                className="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 transition text-xs font-bold flex items-center gap-1 shadow-xs"
              >
                <Camera className="w-3.5 h-3.5 text-rose-600" />
                تست مشت (عکس)
              </button>

              <button
                onClick={triggerManualScroll}
                className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 transition text-xs font-bold flex items-center gap-1 shadow-xs"
              >
                <ArrowDown className="w-3.5 h-3.5 text-emerald-600" />
                تست پینچ (اسکرول)
              </button>
            </div>
          </div>

          {/* Toast Notification for Gesture Trigger over App */}
          {overlayFeedback && (
            <div className="bg-indigo-600 text-white p-3 rounded-xl text-xs font-bold shadow-lg border border-indigo-500 animate-bounce flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-300" />
              {overlayFeedback}
            </div>
          )}

          {/* Simulated App Content Box showing Scroll Position */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-3 min-h-[160px]">
            <div className="flex justify-between items-center text-xs text-slate-500">
              <span>فید فعلی برنامه {selectedApp}</span>
              <span className="font-mono text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">میزان اسکرول: {simulatedScrollPos}px</span>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              هنگامی که اینستاگرام را در گوشی خود باز کنید، سرویس پس‌زمینه در بالای صفحه یک حباب شناور کوچک نمایش داده و آماده دریافت حرکات ✊ (مشت) و 🤏 (پینچ) خواهد بود.
            </p>

            <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100">
              <span className="flex items-center gap-1 text-emerald-700 font-medium">● وضعیت سنسور: فعال و کم‌مصرف</span>
              <span className="font-medium">تعداد کل اسکرین‌شات‌ها: {serviceState.isRunning ? 'آماده' : 'غیرفعال'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
