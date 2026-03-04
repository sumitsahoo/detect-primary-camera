# 📸 detect-primary-camera

A lightweight, zero-dependency library to robustly detect the primary rear camera on mobile devices (iOS & Android). 📱

Dual-camera, triple-camera, and quad-camera phones expose multiple lenses (ultra-wide, telephoto, macro, infrared) to the browser. This library uses device labels and capabilities to safely filter and return the **main/wide camera** that is best suited for barcode scanning, photos, etc. 🎯

## 📦 Installation

```bash
npm install detect-primary-camera
```

## 🚀 Usage

```typescript
import { getBestRearCamera, getAndSetCameraIdWithFlash, FACING_MODE } from 'detect-primary-camera';

// Example 1: Get the best camera directly
const cameraId = await getBestRearCamera();
if (cameraId) {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      deviceId: { exact: cameraId }
    }
  });
}

// Example 2: Get and cache the camera in localStorage for faster subsequent loads
const cachedCameraId = await getAndSetCameraIdWithFlash();
```

## ✨ Features
- **Modern Device Support**: Explicitly penalizes ultra-wide, telephoto, and macro lenses which are terrible for general purposes like barcode scanning. 🔍
- **Cross-Platform**: Handles iOS ("Back Camera") and Android ("camera 0") quirks. 🍎🤖
- **Caching**: Utility to persist the optimal device ID. 💾
- **Zero Dependencies**: Tiny bundle size. 🪶

## 📄 License
MIT
