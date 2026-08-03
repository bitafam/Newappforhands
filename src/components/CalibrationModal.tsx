import React, { useState } from 'react';
import { Sparkles, Check, ArrowRight, ShieldCheck, X } from 'lucide-react';
import { GestureConfig, HandDetectionResult } from '../types';

interface CalibrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  lastDetection: HandDetectionResult | null;
  config: GestureConfig;
  setConfig: React.Dispatch<React.SetStateAction<GestureConfig>>;
}

export const CalibrationModal: React.FC<CalibrationModalProps> = ({
  isOpen,
  onClose,
  lastDetection,
  config,
  setConfig
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [calibratedPinch, setCalibratedPinch] = useState<number | null>(null);
  const [calibratedFist, setCalibratedFist] = useState<number | null>(null);

  if (!isOpen) return null;

  const recordPinchSample = () => {
    if (lastDetection) {
      // Add slight safety offset to recorded pinch
      const val = Math.min(0.6, Math.max(0.15, lastDetection.pinchDistance + 0.08));
      setCalibratedPinch(val);
      setStep(2);
    }
  };

  const recordFistSample = () => {
    if (lastDetection) {
      // Add safety threshold for fist
      const val = Math.max(0.55, Math.min(0.95, lastDetection.fistTightness - 0.05));
      setCalibratedFist(val);
      setStep(3);
    }
  };

  const applyCalibration = () => {
    setConfig((prev) => ({
      ...prev,
      pinchThreshold: calibratedPinch !== null ? calibratedPinch : prev.pinchThreshold,
      fistThreshold: calibratedFist !== null ? calibratedFist : prev.fistThreshold
    }));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md p-4 flex items-center justify-center">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-slate-400 hover:text-white p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">کالیبراسیون هوشمند حرکات دست شما</h3>
            <p className="text-xs text-slate-400">تنظیم دقیق اندازه ابعاد دست برای شناسایی بدون خطا</p>
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-2">
              <span className="text-4xl block">🤏</span>
              <h4 className="text-xs font-bold text-white">مرحله ۱: کالیبراسیون پینچ (شست + اشاره)</h4>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                جلوی دوربین انگشت شست و اشاره خود را به هم نزدیک کنید (حالت پینچ گرفتن) و سپس روی دکمه ثبت کلیک کنید.
              </p>
              {lastDetection && (
                <div className="text-xs font-mono text-emerald-400 pt-1">
                  مقدار لحظه‌ای فاصله: {(lastDetection.pinchDistance * 100).toFixed(0)}%
                </div>
              )}
            </div>

            <button
              onClick={recordPinchSample}
              className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-500 transition"
            >
              ثبت حالت پینچ دست من
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-2">
              <span className="text-4xl block">✊</span>
              <h4 className="text-xs font-bold text-white">مرحله ۲: کالیبراسیون مشت کردن (Fist)</h4>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                حالا دست خود را جلوی دوربین کاملاً مشت کنید تا میزان تراکم مشت شما ثبت شود.
              </p>
              {lastDetection && (
                <div className="text-xs font-mono text-rose-400 pt-1">
                  مقدار لحظه‌ای مشت: {(lastDetection.fistTightness * 100).toFixed(0)}%
                </div>
              )}
            </div>

            <button
              onClick={recordFistSample}
              className="w-full py-2.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-500 transition"
            >
              ثبت حالت مشت دست من
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-3">
              <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto" />
              <h4 className="text-xs font-bold text-white">کالیبراسیون با موفقیت به پایان رسید!</h4>
              <div className="text-xs text-slate-300 space-y-1 text-right">
                <p>• حد جدید پینچ: <strong className="text-emerald-400">{Math.round((calibratedPinch || 0.35) * 100)}%</strong></p>
                <p>• حد جدید مشت: <strong className="text-rose-400">{Math.round((calibratedFist || 0.75) * 100)}%</strong></p>
              </div>
            </div>

            <button
              onClick={applyCalibration}
              className="w-full py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500 transition flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              اعمال تنظیمات اختصاصی جدید
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
