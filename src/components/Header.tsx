import React from 'react';
import { Camera, Settings, Image as ImageIcon, Sparkles, Volume2, VolumeX, ShieldCheck, Zap, Radio } from 'lucide-react';

interface HeaderProps {
  activeTab: 'service' | 'permissions' | 'config' | 'camera' | 'gallery';
  setActiveTab: (tab: 'service' | 'permissions' | 'config' | 'camera' | 'gallery') => void;
  isCameraActive: boolean;
  activeGesture: string;
  screenshotCount: number;
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
  onOpenCalibration: () => void;
  isBackgroundRunning: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isCameraActive,
  activeGesture,
  screenshotCount,
  soundEnabled,
  setSoundEnabled,
  onOpenCalibration,
  isBackgroundRunning
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
      {/* Top Android Status Bar Simulation */}
      <div className="bg-slate-900 px-4 py-1 text-xs text-slate-300 flex justify-between items-center border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] text-slate-300 font-medium">سرویس اندروید</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1.5 font-bold ${
            isBackgroundRunning ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isBackgroundRunning ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
            {isBackgroundRunning ? 'اجرا در پس‌زمینه (فعال)' : 'متوقف'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isCameraActive ? (
            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1">
              <Camera className="w-3 h-3 text-indigo-400 animate-pulse" />
              دوربین فعال
            </span>
          ) : (
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full text-[10px] font-medium">
              دوربین متوقف
            </span>
          )}

          {activeGesture !== 'NONE' && (
            <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold animate-bounce">
              حرکت: {activeGesture === 'FIST' ? '✊ مشت' : activeGesture === 'PINCH' ? '🤏 پینچ' : activeGesture}
            </span>
          )}
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3.5 flex flex-wrap items-center justify-between gap-3">
        {/* Title / Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-600 p-0.5 shadow-md shadow-indigo-500/10">
            <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
              <Radio className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
              کنترل حرکتی اندروید در پس‌زمینه
              <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold px-2 py-0.5 rounded-full">
                ویژه اینستاگرام و برنامه‌های دیگر
              </span>
            </h1>
            <p className="text-xs text-slate-500">
              اجرا در پس‌زمینه بدون بستن برنامه با مشت (عکس گرفتن) و پینچ (اسکرول به پایین)
            </p>
          </div>
        </div>

        {/* Quick Tools & Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl text-xs font-medium transition-colors border ${
              soundEnabled
                ? 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100'
                : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
            }`}
            title={soundEnabled ? 'صدا فعال' : 'صدا غیرفعال'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={onOpenCalibration}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition text-xs font-semibold shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            کالیبراسیون
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-1 overflow-x-auto no-scrollbar border-t border-slate-100 pt-1.5 pb-2">
        <button
          onClick={() => setActiveTab('service')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'service'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Zap className="w-4 h-4" />
          داشبورد سرویس پس‌زمینه & اینستاگرام
        </button>

        <button
          onClick={() => setActiveTab('permissions')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'permissions'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          مجوزهای اندروید & بهینه‌سازی باتری
        </button>

        <button
          onClick={() => setActiveTab('config')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'config'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Settings className="w-4 h-4" />
          تنظیمات حرکات دست
        </button>

        <button
          onClick={() => setActiveTab('camera')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'camera'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Camera className="w-4 h-4" />
          پیش‌نمایش زنده دوربین
        </button>

        <button
          onClick={() => setActiveTab('gallery')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'gallery'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          گالری عکس‌ها
          {screenshotCount > 0 && (
            <span className="bg-emerald-500 text-white font-bold px-2 py-0.5 text-[10px] rounded-full">
              {screenshotCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
