/**
 * Detect if the current device is a mobile phone or tablet
 * @returns True if device is a phone/tablet
 */
export const isPhone = (): boolean =>
  typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
