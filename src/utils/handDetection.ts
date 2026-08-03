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

  // Finger extension checks based on landmark geometry (Tip to Wrist vs PIP to Wrist)
  const isIndexExtended = getDistance3D(indexTip, wrist) > getDistance3D(landmarks[6], wrist) * 1.05;
  const isMiddleExtended = getDistance3D(middleTip, wrist) > getDistance3D(landmarks[10], wrist) * 1.05;
  const isRingExtended = getDistance3D(ringTip, wrist) > getDistance3D(landmarks[14], wrist) * 1.05;
  const isPinkyExtended = getDistance3D(pinkyTip, wrist) > getDistance3D(landmarks[18], wrist) * 1.05;

  const isThumbUp = thumbTip.y < wrist.y && getDistance3D(thumbTip, wrist) / palmScale > 1.1;

  let detectedGesture: GestureType = 'NONE';

  // --- Priority Order Gesture Rules ---

  // 1. PINCH (پینچ شست و اشاره) - Pinch takes priority when thumb & index tips are close
  if (normalizedPinch <= config.pinchThreshold) {
    detectedGesture = 'PINCH';
  }
  // 2. FIST (مشت کامل) - All 4 fingers folded in
  else if (!isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended && fistTightness >= 0.5) {
    detectedGesture = 'FIST';
  }
  // 3. THREE FINGERS (۳ انگشت - اشاره، وسط، انگشتر بالا)
  else if (isIndexExtended && isMiddleExtended && isRingExtended && !isPinkyExtended) {
    detectedGesture = 'THREE_FINGERS';
  }
  // 4. V SIGN (۲ انگشت - اشاره و وسط بالا)
  else if (isIndexExtended && isMiddleExtended && !isRingExtended && !isPinkyExtended) {
    detectedGesture = 'V_SIGN';
  }
  // 5. POINTING (۱ انگشت اشاره بالا)
  else if (isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended) {
    detectedGesture = 'POINTING';
  }
  // 6. THUMBS UP (شست بالا)
  else if (isThumbUp && !isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended) {
    detectedGesture = 'THUMBS_UP';
  }
  // 7. OPEN PALM (کف دست باز - هر چهار انگشت اصلی باز)
  else if (isIndexExtended && isMiddleExtended && isRingExtended && isPinkyExtended) {
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
