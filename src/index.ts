import { STORAGE_KEY_CAMERA_ID } from "./constants";
export * from "./constants";
export * from "./utils";

/**
 * Determine the best rear camera for scanning based on various criteria
 * Works across Android and iOS devices with multiple cameras.
 * Heavily penalizes ultra-wide, telephoto, macro, depth, and infrared lenses.
 *
 * @returns Device ID of the best main rear camera or null
 */
export const getBestRearCamera = async (): Promise<string | null> => {
  // SSR check
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return null;
  }

  // Request global permissions first so device labels are populated.
  // Use facingMode: environment so the rear camera privacy indicator activates instead of front.
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
    });
    for (const track of stream.getTracks()) {
      track.stop();
    }
  } catch (err) {
    console.warn("Camera permission denied or not available", err);
    return null;
  }

  const devices = await navigator.mediaDevices.enumerateDevices();
  const videoDevices = devices.filter((device) => device.kind === "videoinput");

  if (videoDevices.length === 0) return null;

  let bestCamera: string | null = null;
  let bestScore = -1;

  for (const device of videoDevices) {
    const labelLower = device.label.toLowerCase();

    // Fast-path exclusion: If the label is extremely clearly not what we want,
    // don't even open the stream to inspect it (saves significant time).
    if (
      labelLower.includes("front") ||
      labelLower.includes("user") ||
      labelLower.includes("infrared") ||
      labelLower.includes("depth") ||
      labelLower.includes("telephoto") ||
      labelLower.includes("macro") ||
      labelLower.includes("ultra")
    ) {
      // Depending heavily on standard labels to skip slow initialization
      // If the label is empty (bad permissions), it won't trigger this fast path.
      if (labelLower) {
        continue;
      }
    }

    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: device.deviceId } },
      });

      const videoTrack = stream.getVideoTracks()[0];

      // We check capabilities heavily for focal length and focus distance
      // where available (Chrome Android mostly)
      const capabilities =
        (videoTrack.getCapabilities?.() as
          | (MediaTrackCapabilities & {
              torch?: boolean;
              focusDistance?: { min: number; max: number; step: number };
              zoom?: { min: number; max: number; step: number };
            })
          | undefined) ?? {};

      const settings = videoTrack.getSettings();

      // Skip front-facing cameras explicitly
      if (settings.facingMode === "user") continue;

      let score = 0;

      // Priority 1: Label matching
      if (
        labelLower.includes("back camera") &&
        !labelLower.includes("ultra") &&
        !labelLower.includes("telephoto")
      ) {
        score += 100;
      } else if (labelLower.includes("wide") && !labelLower.includes("ultra")) {
        score += 100;
      } else if (labelLower.match(/camera\s*0|main/i)) {
        score += 100;
      }

      // Priority 2: Technical/Hardware indicators (Torch strongly correlates with main lens)
      if (capabilities.torch) {
        score += 50;
      }

      // Priority 3: Resolution
      if (capabilities.width?.max) {
        score += Math.min(capabilities.width.max / 100, 30);
      }

      // Priority 4: Facing Mode explicitly environment
      if (settings.facingMode === "environment") {
        score += 20;
      }

      // Penalty: Avoid non-main cameras strictly
      if (
        labelLower.includes("ultra") ||
        labelLower.includes("telephoto") ||
        labelLower.includes("tele") ||
        labelLower.includes("macro") ||
        labelLower.includes("depth") ||
        labelLower.includes("infrared")
      ) {
        score -= 200;
      }

      if (score > bestScore) {
        bestScore = score;
        bestCamera = device.deviceId;
      }
    } catch {
      // Camera not accessible or permission denied for this specific one
      console.warn(`Could not access camera: ${device.label}`);
    } finally {
      // Resource Leak Prevention: ALWAYS stop the stream even if an error occurs earlier
      if (stream) {
        for (const track of stream.getTracks()) {
          track.stop();
        }
      }
    }
  }

  return bestCamera;
};

/**
 * Get best rear camera ID from localStorage or detect it
 * Caches the result in localStorage for future use
 * @returns Cached or newly detected camera ID
 */
export const getAndSetCameraIdWithFlash = async (): Promise<string | null> => {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }

  let cameraId = localStorage.getItem(STORAGE_KEY_CAMERA_ID);

  // Validate that the cached camera ID still translates to physically present hardware
  if (cameraId && typeof navigator !== "undefined" && navigator.mediaDevices) {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const exists = devices.some((d) => d.deviceId === cameraId && d.kind === "videoinput");
      if (!exists) {
        cameraId = null;
        localStorage.removeItem(STORAGE_KEY_CAMERA_ID);
      }
    } catch (_e) {
      // If enumerateDevices fails, assume cache is invalid to be safe
      cameraId = null;
    }
  }

  if (!cameraId) {
    cameraId = await getBestRearCamera();
    if (cameraId) {
      localStorage.setItem(STORAGE_KEY_CAMERA_ID, cameraId);
    }
  }
  return cameraId;
};
