import React, { useState, useEffect } from 'react';
import {
  Camera,
  ShieldAlert,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Smartphone,
  Sparkles,
  Zap,
  Info,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { AndroidPermissions } from '../types';
import {
  requestRealCameraPermission,
  openAndroidSystemSettings,
  savePermissions,
  isAndroidApk,
  checkRealCameraPermission
} from '../utils/androidPermissions';

interface OnboardingPermissionsModalProps {
  permissions: AndroidPermissions;
  setPermissions: React.Dispatch<React.SetStateAction<AndroidPermissions>>;
  onClose: () => void;
}

export const OnboardingPermissionsModal: React.FC<OnboardingPermissionsModalProps> = ({
  permissions,
  setPermissions,
  onClose
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [cameraStatusMsg, setCameraStatusMsg] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const isApk = isAndroidApk();

  // Helper to update a permission state
  const handleToggleOrGrant = (key: keyof AndroidPermissions, val: boolean) => {
    setPermissions((prev) => {
      const next = { ...prev, [key]: val };
      savePermissions(next);
      return next;
    });
  };

  // Re-check real status of camera and permissions
  const handleRecheckRealPermissions = async () => {
    setIsChecking(true);
    setCameraStatusMsg('در حال استعلام واقعی سنسور دوربین و مجوزهای دستگاه...');

    const isCameraGranted = await checkRealCameraPermission();
    
    setPermissions((prev) => {
      const next = {
        ...prev,
        camera: isCameraGranted
      };
      savePermissions(next);
      return next;
    });

    setIsChecking(false);
    if (isCameraGranted) {
      setCameraStatusMsg('✓ سنسور دوربین کاملاً فعال و مجاز است!');
    } else {
      setCameraStatusMsg('⚠️ سنسور دوربین هنوز تایید نشده است. لطفاً دکمه درخواست دوربین را بزنید.');
    }
  };

  // Listen for window focus to re-verify permissions when user returns from Settings
  useEffect(() => {
    const handleFocus = async () => {
      const isCam = await checkRealCameraPermission();
      if (isCam) {
        handleToggleOrGrant('camera', true);
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('visibilitychange', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('visibilitychange', handleFocus);
    };
  }, []);

  // Request camera directly
  const handleRequestCamera = async () => {
    setIsChecking(true);
    setCameraStatusMsg('در حال ارسال درخواست دسترسی سنسور دوربین اندروید...');

    const granted = await requestRealCameraPermission();
    setIsChecking(false);

    if (granted) {
      setCameraStatusMsg('✓ دسترسی دوربین با موفقیت اعطا و تایید شد.');
      handleToggleOrGrant('camera', true);
    } else {
      setCameraStatusMsg('❌ دسترسی داده نشد. لطفاً در پنجره باز شده گزینه "مجاز است / Allow" را انتخاب کنید.');
      handleToggleOrGrant('camera', false);
    }
  };

  // Open settings & mark as enabled upon user intent
  const handleOpenSettings = (key: keyof AndroidPermissions) => {
    openAndroidSystemSettings(key);
  };

  const copyPathToClipboard = (text: string, keyName: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const steps = [
    { id: 1, title: 'دسترسی دوربین', icon: Camera, key: 'camera' as const },
    { id: 2, title: 'سرویس دسترسی‌پذیری', icon: ShieldAlert, key: 'accessibilityService' as const },
    { id: 3, title: 'نمایش شناور (Overlay)', icon: Smartphone, key: 'systemAlertWindow' as const },
    { id: 4, title: 'بهینه‌سازی باتری', icon: Zap, key: 'ignoreBatteryOptimizations' as const }
  ];

  const allCriticalGranted = permissions.camera && permissions.accessibilityService && permissions.systemAlertWindow;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 text-white dir-rtl relative my-auto">
        
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-4 gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600/20 border border-indigo-500/40 rounded-2xl text-indigo-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                راهنمای اعطا و تایید دسترسی‌های واقعی APK
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                  isApk ? 'bg-emerald-500 text-slate-950' : 'bg-amber-500 text-slate-950'
                }`}>
                  {isApk ? 'نسخه APK' : 'محیط وب/کاپاسیتور'}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                برای اجرای کنترل حرکتی روی اینستاگرام و خارج از برنامه، اعطای دسترسی‌های زیر الزامی است.
              </p>
            </div>
          </div>

          <button
            onClick={handleRecheckRealPermissions}
            disabled={isChecking}
            className="px-3.5 py-2 bg-indigo-600/30 border border-indigo-500/50 hover:bg-indigo-600/50 text-indigo-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isChecking ? 'animate-spin' : ''}`} />
            تست و استعلام مجدد واقعیت دسترسی‌ها
          </button>
        </div>

        {/* Steps Progress Indicator */}
        <div className="grid grid-cols-4 gap-2">
          {steps.map((step) => {
            const Icon = step.icon;
            const isGranted = permissions[step.key];
            const isCurrent = currentStep === step.id;

            return (
              <button
                key={step.id}
                onClick={() => setCurrentStep(step.id)}
                className={`p-2.5 rounded-2xl border text-right transition flex flex-col items-center sm:items-start gap-1 ${
                  isCurrent
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                    : isGranted
                    ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300'
                    : 'bg-slate-800/40 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <Icon className="w-4 h-4" />
                  {isGranted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <span className="text-[10px] opacity-60">گام {step.id}</span>
                  )}
                </div>
                <span className="text-[11px] font-semibold truncate hidden sm:block">
                  {step.title}
                </span>
              </button>
            );
          })}
        </div>

        {/* Step 1 Content: Camera Permission */}
        {currentStep === 1 && (
          <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-2xl space-y-4">
            <div className="flex items-center gap-3">
              <Camera className="w-6 h-6 text-indigo-400" />
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  گام اول: دسترسی به دوربین (Camera Sensor)
                  {permissions.camera ? (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                      تایید شده ✓
                    </span>
                  ) : (
                    <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-bold">
                      خاموش ❌
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  دوربین گوشی جهت پردازش زنده فریم‌ها و تشخیص حرکات مشت ✊ و پینچ 🤏 در پس‌زمینه استفاده می‌شود.
                </p>
              </div>
            </div>

            <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 text-xs space-y-2">
              <p className="text-slate-300 font-semibold flex items-center gap-2">
                <Info className="w-4 h-4 text-indigo-400" />
                نحوه اعطا:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11px] pr-2">
                <li>روی دکمه بنفش زیر کلیک کنید.</li>
                <li>در پنجره بازشده اندروید، گزینه <span className="text-emerald-300 font-bold">"هنگام استفاده از برنامه / While using the app"</span> را بزنید.</li>
              </ol>
            </div>

            {cameraStatusMsg && (
              <div className="p-3 rounded-xl bg-indigo-950 border border-indigo-700 text-xs font-semibold text-indigo-200">
                {cameraStatusMsg}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                onClick={handleRequestCamera}
                disabled={isChecking}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-md"
              >
                <Camera className="w-4 h-4" />
                درخواست و تست مستقیم دسترسی دوربین
              </button>

              <button
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition flex items-center gap-1"
              >
                گام بعدی ←
              </button>
            </div>
          </div>
        )}

        {/* Step 2 Content: Accessibility Service */}
        {currentStep === 2 && (
          <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-2xl space-y-4">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-6 h-6 text-indigo-400" />
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  گام دوم: سرویس دسترسی‌پذیری (Accessibility)
                  {permissions.accessibilityService ? (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                      تایید شده ✓
                    </span>
                  ) : (
                    <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-bold">
                      نیازمند فعال‌سازی دستی در تنظیمات
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  جهت اجرای اسکرول، عکس‌برداری و باز کردن اینستاگرام خارج از این برنامه.
                </p>
              </div>
            </div>

            {/* Step-by-step instructions for Android brands */}
            <div className="bg-amber-950/30 border border-amber-800/70 p-4 rounded-xl text-xs space-y-2.5">
              <p className="text-amber-200 font-bold flex items-center gap-1.5">
                <Info className="w-4 h-4 text-amber-400" />
                آدرس دستی دقیق در تنظیمات گوشی شما:
              </p>

              <div className="space-y-1.5 text-[11px] text-amber-100/90 font-mono">
                <p>• <strong className="text-amber-300">سامسونگ (Samsung):</strong> تنظیمات &gt; دسترسی‌پذیری (Accessibility) &gt; برنامه‌های نصب‌شده (Downloaded apps) &gt; Remix Gesture Controller</p>
                <p>• <strong className="text-amber-300">شیائومی (Xiaomi):</strong> تنظیمات &gt; تنظیمات بیشتر &gt; دسترسی‌پذیری &gt; سرویس‌های دانلود شده</p>
                <p>• <strong className="text-amber-300">پیکسل و سایر:</strong> Settings &gt; Accessibility &gt; Remix Gesture Controller</p>
              </div>

              <div className="pt-1 flex items-center justify-between">
                <button
                  onClick={() => copyPathToClipboard('Settings > Accessibility > Downloaded apps > Remix Gesture Controller', 'acc')}
                  className="px-2.5 py-1 bg-amber-900/40 border border-amber-700/60 text-amber-200 hover:bg-amber-900/60 rounded-lg text-[10px] font-bold flex items-center gap-1"
                >
                  {copiedKey === 'acc' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedKey === 'acc' ? 'مسیر کپی شد' : 'کپی مسیر متنی جهت جستجو'}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                onClick={() => handleOpenSettings('accessibilityService')}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-md"
              >
                <ExternalLink className="w-4 h-4 text-indigo-200" />
                باز کردن مستقیم صفحه Accessibility
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleOrGrant('accessibilityService', !permissions.accessibilityService)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                    permissions.accessibilityService
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  {permissions.accessibilityService ? 'تایید شده ✓' : 'تایید دستی توسط کاربر'}
                </button>

                <button
                  onClick={() => setCurrentStep(3)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition flex items-center gap-1"
                >
                  گام بعدی ←
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3 Content: Display Over Other Apps */}
        {currentStep === 3 && (
          <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-2xl space-y-4">
            <div className="flex items-center gap-3">
              <Smartphone className="w-6 h-6 text-indigo-400" />
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  گام سوم: نمایش روی سایر برنامه‌ها (Overlay)
                  {permissions.systemAlertWindow ? (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                      تایید شده ✓
                    </span>
                  ) : (
                    <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-bold">
                      خاموش ❌
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  جهت قرارگیری حباب کنترل حرکتی روی صفحه اینستاگرام.
                </p>
              </div>
            </div>

            <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 text-xs space-y-2 font-mono text-[11px] text-slate-300">
              <p className="text-indigo-300 font-bold flex items-center gap-2 font-sans text-xs">
                <Info className="w-4 h-4 text-indigo-400" />
                مسیر مستقیم فعال‌سازی Overlay:
              </p>
              <p>تنظیمات &gt; برنامه‌ها &gt; Remix Gesture Controller &gt; نمایش روی سایر برنامه‌ها (Draw over other apps) &gt; روشن</p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                onClick={() => handleOpenSettings('systemAlertWindow')}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-md"
              >
                <ExternalLink className="w-4 h-4 text-indigo-200" />
                باز کردن صفحه Overlay
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleOrGrant('systemAlertWindow', !permissions.systemAlertWindow)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                    permissions.systemAlertWindow
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  {permissions.systemAlertWindow ? 'فعال شده ✓' : 'تایید تغییر وضعیت'}
                </button>

                <button
                  onClick={() => setCurrentStep(4)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition flex items-center gap-1"
                >
                  گام بعدی ←
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4 Content: Battery Optimization & Autostart */}
        {currentStep === 4 && (
          <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-2xl space-y-4">
            <div className="flex items-center gap-3">
              <Zap className="w-6 h-6 text-amber-400" />
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  گام چهارم: استثنا از بهینه‌سازی باتری (Unrestricted Battery)
                  {permissions.ignoreBatteryOptimizations ? (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                      اعطا شده ✓
                    </span>
                  ) : (
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                      پیشنهادی
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  جلوگیری از بسته شدن خودکار سرویس رصد حرکات دست در پس‌زمینه توسط اندروید.
                </p>
              </div>
            </div>

            <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 text-xs space-y-2 text-[11px] text-slate-300">
              <p className="text-amber-300 font-bold flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-400" />
                دستورالعمل:
              </p>
              <p>
                در صفحه تنظیمات باتری، گزینه <strong className="text-white">"Unrestricted / بدون محدودیت"</strong> را انتخاب فرمایید.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                onClick={() => handleOpenSettings('ignoreBatteryOptimizations')}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-md"
              >
                <ExternalLink className="w-4 h-4 text-indigo-200" />
                باز کردن تنظیمات باتری
              </button>

              <button
                onClick={() => handleToggleOrGrant('ignoreBatteryOptimizations', !permissions.ignoreBatteryOptimizations)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                  permissions.ignoreBatteryOptimizations
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                {permissions.ignoreBatteryOptimizations ? 'وضعیت: فعال ✓' : 'علامت‌گذاری به‌عنوان فعال'}
              </button>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between border-t border-slate-800 pt-4 gap-3">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            {!allCriticalGranted && (
              <span className="text-rose-400 font-bold flex items-center gap-1 bg-rose-950/50 px-2 py-0.5 rounded-md border border-rose-800/60">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                برخی دسترسی‌ها تایید نشده‌اند
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg transition flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            تایید و ورود به برنامه
          </button>
        </div>
      </div>
    </div>
  );
};
