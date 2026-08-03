import React, { useState } from 'react';
import { Image as ImageIcon, Download, Trash2, Eye, Calendar, AlertCircle } from 'lucide-react';
import { CapturedScreenshot } from '../types';

interface ScreenshotGalleryProps {
  screenshots: CapturedScreenshot[];
  onDeleteScreenshot: (id: string) => void;
  onClearAll: () => void;
}

export const ScreenshotGallery: React.FC<ScreenshotGalleryProps> = ({
  screenshots,
  onDeleteScreenshot,
  onClearAll
}) => {
  const [selectedImage, setSelectedImage] = useState<CapturedScreenshot | null>(null);

  const downloadImage = (shot: CapturedScreenshot) => {
    const a = document.createElement('a');
    a.href = shot.dataUrl;
    a.download = `android_gesture_screenshot_${shot.id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      {/* Gallery Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <ImageIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              گالری تصاویر اسکرین‌شات ثبت شده با حرکت مشت
              <span className="text-xs bg-indigo-600 text-white font-mono px-2 py-0.5 rounded-full">
                {screenshots.length} تصویر
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              تصاویری که با بستن دست به شکل مشت (✊ Fist) به صورت هوشمند از صفحه ثبت شده‌اند.
            </p>
          </div>
        </div>

        {screenshots.length > 0 && (
          <button
            onClick={onClearAll}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 transition text-xs font-semibold"
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            پاکسازی تمام تصاویر
          </button>
        )}
      </div>

      {/* Grid of Captured Images */}
      {screenshots.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center flex flex-col items-center justify-center gap-3 text-slate-500 shadow-xs">
          <AlertCircle className="w-10 h-10 text-slate-400" />
          <p className="text-sm font-bold text-slate-800">هنوز تصویری ثبت نشده است</p>
          <p className="text-xs text-slate-500 max-w-md leading-relaxed">
            به تب «داشبورد سرویس پس‌زمینه» بروید و روی دکمه «تست مشت (عکس)» کلیک کنید یا جلوی دوربین دست خود را مشت کنید (✊) تا اسکرین‌شات گرفته شود!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {screenshots.map((shot) => (
            <div
              key={shot.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden group hover:border-indigo-400 transition-all shadow-xs flex flex-col"
            >
              <div className="relative aspect-[9/16] bg-slate-100 overflow-hidden cursor-pointer" onClick={() => setSelectedImage(shot)}>
                <img
                  src={shot.dataUrl}
                  alt="اسکرین‌شات دست"
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                />

                <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <span className="p-2.5 rounded-full bg-indigo-600 text-white shadow-md">
                    <Eye className="w-5 h-5" />
                  </span>
                </div>

                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2.5 py-1 rounded-full text-[10px] font-bold text-rose-700 border border-rose-200 shadow-xs flex items-center gap-1">
                  <span>✊ مشت</span>
                </div>
              </div>

              <div className="p-3.5 bg-white flex items-center justify-between border-t border-slate-100 text-xs">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono text-[11px] font-medium">{shot.timestamp}</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => downloadImage(shot)}
                    className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100 transition"
                    title="دانلود تصویر"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteScreenshot(shot.id)}
                    className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 transition"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen Modal View */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm p-4 flex items-center justify-center overflow-auto" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-lg w-full bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">نمایش کامل اسکرین‌شات</h3>
              <button onClick={() => setSelectedImage(null)} className="text-slate-400 hover:text-slate-700 text-xs font-bold">
                بستن (✕)
              </button>
            </div>

            <div className="rounded-xl overflow-hidden bg-slate-50 border border-slate-200 flex justify-center max-h-[70vh]">
              <img src={selectedImage.dataUrl} alt="Screenshot Zoom" className="max-h-[70vh] object-contain" />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500 font-mono">زمان: {selectedImage.timestamp}</span>
              <button
                onClick={() => downloadImage(selectedImage)}
                className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition flex items-center gap-2 shadow-xs"
              >
                <Download className="w-4 h-4" />
                دانلود تصویر PNG
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
