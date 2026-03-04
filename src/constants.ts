export const STORAGE_KEY_CAMERA_ID = "preferred_camera_id";

export const FACING_MODE = {
  USER: "user",
  ENVIRONMENT: "environment",
} as const;

export type FacingMode = (typeof FACING_MODE)[keyof typeof FACING_MODE];
