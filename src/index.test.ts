import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getBestRearCamera, getAndSetBestRearCamera, STORAGE_KEY_CAMERA_ID } from "./index";

describe("Camera Detection", () => {
    let mockGetUserMedia: ReturnType<typeof vi.fn>;
    let mockEnumerateDevices: ReturnType<typeof vi.fn>;
    let mockGetItem: ReturnType<typeof vi.spyOn<Storage, "getItem">>;
    let mockSetItem: ReturnType<typeof vi.spyOn<Storage, "setItem">>;
    let mockRemoveItem: ReturnType<typeof vi.spyOn<Storage, "removeItem">>;

    beforeEach(() => {
        mockGetUserMedia = vi.fn();
        mockEnumerateDevices = vi.fn();

        Object.defineProperty(global, "navigator", {
            value: {
                mediaDevices: {
                    getUserMedia: mockGetUserMedia,
                    enumerateDevices: mockEnumerateDevices,
                },
            },
            writable: true,
        });

        // Use standard Storage.prototype spy in jsdom
        mockGetItem = vi.spyOn(Storage.prototype, "getItem");
        mockSetItem = vi.spyOn(Storage.prototype, "setItem");
        mockRemoveItem = vi.spyOn(Storage.prototype, "removeItem");
    });

    afterEach(() => {
        vi.restoreAllMocks();
        localStorage.clear();
    });

    describe("getBestRearCamera", () => {
        it("should return null if navigator is undefined", async () => {
            Object.defineProperty(global, "navigator", { value: undefined, writable: true });
            expect(await getBestRearCamera()).toBeNull();
        });

        it("should return null if getUserMedia is not available", async () => {
            Object.defineProperty(global, "navigator", {
                value: { mediaDevices: {} },
                writable: true,
            });
            expect(await getBestRearCamera()).toBeNull();
        });

        it("should return null if initial getUserMedia throws (permission denied)", async () => {
            mockGetUserMedia.mockRejectedValueOnce(new Error("Permission denied"));
            expect(await getBestRearCamera()).toBeNull();
        });

        it("should return null if enumerateDevices throws", async () => {
            mockGetUserMedia.mockResolvedValueOnce({ getTracks: () => [] });
            mockEnumerateDevices.mockRejectedValueOnce(new Error("Device error"));
            expect(await getBestRearCamera()).toBeNull();
        });

        it("should return null if no video devices found", async () => {
            mockGetUserMedia.mockResolvedValueOnce({ getTracks: () => [] });
            mockEnumerateDevices.mockResolvedValueOnce([
                { kind: "audioinput", deviceId: "audio1", label: "Microphone" },
            ]);
            expect(await getBestRearCamera()).toBeNull();
        });

        it("should select the best camera based on scoring", async () => {
            mockGetUserMedia.mockResolvedValueOnce({ getTracks: () => [] }); // permission check

            mockEnumerateDevices.mockResolvedValueOnce([
                { kind: "videoinput", deviceId: "front", label: "Front Camera" }, // skipped by fast-path
                { kind: "videoinput", deviceId: "ultra", label: "Ultra Wide Back Camera" }, // penalized
                { kind: "videoinput", deviceId: "main", label: "Back Camera 0" }, // preferred
            ]);

            // Mock stream for "ultra"
            mockGetUserMedia.mockResolvedValueOnce({
                getVideoTracks: () => [
                    {
                        getCapabilities: () => ({}),
                        getSettings: () => ({ facingMode: "environment" }),
                        stop: vi.fn(),
                    },
                ],
                getTracks: () => [{ stop: vi.fn() }],
            });

            // Mock stream for "main"
            mockGetUserMedia.mockResolvedValueOnce({
                getVideoTracks: () => [
                    {
                        getCapabilities: () => ({ torch: true }), // Higher score
                        getSettings: () => ({ facingMode: "environment" }),
                        stop: vi.fn(),
                    },
                ],
                getTracks: () => [{ stop: vi.fn() }],
            });

            const best = await getBestRearCamera();
            expect(best).toBe("main");
        });
    });

    describe("getAndSetBestRearCamera", () => {
        it("should return null if window.localStorage is undefined", async () => {
            Object.defineProperty(global, "window", {
                value: { localStorage: undefined },
                writable: true,
            });
            expect(await getAndSetBestRearCamera()).toBeNull();
            // restore window.localStorage for other tests
            Object.defineProperty(global, "window", { value: global, writable: true });
        });

        it("should return cached camera if it exists and is valid", async () => {
            mockGetItem.mockReturnValueOnce("cached-id");
            mockEnumerateDevices.mockResolvedValueOnce([
                { kind: "videoinput", deviceId: "cached-id", label: "Cached Camera" },
            ]);

            const id = await getAndSetBestRearCamera();
            expect(id).toBe("cached-id");
            expect(mockGetUserMedia).not.toHaveBeenCalled(); // Shouldn't need to run full detection
        });

        it("should detect new camera if cached camera does not exist in devices", async () => {
            mockGetItem.mockReturnValueOnce("cached-id");
            mockEnumerateDevices.mockResolvedValueOnce([
                { kind: "videoinput", deviceId: "other-id", label: "Other Camera" },
            ]);

            // Detection mocks
            mockGetUserMedia.mockResolvedValue({
                getVideoTracks: () => [
                    {
                        getCapabilities: () => ({}),
                        getSettings: () => ({ facingMode: "environment" }),
                        stop: vi.fn(),
                    },
                ],
                getTracks: () => [{ stop: vi.fn() }],
            });
            mockEnumerateDevices.mockResolvedValueOnce([
                { kind: "videoinput", deviceId: "other-id", label: "Other Camera" },
            ]);

            await getAndSetBestRearCamera();

            expect(mockRemoveItem).toHaveBeenCalledWith(STORAGE_KEY_CAMERA_ID);
            expect(mockSetItem).toHaveBeenCalledWith(STORAGE_KEY_CAMERA_ID, "other-id");
        });

        it("should handle localStorage errors gracefully", async () => {
            mockGetItem.mockImplementationOnce(() => {
                throw new Error("Storage denied");
            });
            // Detection mocks
            mockGetUserMedia.mockResolvedValue({
                getVideoTracks: () => [
                    {
                        getCapabilities: () => ({}),
                        getSettings: () => ({ facingMode: "environment" }),
                        stop: vi.fn(),
                    },
                ],
                getTracks: () => [{ stop: vi.fn() }],
            });
            mockEnumerateDevices.mockResolvedValueOnce([
                { kind: "videoinput", deviceId: "new-camera", label: "New Camera" },
            ]);

            const id = await getAndSetBestRearCamera();
            expect(id).toBe("new-camera");
            // mockSetItem might be called, but even if it throws, the error should be caught
        });
    });
});
