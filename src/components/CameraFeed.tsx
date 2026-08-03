import React, { useRef, useEffect, useState, useCallback } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { Camera, RefreshCw, Eye, EyeOff, AlertTriangle, Zap, FlipHorizontal, Play, Pause } from 'lucide-react';
import { GestureConfig, GestureType, HandDetectionResult, LandmarkPoint } from '../types';
import { detectHandGesture, drawHandSkeleton } from '../utils/handDetection';

interface CameraFeedProps {
  config: GestureConfig;
  onGestureDetected: (result: HandDetectionResult) => void;
  isCameraActive: boolean;
  setIsCameraActive: (active: boolean) => void;
  miniMode?: boolean;
}

export const CameraFeed: React.FC<CameraFeedProps> = ({
  config,
  onGestureDetected,
  isCameraActive,
  setIsCameraActive,
  miniMode = false
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [isLoadingModel, setIsLoadingModel] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [fps, setFps] = useState(0);
  const [currentResult, setCurrentResult] = useState<HandDetectionResult | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const lastTimeRef = useRef<number>(performance.now());
  const frameCountRef = useRef<number>(0);

  // Initialize MediaPipe HandLandmarker with fallback resilient loading (GPU -> CPU fallback)
  useEffect(() => {
    let isMounted = true;

    async function initMediaPipe() {
      setIsLoadingModel(true);
      const wasmSources = [
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
        'https://unpkg.com/@mediapipe/tasks-vision@latest/wasm',
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      ];

      const modelSources = [
        'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/hand_landmarker.task'
      ];

      let loadedLandmarker: HandLandmarker | null = null;

      for (const wasmUrl of wasmSources) {
        if (loadedLandmarker) break;
        try {
          const vision = await FilesetResolver.forVisionTasks(wasmUrl);
          if (!isMounted) return;

          for (const modelUrl of modelSources) {
            if (loadedLandmarker) break;
            // 1. Try GPU delegate first
            try {
              loadedLandmarker = await HandLandmarker.createFromOptions(vision, {
                baseOptions: {
                  modelAssetPath: modelUrl,
                  delegate: 'GPU'
                },
                runningMode: 'VIDEO',
                numHands: 1
              });
              console.log('MediaPipe HandLandmarker loaded successfully with GPU delegate.');
            } catch (gpuError) {
              console.warn('GPU delegate failed, falling back to CPU delegate:', gpuError);
              // 2. Fallback to CPU delegate if GPU fails on Android device
              try {
                loadedLandmarker = await HandLandmarker.createFromOptions(vision, {
                  baseOptions: {
                    modelAssetPath: modelUrl,
                    delegate: 'CPU'
                  },
                  runningMode: 'VIDEO',
                  numHands: 1
                });
                console.log('MediaPipe HandLandmarker loaded successfully with CPU delegate.');
              } catch (cpuError) {
                console.warn(`Failed loading model from ${modelUrl} with CPU:`, cpuError);
              }
            }
          }
        } catch (wasmError) {
          console.warn(`WASM resolver failed for ${wasmUrl}:`, wasmError);
        }
      }

      if (isMounted) {
        if (loadedLandmarker) {
          handLandmarkerRef.current = loadedLandmarker;
        } else {
          console.error('All MediaPipe load attempts failed.');
          setCameraError('خطا در بارگذاری مدل هوش مصنوعی. لطفاً اتصال اینترنت خود را در اولین اجرا بررسی کنید.');
        }
        setIsLoadingModel(false);
      }
    }

    initMediaPipe();

    return () => {
      isMounted = false;
      if (handLandmarkerRef.current) {
        handLandmarkerRef.current.close();
      }
    };
  }, []);

  // Start Camera Stream
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 30 }
          },
          audio: false
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setIsCameraActive(true);
        }
      } else {
        setCameraError('مرورگر شما دسترسی به دوربین را پشتیبانی نمی‌کند.');
      }
    } catch (err: unknown) {
      console.warn('Camera access error:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      setCameraError(`خطا در دسترسی به دوربین: ${errMsg}. لطفاً اجازه دسترسی دوربین را بدهید.`);
      setIsCameraActive(false);
    }
  }, [facingMode, setIsCameraActive]);

  // Stop Camera Stream
  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, [setIsCameraActive]);

  useEffect(() => {
    startCamera();

    const handleVisibilityChange = async () => {
      if (document.hidden && videoRef.current && isCameraActive && document.pictureInPictureEnabled && !document.pictureInPictureElement) {
        try {
          await videoRef.current.requestPictureInPicture();
        } catch (e) {
          console.warn('Auto PiP on background exit error:', e);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      stopCamera();
    };
  }, [facingMode, isCameraActive, startCamera, stopCamera]);

  const lastStateUpdateRef = useRef<number>(0);
  const recentGesturesRef = useRef<GestureType[]>([]);
  const lastSmoothedGestureRef = useRef<GestureType>('NONE');

  // Fast 3-frame buffer for instant response with zero flicker
  const getSmoothedGesture = (rawGesture: GestureType): GestureType => {
    recentGesturesRef.current.push(rawGesture);
    if (recentGesturesRef.current.length > 3) {
      recentGesturesRef.current.shift();
    }

    const counts: Record<string, number> = {};
    for (const g of recentGesturesRef.current) {
      counts[g] = (counts[g] || 0) + 1;
    }

    let maxGesture: GestureType = rawGesture;
    let maxCount = 0;
    for (const [g, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        maxGesture = g as GestureType;
      }
    }
    return maxGesture;
  };

  // Main Detection Loop
  const processFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas && video.readyState >= 2) {
      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, width, height);

        // FPS meter
        frameCountRef.current++;
        const now = performance.now();
        if (now - lastTimeRef.current >= 1000) {
          setFps(Math.round((frameCountRef.current * 1000) / (now - lastTimeRef.current)));
          frameCountRef.current = 0;
          lastTimeRef.current = now;
        }

        let landmarks: LandmarkPoint[] = [];
        let handedness: 'Left' | 'Right' = 'Right';
        let confidenceScore = 0;

        if (handLandmarkerRef.current) {
          try {
            const results = handLandmarkerRef.current.detectForVideo(video, now);
            if (results && results.landmarks && results.landmarks.length > 0) {
              const rawLm = results.landmarks[0];
              landmarks = rawLm.map((pt) => ({
                x: config.mirrorCamera ? 1 - pt.x : pt.x,
                y: pt.y,
                z: pt.z
              }));

              if (results.handedness && results.handedness.length > 0) {
                handedness = (results.handedness[0][0].displayName as 'Left' | 'Right') || 'Right';
                confidenceScore = results.handedness[0][0].score || 0.9;
              }
            }
          } catch (e) {
            console.warn('Frame detection error:', e);
          }
        }

        if (landmarks.length >= 21) {
          const gestureEval = detectHandGesture(landmarks, config);
          const smoothedGesture = getSmoothedGesture(gestureEval.gesture);

          const detectionResult: HandDetectionResult = {
            landmarks,
            handedness,
            score: confidenceScore || 0.95,
            gesture: smoothedGesture,
            pinchDistance: gestureEval.pinchDistance,
            fistTightness: gestureEval.fistTightness,
            rawPinchDistance: gestureEval.rawPinchDistance
          };

          // Always call gesture logic handler
          onGestureDetected(detectionResult);

          // Update UI state smoothly (~100ms or when gesture changes)
          const timeSinceLastUpdate = now - lastStateUpdateRef.current;
          if (smoothedGesture !== lastSmoothedGestureRef.current || timeSinceLastUpdate > 100) {
            lastSmoothedGestureRef.current = smoothedGesture;
            lastStateUpdateRef.current = now;
            setCurrentResult(detectionResult);
          }

          if (config.showSkeleton) {
            drawHandSkeleton(ctx, landmarks, width, height, smoothedGesture);
          }
        } else {
          const smoothedGesture = getSmoothedGesture('NONE');
          const emptyResult: HandDetectionResult = {
            landmarks: [],
            handedness: 'Right',
            score: 0,
            gesture: smoothedGesture,
            pinchDistance: 1,
            fistTightness: 0,
            rawPinchDistance: 1
          };

          onGestureDetected(emptyResult);

          const timeSinceLastUpdate = now - lastStateUpdateRef.current;
          if (smoothedGesture !== lastSmoothedGestureRef.current || timeSinceLastUpdate > 100) {
            lastSmoothedGestureRef.current = smoothedGesture;
            lastStateUpdateRef.current = now;
            setCurrentResult(emptyResult);
          }
        }
      }
    }

    if (isCameraActive) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
    }
  }, [config, isCameraActive, onGestureDetected]);

  useEffect(() => {
    if (isCameraActive) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isCameraActive, processFrame]);

  // Simulation Trigger for manual testing
  const triggerSimulation = (gesture: GestureType) => {
    const simResult: HandDetectionResult = {
      landmarks: [],
      handedness: 'Right',
      score: 1.0,
      gesture,
      pinchDistance: gesture === 'PINCH' ? 0.2 : 0.8,
      fistTightness: gesture === 'FIST' ? 0.9 : 0.1,
      rawPinchDistance: gesture === 'PINCH' ? 0.05 : 0.3
    };
    setCurrentResult(simResult);
    onGestureDetected(simResult);
  };

  if (miniMode) {
    return (
      <div className="relative w-full h-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-md group">
        <video
          ref={videoRef}
          playsInline
          muted
          className={`w-full h-full object-cover ${config.mirrorCamera ? 'scale-x-[-1]' : ''}`}
        />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover pointer-events-none" />

        <div className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur px-2 py-0.5 rounded text-[10px] text-emerald-400 font-mono flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
          {currentResult?.gesture !== 'NONE' ? currentResult?.gesture : 'دست آماده'}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-4 border border-slate-800/80 shadow-xl flex flex-col gap-4">
      {/* Viewfinder Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              استریم زنده دوربین و تشخیص اسکلت دست
              <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
                {fps} FPS
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              MediaPipe Hand Landmarker • پردازش ۲۱ نقطه مفاصل با هوش مصنوعی در مرورگر
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {document.pictureInPictureEnabled && (
            <button
              onClick={async () => {
                if (!videoRef.current) return;
                try {
                  if (document.pictureInPictureElement) {
                    await document.exitPictureInPicture();
                  } else {
                    await videoRef.current.requestPictureInPicture();
                  }
                } catch (e) {
                  console.warn('PiP launch error:', e);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 transition text-xs font-bold border border-indigo-500/40 shadow-xs"
              title="شناور کردن دوربین روی تمام برنامه‌ها مثل اینستاگرام"
            >
              <Eye className="w-3.5 h-3.5 text-indigo-400" />
              حباب شناور دوربین (PiP)
            </button>
          )}

          <button
            onClick={() => setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition text-xs font-medium border border-slate-700"
            title="تغییر دوربین جلو / عقب"
          >
            <FlipHorizontal className="w-3.5 h-3.5" />
            {facingMode === 'user' ? 'دوربین سلفی' : 'دوربین اصلی'}
          </button>

          {isCameraActive ? (
            <button
              onClick={stopCamera}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600/20 text-rose-300 hover:bg-rose-600/30 transition text-xs font-medium border border-rose-500/30"
            >
              <Pause className="w-3.5 h-3.5" />
              توقف دوربین
            </button>
          ) : (
            <button
              onClick={startCamera}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition text-xs font-medium shadow-md shadow-emerald-600/20"
            >
              <Play className="w-3.5 h-3.5" />
              شروع دوربین
            </button>
          )}
        </div>
      </div>

      {/* Video Viewfinder Container */}
      <div className="relative w-full aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center">
        {isLoadingModel && (
          <div className="absolute inset-0 z-20 bg-slate-950/90 backdrop-blur flex flex-col items-center justify-center gap-3 text-slate-300">
            <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
            <p className="text-xs font-medium text-indigo-300">در حال بارگذاری مدل پردازش مفاصل دست (MediaPipe)...</p>
          </div>
        )}

        {cameraError && (
          <div className="absolute inset-0 z-20 bg-slate-950/95 p-6 flex flex-col items-center justify-center text-center gap-3 text-rose-300">
            <AlertTriangle className="w-10 h-10 text-rose-500 animate-bounce" />
            <p className="text-sm font-bold">{cameraError}</p>
            <button
              onClick={startCamera}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-500 transition"
            >
              تلاش مجدد اتصال به دوربین
            </button>
          </div>
        )}

        <video
          ref={videoRef}
          playsInline
          muted
          className={`w-full h-full object-cover ${config.mirrorCamera ? 'scale-x-[-1]' : ''}`}
        />

        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover pointer-events-none" />

        {/* Live HUD Overlay Badge */}
        {currentResult && currentResult.gesture !== 'NONE' && (
          <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur-md border border-indigo-500/40 px-3.5 py-2 rounded-xl shadow-lg flex items-center gap-2 animate-pulse">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-white">
              حرکت شناسایی‌شده:
              <strong className="text-indigo-400 mr-1">
                {currentResult.gesture === 'FIST'
                  ? '✊ مشت (اسکرین‌شات)'
                  : currentResult.gesture === 'PINCH'
                  ? '🤏 پینچ شست و اشاره (اسکرول پایین)'
                  : currentResult.gesture === 'THREE_FINGERS'
                  ? '🖐️ ۳ انگشت اشاره (اسکرول بالا)'
                  : currentResult.gesture === 'V_SIGN'
                  ? '✌️ علامت V دو انگشت (چراغ‌قوه)'
                  : currentResult.gesture === 'POINTING'
                  ? '👆 یک انگشت اشاره (افزایش صدا)'
                  : currentResult.gesture === 'THUMBS_UP'
                  ? '👍 شست بالا (اینستاگرام)'
                  : currentResult.gesture}
              </strong>
            </span>
          </div>
        )}

        {/* Manual Gesture Simulation Bar (For testing without camera) */}
        <div className="absolute bottom-3 inset-x-3 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-2.5 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-slate-300 text-[11px] font-medium flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            تست مستقیم حرکات:
          </span>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => triggerSimulation('FIST')}
              className="px-2.5 py-1 rounded-lg bg-rose-600/20 border border-rose-500/30 text-rose-300 hover:bg-rose-600/40 transition font-medium text-[11px] flex items-center gap-1"
            >
              ✊ مشت (عکس)
            </button>

            <button
              onClick={() => triggerSimulation('PINCH')}
              className="px-2.5 py-1 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-600/40 transition font-medium text-[11px] flex items-center gap-1"
            >
              🤏 پینچ (اسکرول پایین)
            </button>

            <button
              onClick={() => triggerSimulation('THREE_FINGERS')}
              className="px-2.5 py-1 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/40 transition font-medium text-[11px] flex items-center gap-1"
            >
              🖐️ ۳ انگشت (اسکرول بالا)
            </button>

            <button
              onClick={() => triggerSimulation('V_SIGN')}
              className="px-2.5 py-1 rounded-lg bg-amber-600/20 border border-amber-500/30 text-amber-300 hover:bg-amber-600/40 transition font-medium text-[11px] flex items-center gap-1"
            >
              ✌️ V (چراغ‌قوه)
            </button>

            <button
              onClick={() => triggerSimulation('POINTING')}
              className="px-2.5 py-1 rounded-lg bg-sky-600/20 border border-sky-500/30 text-sky-300 hover:bg-sky-600/40 transition font-medium text-[11px] flex items-center gap-1"
            >
              👆 اشاره (افزایش صدا)
            </button>
          </div>
        </div>
      </div>

      {/* Realtime Metrics Gauges */}
      {currentResult && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Pinch Distance Gauge */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="text-slate-400 font-medium">فاصله شست و اشاره (پینچ):</span>
              <span className="font-mono text-emerald-400 font-bold">
                {(currentResult.pinchDistance * 100).toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden relative">
              <div
                className="bg-emerald-500 h-full transition-all duration-75 rounded-full"
                style={{ width: `${Math.min(100, currentResult.pinchDistance * 100)}%` }}
              />
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-amber-400"
                style={{ left: `${config.pinchThreshold * 100}%` }}
                title="حد آستانه پینچ"
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>بسته (پینچ کامل)</span>
              <span>حد آستانه ({Math.round(config.pinchThreshold * 100)}%)</span>
              <span>باز</span>
            </div>
          </div>

          {/* Fist Tightness Gauge */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="text-slate-400 font-medium">میزان جمع شدن مشت (Fist):</span>
              <span className="font-mono text-rose-400 font-bold">
                {(currentResult.fistTightness * 100).toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden relative">
              <div
                className="bg-rose-500 h-full transition-all duration-75 rounded-full"
                style={{ width: `${Math.min(100, currentResult.fistTightness * 100)}%` }}
              />
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-amber-400"
                style={{ left: `${config.fistThreshold * 100}%` }}
                title="حد آستانه مشت"
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>دست باز</span>
              <span>حد آستانه ({Math.round(config.fistThreshold * 100)}%)</span>
              <span>مشت محکم</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
