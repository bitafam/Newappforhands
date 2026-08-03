import React, { useState } from 'react';
import { ShieldCheck, BatteryCharging, Eye, Layers, Camera, CheckCircle2, Zap, Info, Smartphone, Power, RefreshCw } from 'lucide-react';
import { AndroidPermissions } from '../types';

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
  const [activeInstruction, setActiveInstruction] = useState<string | null>(null);

  const togglePermission = (key: keyof AndroidPermissions) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const grantAllPermissions = () => {
    setPermissions({
      controlOtherApps: true,
      accessibilityService: true,
      backgroundAutoStart: true,
      ignoreBatteryOptimizations: true,
      camera: true,
      systemAlertWindow: true,
      foregroundService: true
    });
  };

  const allGranted = Object.values(permissions).every(Boolean);

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
                دسترسی‌های اندروید (Permissions Settings)
                <span className="text-xs bg-emerald-500 text-slate-950 font-bold px-2.5 py-0.5 rounded-full">
                  مطابق با آخرین آپدیت سیستم‌عامل
                </span>
              </h2>
              <p className="text-xs text-indigo-200 leading-relaxed mt-0.5">
                برای عملکرد صحیح حرکات دست روی اینستاگرام، تلگرام و سایر برنامه‌ها، تمامی مجوزهای زیر را فعال نمایید.
              </p>
            </div>
          </div>

          <button
            onClick={grantAllPermissions}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            فعال‌سازی و اعطای سریع تمامی دسترسی‌ها
          </button>
        </div>
      </div>

      {/* Screenshot Reproduction Dark Card Preview Container */}
      <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-indigo-400" />
            Permissions (تنظیمات مجوزهای برنامه)
          </h3>
          <span className="text-xs text-slate-400 font-mono">Android Settings</span>
        </div>

        <div className="space-y-3.5">
          {/* 1. Control other apps */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4 hover:border-slate-700 transition">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                Control other apps (کنترل سایر برنامه‌ها)
                {permissions.controlOtherApps && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                    فعال
                  </span>
                )}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                To enable gestures while using other apps, additional permissions are required.
              </p>
              <p className="text-[11px] text-slate-500">
                (جهت فعال‌سازی حرکات دست هنگام استفاده از اینستاگرام و سایر برنامه‌ها)
              </p>
            </div>

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

          {/* 2. Accessibility Permission (Required) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4 hover:border-slate-700 transition">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white">
                  Accessibility Permission (Required)
                </h4>
                <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-bold">
                  الزامی
                </span>
                {permissions.accessibilityService && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                    اعطا شد ✓
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                A required permission to recognize and control gestures while using other apps.
              </p>
              <p className="text-[11px] text-slate-500">
                (دسترسی سیستم دسترسی‌پذیری جهت تشخیص حرکات و اجرای اسکرول و عکس‌برداری روی اینستاگرام)
              </p>
            </div>

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

          {/* 3. Background Auto Start (Recommended) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4 hover:border-slate-700 transition">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white">
                  Background Auto Start (Recommended)
                </h4>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-medium">
                  پیشنهادی
                </span>
                {permissions.backgroundAutoStart && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                    فعال
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Prevents the accessibility permission from being automatically disabled on some devices.
              </p>
              <p className="text-[11px] text-slate-500">
                (جلوگیری از غیرفعال شدن خودکار دسترسی دسترسی‌پذیری توسط مدیریت سیستم اندروید)
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={permissions.backgroundAutoStart}
                onChange={() => togglePermission('backgroundAutoStart')}
                className="sr-only peer"
              />
              <div className="w-12 h-7 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          {/* 4. Exclude from Battery Optimization (Recommended) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4 hover:border-slate-700 transition">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white">
                  Exclude from Battery Optimization (Recommended)
                </h4>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-medium">
                  پیشنهادی
                </span>
                {permissions.ignoreBatteryOptimizations && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                    فعال
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Prevents the accessibility permission from being disabled due to automatic system power saving.
              </p>
              <p className="text-[11px] text-slate-500">
                (استثنا از حالت کاهش مصرف باتری جهت پایداری تعقیب حرکات دست در پس‌زمینه)
              </p>
            </div>

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

          {/* Additional Hardware Permissions */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Camera */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <Camera className="w-5 h-5 text-indigo-400" />
                <div>
                  <h5 className="text-xs font-bold text-white">دسترسی به دوربین (Camera)</h5>
                  <p className="text-[10px] text-slate-400">سنسور رصد حرکات</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={permissions.camera}
                  onChange={() => togglePermission('camera')}
                  className="sr-only peer"
                />
                <div className="w-10 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {/* Display Over Other Apps (Overlay) */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <Eye className="w-5 h-5 text-indigo-400" />
                <div>
                  <h5 className="text-xs font-bold text-white">نمایش شناور (Overlay)</h5>
                  <p className="text-[10px] text-slate-400">حباب شناور بالای برنامه</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={permissions.systemAlertWindow}
                  onChange={() => togglePermission('systemAlertWindow')}
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
            <h4 className="text-sm font-bold text-slate-900">
              {allGranted ? 'تمامی مجوزهای اندروید اعطا شده‌اند!' : 'وضعیت مجوزها'}
            </h4>
            <p className="text-xs text-slate-500">
              {allGranted
                ? 'اکنون سرویس کنترل حرکتی آماده کار در پس‌زمینه و برنامه اینستاگرام است.'
                : 'برای کارکرد روان‌تر برنامه، تمام گزینه‌های بالا را فعال کنید.'}
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

