<div align="center">
  <h1>📸 detect-primary-camera</h1>
  <p>A lightweight, zero-dependency library to robustly detect the primary rear camera on mobile devices (iOS & Android). 📱 Dual-camera, triple-camera, and quad-camera phones expose multiple lenses (ultra-wide, telephoto, macro, infrared) to the browser. This library uses device labels and capabilities to safely filter and return the **main/wide camera** that is best suited for barcode scanning, photos, etc. 🎯</p>

  ![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/sumitsahoo/detect-primary-camera/publish.yml)
  ![NPM Version](https://img.shields.io/npm/v/detect-primary-camera)
  ![NPM Downloads](https://img.shields.io/npm/dw/detect-primary-camera)
  [![Socket Badge](https://badge.socket.dev/npm/package/detect-primary-camera)](https://badge.socket.dev/npm/package/detect-primary-camera)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>




## 📦 Installation

```bash
npm install detect-primary-camera
```

## 🚀 Usage

### Standard JavaScript / TypeScript

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

### React / Next.js

For React applications, a dedicated hook is provided to handle resolution state and cleanup automatically.

```tsx
import { usePrimaryCamera } from 'detect-primary-camera/react';

const CameraComponent = () => {
    // Automatically uses cached IDs and handles loading/error states cleanly!
    const { cameraId, loading, error } = usePrimaryCamera();

    if (loading) return <div>Detecting camera...</div>;
    if (error) return <div>Error: {error.message}</div>;

    return <video autoPlay playsInline muted id={cameraId} />;
};
```

## ✨ Features
- **Modern Device Support**: Explicitly penalizes ultra-wide, telephoto, and macro lenses which are terrible for general purposes like barcode scanning. 🔍
- **Cross-Platform**: Handles iOS ("Back Camera") and Android ("camera 0") quirks. 🍎🤖
- **Caching**: Utility to persist the optimal device ID. 💾
- **Zero Dependencies**: Tiny bundle size. 🪶

## 📄 License
[MIT](LICENSE)
