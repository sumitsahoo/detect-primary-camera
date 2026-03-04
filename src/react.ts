import { useState, useEffect } from "react";
import { getBestRearCamera, getAndSetBestRearCamera } from "./index";

interface UsePrimaryCameraOptions {
  /**
   * Whether to use localStorage to cache the discovered camera ID.
   * Defaults to true for better performance on subsequent loads.
   */
  useCache?: boolean;
}

export const usePrimaryCamera = (options: UsePrimaryCameraOptions = {}) => {
  const { useCache = true } = options;

  const [cameraId, setCameraId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initializeCamera = async () => {
      try {
        setLoading(true);
        setError(null);

        const id = useCache ? await getAndSetBestRearCamera() : await getBestRearCamera();

        if (isMounted) {
          setCameraId(id);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (typeof navigator !== "undefined") {
      initializeCamera();
    } else {
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [useCache]);

  return { cameraId, loading, error };
};
