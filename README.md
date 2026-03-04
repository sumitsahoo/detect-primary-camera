<div align="center">
  <h1>📸 Detect Primary Camera</h1>
  <p>A lightweight, zero-dependency library to robustly detect the primary rear camera on mobile devices (📱 iOS & Android).</p>

  ![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/sumitsahoo/detect-primary-camera/publish.yml)
  ![NPM Version](https://img.shields.io/npm/v/detect-primary-camera)
  ![NPM Downloads](https://img.shields.io/npm/dw/detect-primary-camera)
  [![Socket Badge](https://badge.socket.dev/npm/package/detect-primary-camera)](https://badge.socket.dev/npm/package/detect-primary-camera)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

## 💡 The Motivation

Dual-camera, triple-camera, and quad-camera phones expose multiple lenses (ultra-wide, telephoto, macro, infrared) to the browser. This often leads to web applications selecting the wrong or suboptimal camera.

**The Proctored Exam Problem:** I went through this exact issue while appearing for a certification exam. The exam's web app selected my phone's macro lens, making my ID and face blurry and unrecognizable. This frustrating experience led me to build a better, reusable, and fully open-source utility to solve this problem once and for all.

Whether you're building a **barcode scanner**, a **proctored exam interface**, or just a standard photo capture app, this library safely filters and returns the **main/wide camera** that is best suited for the job. 🎯

## ✨ Features

- **Modern Device Support**: Explicitly penalizes ultra-wide, telephoto, and macro lenses which are terrible for general purposes like barcode scanning or exam proctoring. �
- **Cross-Platform**: Handles iOS ("Back Camera") and Android ("camera 0") quirks seamlessly. 🍎🤖
- **Framework Agnostic**: Works perfectly in Vanilla JS/TS, with dedicated hooks available for React and Next.js. ⚛️
- **Caching**: Utility to persist the optimal device ID, speeding up subsequent application loads. 💾
- **Zero Dependencies**: Tiny bundle size to keep your application fast. 🪶

## 📦 Installation

```bash
npm install detect-primary-camera
```

## 🚀 Usage

### Standard JavaScript / TypeScript

```typescript
import { getBestRearCamera, getAndSetBestRearCamera, FACING_MODE } from 'detect-primary-camera';

// Example 1: Get the best camera directly
const cameraId = await getBestRearCamera();
if (cameraId) {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      deviceId: { exact: cameraId }
    }
  });
}

// Example 2: Detect the best camera and cache the result for the next time
const cachedCameraId = await getAndSetBestRearCamera();
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

## 🤝 Contributing

We welcome contributions from the community! Whether it's adding a new feature, fixing a bug, or improving documentation, your help is **greatly appreciated**.

Please see the [CONTRIBUTING.md](CONTRIBUTING.md) file for more information on how to get started, set up your development environment, and submit a Pull Request.

## 📄 License

MIT © [Sumit Sahoo](https://github.com/sumitsahoo)

Please refer to the [LICENSE](./LICENSE) file for the complete license details.
