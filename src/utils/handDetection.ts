import { LandmarkPoint, GestureType, HandDetectionResult, GestureConfig } from '../types';

// MediaPipe Hand Landmark Connections (21 keypoints skeleton layout)
export const HAND_CONNECTIONS: [number, number][] = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle
  [5, 9], [9, 10], [10, 11], [11, 12],
  // Ring
  [9, 13], [13, 14], [14, 15], [15, 16],
  // Pinky
  [13, 17], [0, 17], [17, 18], [18, 19], [19, 20]
];

// Calculate 3D Euclidean distance between two landmark points
export function getDistance3D(p1: LandmarkPoint, p2: LandmarkPoint): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = (p1.z || 0) - (p2.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// Scale-invariant gesture detection algorithm
export function detectHandGesture(
  landmarks: LandmarkPoint[],
  config: GestureConfig
): { gesture: GestureType; pinchDistance: number; fistTightness: number; rawPinchDistance: number } {
  if (!landmarks || landmarks.length < 21) {
    return { gesture: 'NONE', pinchDistance: 1, fistTightness: 0, rawPinchDistance: 1 };
  }

  const wrist = landmarks[0];
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const middleTip = landmarks[12];
  const ringTip = landmarks[16];
  const pinkyTip = landmarks[20];

  const middleMcp = landmarks[9];

  // Palm scale reference (distance from wrist 0 to middle MCP 9)
  const palmScale = getDistance3D(wrist, middleMcp) || 0.1;

  // 1. Pinch distance (thumb tip 4 to index tip 8) normalized by palm scale
  const rawPinch = getDistance3D(thumbTip, indexTip);
  const normalizedPinch = rawPinch / palmScale;

  // 2. Individual finger extension ratio relative to palm
  const indexDist = getDistance3D(indexTip, wrist) / palmScale;
  const middleDist = getDistance3D(middleTip, wrist) / palmScale;
  const ringDist = getDistance3D(ringTip, wrist) / palmScale;
  const pinkyDist = getDistance3D(pinkyTip, wrist) / palmScale;

  const avgFingerDist = (indexDist + middleDist + ringDist + pinkyDist) / 4;

  // Fist tightness score: 0 (open) to 1 (tight fist)
  // When curled into fist, finger tips are very close to wrist (~0.6 - 0.9 of palm scale)
  const fistTightness = Math.max(0, Math.min(1, (1.8 - avgFingerDist) / 1.0));

  let detectedGesture: GestureType = 'NONE';

  // --- Gesture Rules ---

  // A. Fist Detection (مشت کردن):
  if (fistTightness >= config.fistThreshold) {
    detectedGesture = 'FIST';
  }
  // B. Pinch Detection (پینچ / نزدیک شدن شست و اشاره):
  else if (normalizedPinch <= config.pinchThreshold) {
    detectedGesture = 'PINCH';
  }
  // C. Three Fingers Extended (۳ انگشت - اشاره، وسط، انگشتر):
  else if (indexDist > 1.15 && middleDist > 1.15 && ringDist > 1.15 && pinkyDist < 0.95) {
    detectedGesture = 'THREE_FINGERS';
  }
  // D. V-Sign Detection (۲ انگشت - اشاره و وسط):
  else if (indexDist > 1.15 && middleDist > 1.15 && ringDist < 0.95 && pinkyDist < 0.95) {
    detectedGesture = 'V_SIGN';
  }
  // E. Pointing Detection (۱ انگشت اشاره):
  else if (indexDist > 1.25 && middleDist < 0.95 && ringDist < 0.95 && pinkyDist < 0.95) {
    detectedGesture = 'POINTING';
  }
  // F. Thumbs Up Detection (شست بالا):
  else if (thumbTip.y < wrist.y && getDistance3D(thumbTip, wrist) / palmScale > 1.1 && fistTightness > 0.4) {
    detectedGesture = 'THUMBS_UP';
  }
  // G. Open Palm (کف دست باز):
  else if (avgFingerDist > 1.35) {
    detectedGesture = 'OPEN_PALM';
  }

  return {
    gesture: detectedGesture,
    pinchDistance: Math.min(1, normalizedPinch),
    fistTightness,
    rawPinchDistance: rawPinch
  };
}

// Draw custom stylized skeleton on canvas
export function drawHandSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: LandmarkPoint[],
  canvasWidth: number,
  canvasHeight: number,
  currentGesture: GestureType
) {
  if (!landmarks || landmarks.length === 0) return;

  const getPixelPos = (pt: LandmarkPoint) => ({
    x: pt.x * canvasWidth,
    y: pt.y * canvasHeight
  });

  // Choose stroke theme based on detected gesture
  let connectionColor = 'rgba(99, 102, 241, 0.7)'; // Indigo
  let jointColor = '#818cf8';
  let accentColor = '#6366f1';

  if (currentGesture === 'FIST') {
    connectionColor = 'rgba(239, 68, 68, 0.85)'; // Red for Fist/Screenshot
    jointColor = '#f87171';
    accentColor = '#ef4444';
  } else if (currentGesture === 'PINCH') {
    connectionColor = 'rgba(16, 185, 129, 0.85)'; // Emerald green for Pinch/Scroll
    jointColor = '#34d399';
    accentColor = '#10b981';
  } else if (currentGesture === 'POINTING' || currentGesture === 'V_SIGN') {
    connectionColor = 'rgba(245, 158, 11, 0.85)'; // Amber
    jointColor = '#fbbf24';
  }

  // Draw bone lines
  ctx.lineWidth = 3;
  ctx.strokeStyle = connectionColor;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  HAND_CONNECTIONS.forEach(([startIdx, endIdx]) => {
    const start = getPixelPos(landmarks[startIdx]);
    const end = getPixelPos(landmarks[endIdx]);

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  });

  // Highlight pinch line between Thumb tip (4) and Index tip (8)
  const thumbTipPos = getPixelPos(landmarks[4]);
  const indexTipPos = getPixelPos(landmarks[8]);

  ctx.beginPath();
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = currentGesture === 'PINCH' ? '#10b981' : 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = currentGesture === 'PINCH' ? 4 : 2;
  ctx.moveTo(thumbTipPos.x, thumbTipPos.y);
  ctx.lineTo(indexTipPos.x, indexTipPos.y);
  ctx.stroke();
  ctx.setLineDash([]); // Reset line dash

  // Draw glowing landmark joints
  landmarks.forEach((pt, idx) => {
    const { x, y } = getPixelPos(pt);
    const isTip = [4, 8, 12, 16, 20].includes(idx);
    const isKeyPinchTip = idx === 4 || idx === 8;

    ctx.beginPath();
    const radius = isKeyPinchTip ? 7 : isTip ? 5 : 3.5;
    ctx.arc(x, y, radius, 0, 2 * Math.PI);

    ctx.fillStyle = isKeyPinchTip && currentGesture === 'PINCH' ? '#34d399' : jointColor;
    ctx.fill();

    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
  });
}
