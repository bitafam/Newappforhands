import React from 'react';
import { Settings, Sliders, Volume2, Vibrate, RefreshCw, Zap } from 'lucide-react';
import { GestureConfig, GestureMapping, GestureType, ActionType } from '../types';

interface GestureMappingConfigProps {
  config: GestureConfig;
  setConfig: React.Dispatch<React.SetStateAction<GestureConfig>>;
  mappings: GestureMapping[];
  setMappings: React.Dispatch<React.SetStateAction<GestureMapping[]>>;
}

export const GestureMappingConfig: React.FC<GestureMappingConfigProps> = ({
  config,
  setConfig,
  mappings,
  setMappings
}) => {
  const updateMappingAction = (gesture: GestureType, newAction: ActionType) => {
    setMappings((prev) =>
      prev.map((m) => (m.gesture === gesture ? { ...m, action: newAction } : m))
    );
  };

  const toggleMappingEnabled = (gesture: GestureType) => {
    setMappings((prev) =>
      prev.map((m) => (m.gesture === gesture ? { ...m, enabled: !m.enabled } : m))
    );
  };

  const actionOptions: { value: ActionType; labelFa: string }[] = [
    { value: 'SCREENSHOT', labelFa: '📸 گرفتن اسکرین‌شات (Screenshot)' },
    { value: 'SCROLL_DOWN', labelFa: '⬇️ اسکرول به پایین (Scroll Down)' },
    { value: 'SCROLL_UP', labelFa: '⬆️ اسکرول به بالا (Scroll Up)' },
    { value: 'VOLUME_UP', labelFa: '🔊 افزایش صدا (Volume Up)' },
    { value: 'VOLUME_DOWN', labelFa: '🔉 کاهش صدا (Volume Down)' },
    { value: 'BACK', labelFa: '◀️ دکمه بازگشت (Back)' },
    { value: 'HOME', labelFa: '🏠 دکمه خانه (Home)' },
    { value: 'TOGGLE_TORCH', labelFa: '🔦 فلاش دوربین (Flashlight)' },
    { value: 'NONE', labelFa: '⛔ بدون اقدام (غیرفعال)' }
  ];

  return (
    <div className="space-y-6">
      {/* Banner Notice */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-5 rounded-2xl border border-indigo-700 shadow-md text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-white/10 text-emerald-300">
              <Zap className="w-5 h-5" />
            </span>
            <h2 className="text-base font-bold text-white">پیکربندی هوشمند دستورات حرکتی دست</h2>
          </div>
          <p className="text-xs text-indigo-100 leading-relaxed">
            شما می‌توانید برای هر حرکت دست (مانند مشت یا پینچ)، یک قابلیت سفارشی در گوشی اندروید تعریف کنید.
          </p>
        </div>

        <button
          onClick={() => {
            setConfig({
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
          }}
          className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition text-xs font-semibold border border-white/20 flex items-center gap-1.5 shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          بازنشانی تنظیمات اولیه
        </button>
      </div>

      {/* Mappings Grid */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Settings className="w-5 h-5 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">جدول تخصیص حرکات به قابلیت‌های گوشی</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mappings.map((m) => (
            <div
              key={m.gesture}
              className={`p-4 rounded-xl border transition-all ${
                m.enabled
                  ? 'bg-slate-50 border-slate-200 hover:border-indigo-300'
                  : 'bg-slate-50/50 border-slate-200 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl p-2 bg-white rounded-xl border border-slate-200 shadow-xs">
                    {m.gesture === 'FIST'
                      ? '✊'
                      : m.gesture === 'PINCH'
                      ? '🤏'
                      : m.gesture === 'OPEN_PALM'
                      ? '🖐️'
                      : m.gesture === 'POINTING'
                      ? '👆'
                      : m.gesture === 'V_SIGN'
                      ? '✌️'
                      : '👍'}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{m.labelFa}</h4>
                    <span className="text-[10px] font-mono text-slate-500 font-medium">کد حرکت: {m.gesture}</span>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={m.enabled}
                    onChange={() => toggleMappingEnabled(m.gesture)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-600">قابلیت اجرایی در گوشی:</label>
                <select
                  value={m.action}
                  disabled={!m.enabled}
                  onChange={(e) => updateMappingAction(m.gesture, e.target.value as ActionType)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 disabled:opacity-50 shadow-xs"
                >
                  {actionOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.labelFa}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Thresholds & Sensitivity Sliders */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Sliders className="w-5 h-5 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">تنظیمات حساسیت و زمان‌بندی (Sensitivity Sliders)</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pinch Sensitivity Slider */}
          <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                🤏 حد آستانه پینچ (نزدیکی شست و اشاره)
              </span>
              <span className="font-mono text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-md">
                {Math.round(config.pinchThreshold * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.15"
              max="0.65"
              step="0.05"
              value={config.pinchThreshold}
              onChange={(e) => setConfig((prev) => ({ ...prev, pinchThreshold: parseFloat(e.target.value) }))}
              className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
            />
            <p className="text-[11px] text-slate-500">
              هرچه عدد کمتر باشد، دو انگشت باید کاملاً به هم بچسبند تا عمل اسکرول انجام شود.
            </p>
          </div>

          {/* Fist Sensitivity Slider */}
          <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                ✊ حد آستانه مشت (Fist Tightness)
              </span>
              <span className="font-mono text-rose-700 font-bold bg-rose-100 px-2 py-0.5 rounded-md">
                {Math.round(config.fistThreshold * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.50"
              max="0.95"
              step="0.05"
              value={config.fistThreshold}
              onChange={(e) => setConfig((prev) => ({ ...prev, fistThreshold: parseFloat(e.target.value) }))}
              className="w-full accent-rose-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
            />
            <p className="text-[11px] text-slate-500">
              هرچه عدد بیشتر باشد، مشت باید محکم‌تر بسته شود تا عمل اسکرین‌شات صادر گردد.
            </p>
          </div>

          {/* Hold Time Slider */}
          <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-slate-800">مدت زمان مکث برای اجرا (Trigger Hold Time):</span>
              <span className="font-mono text-indigo-700 font-bold bg-indigo-100 px-2 py-0.5 rounded-md">{config.holdTimeMs} میلی‌ثانیه</span>
            </div>
            <input
              type="range"
              min="50"
              max="1000"
              step="50"
              value={config.holdTimeMs}
              onChange={(e) => setConfig((prev) => ({ ...prev, holdTimeMs: parseInt(e.target.value) }))}
              className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
            />
            <p className="text-[11px] text-slate-500">
              مدت زمانی که باید حرکت دست ثابت نگه داشته شود تا اقدام اجرا گردد (برای جلوگیری از خطای تصادفی).
            </p>
          </div>

          {/* Cooldown Slider */}
          <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-slate-800">زمان استراحت بین تکرارها (Cooldown):</span>
              <span className="font-mono text-indigo-700 font-bold bg-indigo-100 px-2 py-0.5 rounded-md">{config.cooldownMs} میلی‌ثانیه</span>
            </div>
            <input
              type="range"
              min="300"
              max="3000"
              step="100"
              value={config.cooldownMs}
              onChange={(e) => setConfig((prev) => ({ ...prev, cooldownMs: parseInt(e.target.value) }))}
              className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
            />
            <p className="text-[11px] text-slate-500">
              تأخیر بین دو اسکرین‌شات یا دو اسکرول متوالی جهت جلوگیری از تکرار سریع ناخواسته.
            </p>
          </div>
        </div>

        {/* Feedback Options */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100">
            <div className="flex items-center gap-2">
              <Vibrate className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-slate-800">بازخورد لرزشی (Vibration / Haptic)</span>
            </div>
            <input
              type="checkbox"
              checked={config.vibrationEnabled}
              onChange={(e) => setConfig((prev) => ({ ...prev, vibrationEnabled: e.target.checked }))}
              className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-slate-800">بازخورد صوتی شاتر / کلیک</span>
            </div>
            <input
              type="checkbox"
              checked={config.soundEnabled}
              onChange={(e) => setConfig((prev) => ({ ...prev, soundEnabled: e.target.checked }))}
              className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
            />
          </label>
        </div>
      </div>
    </div>
  );
};
