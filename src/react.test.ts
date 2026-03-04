import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { usePrimaryCamera } from "./react";
import * as indexModule from "./index";

describe("usePrimaryCamera hook", () => {
    let mockGetBestRearCamera: any;
    let mockGetAndSetBestRearCamera: any;
    let originalWindow: typeof window;
    let originalNavigator: typeof navigator;

    beforeEach(() => {
        originalWindow = global.window;
        originalNavigator = global.navigator;

        // Mock the implementations of the imported functions
        mockGetBestRearCamera = vi.spyOn(indexModule, 'getBestRearCamera');
        mockGetAndSetBestRearCamera = vi.spyOn(indexModule, 'getAndSetBestRearCamera');

        // Default navigator object for SSR checks to pass as "client"
        Object.defineProperty(global, "navigator", {
            value: { mediaDevices: {} },
            writable: true,
        });
    });

    afterEach(() => {
        Object.defineProperty(global, "window", { value: originalWindow, writable: true });
        Object.defineProperty(global, "navigator", { value: originalNavigator, writable: true });
        vi.restoreAllMocks();
    });

    it("should initialize with loading true and cameraId null", async () => {
        mockGetAndSetBestRearCamera.mockResolvedValueOnce(new Promise(() => { })); // Hangs forever

        const { result } = renderHook(() => usePrimaryCamera());

        expect(result.current.loading).toBe(true);
        expect(result.current.cameraId).toBeNull();
        expect(result.current.error).toBeNull();
    });

    it("should handle SSR gracefully", () => {
        Object.defineProperty(global, "navigator", { value: undefined, writable: true });

        const { result } = renderHook(() => usePrimaryCamera());

        expect(result.current.loading).toBe(false);
        expect(result.current.cameraId).toBeNull();
        expect(result.current.error).toBeNull();
    });

    it("should correctly fetch best rear camera with cache (default)", async () => {
        mockGetAndSetBestRearCamera.mockResolvedValueOnce("camera-123");

        const { result } = renderHook(() => usePrimaryCamera());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.cameraId).toBe("camera-123");
        expect(result.current.error).toBeNull();
        expect(mockGetAndSetBestRearCamera).toHaveBeenCalled();
        expect(mockGetBestRearCamera).not.toHaveBeenCalled();
    });

    it("should fetch best rear camera without cache if option is false", async () => {
        mockGetBestRearCamera.mockResolvedValueOnce("camera-456");

        const { result } = renderHook(() => usePrimaryCamera({ useCache: false }));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.cameraId).toBe("camera-456");
        expect(result.current.error).toBeNull();
        expect(mockGetBestRearCamera).toHaveBeenCalled();
        expect(mockGetAndSetBestRearCamera).not.toHaveBeenCalled();
    });

    it("should handle and expose errors properly", async () => {
        const error = new Error("Camera permission denied");
        mockGetAndSetBestRearCamera.mockRejectedValueOnce(error);

        const { result } = renderHook(() => usePrimaryCamera());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.cameraId).toBeNull();
        expect(result.current.error).toBe(error);
    });
});
