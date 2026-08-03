import React, { useState } from 'react';
import { ShieldCheck, Camera, CheckCircle2, Zap, Smartphone, RefreshCw, ExternalLink, AlertTriangle, XCircle } from 'lucide-react';
import { AndroidPermissions } from '../types';
import {
  isAndroidApk,
  requestRealCameraPermission,
  openAndroidSystemSettings,
  savePermissions
} from '../utils/androidPermissions';

interface AndroidPermissionsWizardProps {
  permissions: AndroidPermissions;
  setPermissions: React.Dispatch<React.SetStateAction<AndroidPermissions>>;
  onContinue: () => void;
}

export const AndroidPermissionsWizard: React.FC<AndroidPermissionsWizardProps> = ({
  permissions,
  setPermissions,
  onContinue
}) => {
  const [isRequestingCamera, setIsRequestingCamera] = useState(false);
  const [cameraFeedback, setCameraFeedback] = useState<string | null>(null);

  const isApk = isAndroidApk();

  const togglePermission = (key: keyof AndroidPermissions) => {
    setPermissions((prev) => {
      const next = {
        ...prev,
        [key]: !prev[key]
      };
      savePermissions(next);
      return next;
    });
  };

  const handleRequestCamera = async () => {
    setIsRequestingCamera(true);
    setCameraFeedback('در حال درخواست و تست سنسور دوربین...');
    
    const granted = await requestRealCameraPermission();
    setIsRequestingCamera(false);

    if (granted) {
      setCameraFeedback('✓ دسترسی دوربین با موفقیت اعطا و تایید شد.');
      setPermissions((prev) => {
        const next = { ...prev, camera: true };
        savePermissions(next);
        return next;
      });
    } else {
      setCameraFeedback('❌ دسترسی به دوربین داده نشد. لطفاً در تنظیمات دستگاه اجازه دهید.');
      setPermissions((prev) => {
        const next = { ...prev, camera: false };
        savePermissions(next);
        return next;
      });
    }

    setTimeout(() => setCameraFeedback(null), 4000);
  };

  const handleOpenSettingAndGrant = (key: keyof AndroidPermissions) => {
    openAndroidSystemSettings(key);
    // Mark as enabled after triggering request
    setPermissions((prev) => {
      const next = { ...prev, [key]: true };
      savePermissions(next);
      return next;
    });
  };

  const grantAllPermissions = async () => {
    // Attempt camera permission request
    const cameraGranted = await requestRealCameraPermission();
    
    const allOn: AndroidPermissions = {
      controlOtherApps: true,
      accessibilityService: true,
      backgroundAutoStart: true,
      ignoreBatteryOptimizations: true,
      camera: cameraGranted,
      systemAlertWindow: true,
      foregroundService: true
    };
    
    setPermissions(allOn);
    savePermissions(allOn);
  };

  const grantedCount = Object.values(permissions).filter(Boolean).length;
  const totalCount = Object.keys(permissions).length;
  const allGranted = grantedCount === totalCount;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 p-6 rounded-2xl border border-indigo-800 shadow-lg text-white space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-500/20 text-emerald-300 backdrop-blur-md border border-indigo-500/30">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                مدیریت دسترسی‌های واقعی اندروید (APK Permissions)
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  isApk ? 'bg-emerald-500 text-slate-950' : 'bg-amber-500 text-slate-950'
                }`}>
                  {isApk ? 'محیط: نسخه APK اندروید' : 'محیط: مرورگر وب'}
                </span>
              </h2>
              <p className="text-xs text-indigo-200 leading-relaxed mt-0.5">
                وضعیت واقعی دسترسی‌های دستگاه. مجوزهای خاموش جهت اجرا در APK نیاز به اعطا دارند.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleRequestCamera}
              disabled={isRequestingCamera}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
            >
              <Camera className="w-4 h-4 text-indigo-200" />
              درخواست مجدد دوربین
            </button>

            <button
              onClick={grantAllPermissions}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              درخواست و اعطای سریع تمامی دسترسی‌ها
            </button>
          </div>
        </div>

        {/* Feedback Alert for camera */}
        {cameraFeedback && (
          <div className="mt-2 p-2.5 rounded-xl bg-indigo-900/80 border border-indigo-700 text-xs font-semibold text-white flex items-center gap-2 animate-fade-in">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
            {cameraFeedback}
          </div>
        )}
      </div>

      {/* Main Permissions Panel */}
      <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-indigo-400" />
            تنظیمات مجوزهای APK برنامه ({grantedCount} از {totalCount} اعطا شده)
          </h3>
          <span className="text-xs text-slate-400 font-mono">Android Native Settings</span>
        </div>

        <div className="space-y-3.5">
          {/* 1. Camera Access (Crucial for gesture tracking) */}
          <div className={`border rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 transition ${
            permissions.camera ? 'bg-slate-900/90 border-emerald-500/40' : 'bg-rose-950/20 border-rose-800/60'
          }`}>
            <div className="space-y-1 flex-1 min-w-[240px]">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-indigo-400" />
                <h4 className="text-sm font-bold text-white">
                  دسترسی به دوربین (Camera Sensor)
                </h4>
                {permissions.camera ? (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    اعطا شد (فعال)
                  </span>
                ) : (
                  <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <XCircle className="w-3 h-3 text-rose-400" />
                    خاموش (نیازمند اعطا)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                سنسور پردازش تصویر جهت تشخیص حرکات مشت ✊ و پینچ 🤏 در پس‌زمینه.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRequestCamera}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1"
              >
                <Camera className="w-3.5 h-3.5" />
                تست و اعطا
              </button>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={permissions.camera}
                  onChange={() => togglePermission('camera')}
                  className="sr-only peer"
                />
                <div className="w-12 h-7 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
          </div>

          {/* 2. Control other apps */}
          <div className={`border rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 transition ${
            permissions.controlOtherApps ? 'bg-slate-900/80 border-slate-800' : 'bg-rose-950/10 border-rose-900/40'
          }`}>
            <div className="space-y-1 flex-1 min-w-[240px]">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white">
                  Control other apps (کنترل سایر برنامه‌ها)
                </h4>
                {permissions.controlOtherApps ? (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                    اعطا شد ✓
                  </span>
                ) : (
                  <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-semibold">
                    خاموش
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                جهت فعال‌سازی حرکات دست هنگام استفاده از اینستاگرام، تلگرام و سایر برنامه‌ها.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleOpenSettingAndGrant('controlOtherApps')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                تنظیمات سیستم
              </button>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={permissions.controlOtherApps}
                  onChange={() => togglePermission('controlOtherApps')}
                  className="sr-only peer"
                />
                <div className="w-12 h-7 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
          </div>

          {/* 3. Accessibility Permission (Required) */}
          <div className={`border rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 transition ${
            permissions.accessibilityService ? 'bg-slate-900/80 border-slate-800' : 'bg-rose-950/20 border-rose-800/60'
          }`}>
            <div className="space-y-1 flex-1 min-w-[240px]">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white">
                  Accessibility Permission (سرویس دسترسی‌پذیری)
                </h4>
                <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-bold">
                  الزامی برای APK
                </span>
                {permissions.accessibilityService ? (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                    اعطا شد ✓
                  </span>
                ) : (
                  <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-semibold">
                    خاموش (نیاز به باز کردن Accessibility)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                دسترسی سیستم دسترسی‌پذیری جهت تشخیص حرکات و اجرای اسکرول و عکس‌برداری روی اینستاگرام.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleOpenSettingAndGrant('accessibilityService')}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1 shadow-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                باز کردن Accessibility
              </button>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={permissions.accessibilityService}
                  onChange={() => togglePermission('accessibilityService')}
                  className="sr-only peer"
                />
                <div className="w-12 h-7 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
          </div>

          {/* 4. Display Over Other Apps (Overlay) */}
          <div className={`border rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 transition ${
            permissions.systemAlertWindow ? 'bg-slate-900/80 border-slate-800' : 'bg-rose-950/10 border-rose-900/40'
          }`}>
            <div className="space-y-1 flex-1 min-w-[240px]">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white">
                  Display Over Other Apps (نمایش شناور روی برنامه‌ها)
                </h4>
                {permissions.systemAlertWindow ? (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                    اعطا شد ✓
                  </span>
                ) : (
                  <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-semibold">
                    خاموش
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                مجوز ایجاد حباب شناور کنترل حرکتی روی صفحه اینستاگرام.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleOpenSettingAndGrant('systemAlertWindow')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                تنظیمات Overlay
              </button>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={permissions.systemAlertWindow}
                  onChange={() => togglePermission('systemAlertWindow')}
                  className="sr-only peer"
                />
                <div className="w-12 h-7 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
          </div>

          {/* 5. Exclude from Battery Optimization */}
          <div className={`border rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 transition ${
            permissions.ignoreBatteryOptimizations ? 'bg-slate-900/80 border-slate-800' : 'bg-amber-950/10 border-amber-900/40'
          }`}>
            <div className="space-y-1 flex-1 min-w-[240px]">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white">
                  Exclude from Battery Optimization (استثنا از بهینه‌سازی باتری)
                </h4>
                {permissions.ignoreBatteryOptimizations ? (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                    فعال ✓
                  </span>
                ) : (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-semibold">
                    خاموش
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                جلوگیری از غیرفعال شدن سرویس پس‌زمینه در اثر حالت کاهش مصرف سیستم‌عامل اندروید.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleOpenSettingAndGrant('ignoreBatteryOptimizations')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                تنظیمات باتری
              </button>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={permissions.ignoreBatteryOptimizations}
                  onChange={() => togglePermission('ignoreBatteryOptimizations')}
                  className="sr-only peer"
                />
                <div className="w-12 h-7 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
          </div>

          {/* 6. Background Auto Start & Foreground Service */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-2">
              <div>
                <h5 className="text-xs font-bold text-white">Auto Start در پس‌زمینه</h5>
                <p className="text-[10px] text-slate-400">راه اندازی پس از روشن شدن گوشی</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={permissions.backgroundAutoStart}
                  onChange={() => togglePermission('backgroundAutoStart')}
                  className="sr-only peer"
                />
                <div className="w-10 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-2">
              <div>
                <h5 className="text-xs font-bold text-white">سرویس پیش‌زمینه (Foreground)</h5>
                <p className="text-[10px] text-slate-400">اعلان زنده و پایدار اندروید</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={permissions.foregroundService}
                  onChange={() => togglePermission('foregroundService')}
                  className="sr-only peer"
                />
                <div className="w-10 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Start Service CTA */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Zap className="w-6 h-6 text-amber-500" />
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              {allGranted ? 'تمامی مجوزهای اندروید اعطا شده‌اند!' : `وضعیت دسترسی‌ها (${grantedCount} از ${totalCount} اعطا شده)`}
              {!permissions.camera && (
                <span className="text-[11px] font-normal text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                  دوربین خاموش است
                </span>
              )}
            </h4>
            <p className="text-xs text-slate-500">
              {allGranted
                ? 'اکنون سرویس کنترل حرکتی آماده کار در پس‌زمینه و برنامه اینستاگرام است.'
                : 'برای کارکرد روان‌تر برنامه، مجوزهای خاموش بالا را اعطا و فعال کنید.'}
            </p>
          </div>
        </div>

        <button
          onClick={onContinue}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition"
        >
          ورود به داشبورد اصلی سرویس پس‌زمینه ←
        </button>
      </div>
    </div>
  );
};


