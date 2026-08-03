import React, { useState } from 'react';
import {
  Camera,
  ShieldAlert,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Smartphone,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ChevronLeft,
  Zap,
  Info
} from 'lucide-react';
import { AndroidPermissions } from '../types';
import {
  requestRealCameraPermission,
  openAndroidSystemSettings,
  savePermissions,
  isAndroidApk
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
  const [isRequestingCamera, setIsRequestingCamera] = useState(false);

  const isApk = isAndroidApk();

  // Helper to update a permission state
  const handleToggleOrGrant = (key: keyof AndroidPermissions, val: boolean) => {
    setPermissions((prev) => {
      const next = { ...prev, [key]: val };
      savePermissions(next);
      return next;
    });
  };

  // Request camera directly
  const handleRequestCamera = async () => {
    setIsRequestingCamera(true);
    setCameraStatusMsg('در حال ارسال درخواست دسترسی سنسور دوربین اندروید...');

    const granted = await requestRealCameraPermission();
    setIsRequestingCamera(false);

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
    handleToggleOrGrant(key, true);
  };

  const steps = [
    { id: 1, title: 'دسترسی دوربین', icon: Camera, key: 'camera' as const },
    { id: 2, title: 'سرویس دسترسی‌پذیری', icon: ShieldAlert, key: 'accessibilityService' as const },
    { id: 3, title: 'نمایش شناور (Overlay)', icon: Smartphone, key: 'systemAlertWindow' as const },
    { id: 4, title: 'بهینه‌سازی باتری', icon: Zap, key: 'ignoreBatteryOptimizations' as const }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 text-white dir-rtl relative my-auto">
        {/* Top Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600/20 border border-indigo-500/40 rounded-2xl text-indigo-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                راهنمای اعطای دسترسی‌های واقعی APK
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  isApk ? 'bg-emerald-500 text-slate-950' : 'bg-amber-500 text-slate-950'
                }`}>
                  {isApk ? 'نسخه APK' : 'محیط تست وب'}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                تک‌تک دسترسی‌های زیر جهت رصد حرکات دست روی اینستاگرام و برنامه‌ها مورد نیاز است.
              </p>
            </div>
          </div>
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
                    ? 'bg-indigo-600/20 border-indigo-500 text-white'
                    : isGranted
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
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
                  گام اول: دسترسی به دوربین (Camera)
                  {permissions.camera ? (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                      اعطا شده ✓
                    </span>
                  ) : (
                    <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-bold">
                      خاموش ❌
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  دوربین گوشی جهت پردازش زنده فریم‌ها و تشخیص حرکات مشت و پینچ استفاده می‌شود.
                </p>
              </div>
            </div>

            <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 text-xs space-y-2">
              <p className="text-slate-300 font-semibold flex items-center gap-2">
                <Info className="w-4 h-4 text-indigo-400" />
                روش اعطای دسترسی دوربین:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11px] pr-2">
                <li>روی دکمه زیر کلیک کنید تا پنجره سیستم‌عامل اندروید باز شود.</li>
                <li>گزینه <span className="text-emerald-300 font-bold">"هنگام استفاده از برنامه / While using the app"</span> را انتخاب کنید.</li>
              </ol>
            </div>

            {cameraStatusMsg && (
              <div className="p-3 rounded-xl bg-indigo-950 border border-indigo-700 text-xs font-semibold text-indigo-200">
                {cameraStatusMsg}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handleRequestCamera}
                disabled={isRequestingCamera}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-md"
              >
                <Camera className="w-4 h-4" />
                درخواست و اعطای مستقیم دسترسی دوربین
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
                      اعطا شده ✓
                    </span>
                  ) : (
                    <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-bold">
                      خاموش (نیازمند تنظیم دستی)
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  جهت ارسال دستورات اسکرول و عکس‌برداری صفحه روی برنامه‌های دیگر (مثل اینستاگرام).
                </p>
              </div>
            </div>

            <div className="bg-amber-950/20 border border-amber-800/60 p-3.5 rounded-xl text-xs space-y-2">
              <p className="text-amber-200 font-bold flex items-center gap-1.5">
                <Info className="w-4 h-4 text-amber-400" />
                راهنمای گام به گام فعال‌سازی دستی در تنظیمات اندروید:
              </p>
              <ol className="list-decimal list-inside space-y-1.5 text-amber-100/80 text-[11px] pr-2">
                <li>روی دکمه <span className="text-amber-300 font-bold">"باز کردن تنظیمات Accessibility"</span> در زیر کلیک کنید.</li>
                <li>در صفحه باز شده، وارد بخش <span className="text-amber-300 font-bold">"Downloaded Apps / برنامه‌های نصب‌شده"</span> شوید.</li>
                <li>برنامه <span className="text-amber-300 font-bold">"Remix Gesture Controller"</span> را انتخاب کنید.</li>
                <li>سویچ گزینه <span className="text-amber-300 font-bold">"Use Remix Gesture Controller"</span> را روشن کنید.</li>
              </ol>
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
                  {permissions.accessibilityService ? 'وضعیت: فعال شده ✓' : 'تایید انجام دستی توسط کاربر'}
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
                      اعطا شده ✓
                    </span>
                  ) : (
                    <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-bold">
                      خاموش ❌
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  جهت قرارگیری حباب کنترل حرکتی روی صفحه اینستاگرام و سایر برنامه‌ها.
                </p>
              </div>
            </div>

            <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 text-xs space-y-2">
              <p className="text-slate-300 font-semibold flex items-center gap-2">
                <Info className="w-4 h-4 text-indigo-400" />
                راهنمای فعال‌سازی Overlay:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11px] pr-2">
                <li>روی دکمه "تنظیمات Overlay" کلیک کنید.</li>
                <li>برنامه "Remix Gesture Controller" را در لیست پیدا کنید.</li>
                <li>گزینه <span className="text-emerald-300 font-bold">"Allow display over other apps"</span> را روشن کنید.</li>
              </ol>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                onClick={() => handleOpenSettings('systemAlertWindow')}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-md"
              >
                <ExternalLink className="w-4 h-4 text-indigo-200" />
                باز کردن مستقیم صفحه Overlay
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
                  {permissions.systemAlertWindow ? 'وضعیت: فعال شد ✓' : 'تایید تغییر وضعیت'}
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
                  گام چهارم: استثنا از بهینه‌سازی باتری
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
                  جلوگیری از بسته شدن خودکار سرویس رصد حرکات دست در پس‌زمینه توسط مدیریت مصرف اندروید.
                </p>
              </div>
            </div>

            <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 text-xs space-y-2">
              <p className="text-slate-300 font-semibold flex items-center gap-2">
                <Info className="w-4 h-4 text-indigo-400" />
                دستورالعمل:
              </p>
              <p className="text-slate-400 text-[11px]">
                در صفحه تنظیمات باتری، گزینه "Unrestricted / بدون محدودیت" یا "Don't optimize" را برای این برنامه انتخاب فرمایید.
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
        <div className="flex items-center justify-between border-t border-slate-800 pt-4">
          <div className="text-xs text-slate-400">
            {Object.values(permissions).filter(Boolean).length} از {Object.keys(permissions).length} دسترسی فعال است.
          </div>

          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg transition flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            تایید و ورود به محیط اصلی برنامه
          </button>
        </div>
      </div>
    </div>
  );
};
