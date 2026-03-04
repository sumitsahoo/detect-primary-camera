import { STORAGE_KEY_CAMERA_ID } from './constants';
export * from './constants';
export * from './utils';

/**
 * Determine the best rear camera for scanning based on various criteria
 * Works across Android and iOS devices with multiple cameras.
 * Heavily penalizes ultra-wide, telephoto, macro, depth, and infrared lenses.
 *
 * @returns Device ID of the best main rear camera or null
 */
export const getBestRearCamera = async (): Promise<string | null> => {
    // SSR check
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        return null;
    }

    // Request global permissions first so device labels are populated
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        for (const track of stream.getTracks()) {
            track.stop();
        }
    } catch (err) {
        console.warn('Camera permission denied or not available', err);
        return null;
    }

    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter((device) => device.kind === 'videoinput');

    if (videoDevices.length === 0) return null;

    let bestCamera: string | null = null;
    let bestScore = -1;

    for (const device of videoDevices) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: { exact: device.deviceId } },
            });

            const videoTrack = stream.getVideoTracks()[0];

            // We check capabilities heavily for focal length and focus distance 
            // where available (Chrome Android mostly)
            const capabilities = videoTrack.getCapabilities?.() as MediaTrackCapabilities & {
                torch?: boolean;
                focusDistance?: { min: number; max: number; step: number };
                zoom?: { min: number; max: number; step: number };
            } | undefined ?? {};

            const settings = videoTrack.getSettings();

            // Stop the stream immediately
            for (const track of stream.getTracks()) {
                track.stop();
            }

            // Skip front-facing cameras explicitly
            if (settings.facingMode === 'user') continue;

            let score = 0;
            const label = device.label.toLowerCase();

            // Priority 1: Label matching
            if (
                label.includes('back camera') &&
                !label.includes('ultra') &&
                !label.includes('telephoto')
            ) {
                score += 100;
            } else if (label.includes('wide') && !label.includes('ultra')) {
                score += 100;
            } else if (label.match(/camera\s*0|main/i)) {
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
            if (settings.facingMode === 'environment') {
                score += 20;
            }

            // Penalty: Avoid non-main cameras strictly
            if (
                label.includes('ultra') ||
                label.includes('telephoto') ||
                label.includes('tele') ||
                label.includes('macro') ||
                label.includes('depth') ||
                label.includes('infrared')
            ) {
                score -= 200;
            }

            // Additional filtering via capabilities if available on standard modern browsers
            // Macro lenses often have very short max focus distance.
            // Ultra wides might have very low min zoom.
            // The exact ranges vary wildly by vendor, so we stick to label + torch heavily.

            if (score > bestScore) {
                bestScore = score;
                bestCamera = device.deviceId;
            }
        } catch {
            // Camera not accessible or permission denied for this specific one
            console.warn(`Could not access camera: ${device.label}`);
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
    if (typeof window === 'undefined' || !window.localStorage) {
        return null;
    }

    let cameraId = localStorage.getItem(STORAGE_KEY_CAMERA_ID);
    if (!cameraId) {
        cameraId = await getBestRearCamera();
        if (cameraId) {
            localStorage.setItem(STORAGE_KEY_CAMERA_ID, cameraId);
        }
    }
    return cameraId;
};
