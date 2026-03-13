# @netless/window-manager-background-extend

A background extension plugin for Netless Window Manager that lets you set custom background images, colors, and opacity for the main view. The background scales and pans in sync with the main whiteboard view.

## Installation

```bash
npm install @netless/window-manager-background-extend
# or
pnpm add @netless/window-manager-background-extend
# or
yarn add @netless/window-manager-background-extend
```

## Usage

### Basic Setup

```typescript
import { ExtendBackgroundPlugin } from '@netless/window-manager-background-extend';

// Create plugin instance (optional initial options)
const backgroundPlugin = new ExtendBackgroundPlugin({
  color: '#f0f0f0',
  opacity: 0.9,
});

// Register with window manager
fastboard.manager.useExtendPlugin(backgroundPlugin);
```

### Setting Origin Bound (required for background image)

Before using a background image, you must set the main view’s origin size and scale so the image scales and pans correctly with the camera. Typically call this once when the main view is mounted or rebound.

```typescript
// Set after main view is mounted
fastboard.manager.emitter.on('onMainViewMounted', (view) => {
  const { width, height } = view.size;
  backgroundPlugin.setOriginBound({
    width,
    height,
    scale: 1,
  });
});
```

### Setting Background Image

```typescript
// Set background image (only url required, crossOrigin optional)
backgroundPlugin.setBackgroundImage({
  url: 'https://example.com/background.jpg',
  crossOrigin: 'anonymous', // optional, for cross-origin images
});
```

> **Note:** The background image is only rendered after `setOriginBound` has been called. All `set*` methods must be called in a **writable** room or they will throw.

### Setting Background Color

```typescript
backgroundPlugin.setBackgroundColor('#f0f0f0');
```

### Setting Background Opacity

```typescript
// Set overall background layer opacity (0–1)
backgroundPlugin.setBackgroundOpacity(0.8);
```

### Complete Example

```typescript
import { createFastboard } from '@netless/fastboard';
import { ExtendBackgroundPlugin } from '@netless/window-manager-background-extend';

const fastboard = await createFastboard({
  // ... your config
});

const backgroundPlugin = new ExtendBackgroundPlugin();
fastboard.manager.useExtendPlugin(backgroundPlugin);

fastboard.manager.emitter.on('onMainViewMounted', (view) => {
  const { width, height } = view.size;

  // 1. Set origin bound first (required when using background image)
  backgroundPlugin.setOriginBound({ width, height, scale: 1 });

  // 2. Set background image
  backgroundPlugin.setBackgroundImage({
    url: 'https://example.com/background.jpg',
    crossOrigin: 'anonymous',
  });

  // Or set background color
  backgroundPlugin.setBackgroundColor('#ffffff');

  // Or set opacity
  backgroundPlugin.setBackgroundOpacity(0.9);
});
```

## API Reference

### ExtendBackgroundPlugin

#### Constructor

- `new ExtendBackgroundPlugin(options?: ExtendBackgroundOptions)`  
  Optionally pass initial background options (color, opacity, image, originBound, etc.).

#### Methods

- `setOriginBound(bound: { width: number; height: number; scale: number })`  
  Set the main view origin size and scale. Must be called before using a background image. Requires a writable room.

- `setBackgroundImage(image?: ExtendBackgroundImage)`  
  Set or clear the background image. Requires a writable room; the image is only shown after `setOriginBound` has been called.

- `setBackgroundColor(color: string)`  
  Set the background color. Requires a writable room.

- `setBackgroundOpacity(opacity: number)`  
  Set the background layer opacity (0–1). Requires a writable room.

> All `set*` methods throw if the room is not writable.

#### Types

```typescript
interface ExtendBackgroundImage {
  url: string;           // Image URL
  crossOrigin?: string;  // Optional, e.g. 'anonymous'
}

interface ExtendBackgroundOptions {
  color?: string;        // Background color
  opacity?: number;      // Background opacity (0–1)
  image?: ExtendBackgroundImage; // Background image
  originBound?: {        // Main view origin size (affects image scale/pan)
    width: number;
    height: number;
    scale: number;
  };
}
```

## Events

- `loadError` — Emitted when the background image fails to load. Callback receives the image `url`.

```typescript
backgroundPlugin.on('loadError', (url) => {
  console.error('Failed to load background image:', url);
});
```

## Requirements

- `@netless/window-manager`: >=1.0.6
- `white-web-sdk`: >=2.16.53

## License

MIT
