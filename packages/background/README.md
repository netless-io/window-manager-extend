# @netless/window-manager-background-extend

A background extension plugin for Netless Window Manager that allows you to set custom background images, colors, and opacity for the main view.

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

// Create plugin instance
const backgroundPlugin = new ExtendBackgroundPlugin();

// Register with window manager
fastboard.manager.useExtendPlugin(backgroundPlugin);
```

### Setting Background Image

```typescript
// Set background image
backgroundPlugin.setBackgroundImage({
  url: "https://example.com/background.jpg",
  width: 1920,
  height: 1080,
  crossOrigin: 'anonymous' // optional
});
```

### Setting Background Color

```typescript
// Set background color
backgroundPlugin.setBackgroundColor('#f0f0f0');
```

### Setting Background Opacity

```typescript
// Set background opacity (0-1)
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

// Listen for main view mount event
fastboard.manager.emitter.on('onMainViewMounted', (view) => {
  const { width, height } = view.size;
  
  // Set background image
  backgroundPlugin.setBackgroundImage({
    url: "https://example.com/background.jpg",
    width,
    height,
    crossOrigin: 'anonymous'
  });
  
  // Or set background color
  backgroundPlugin.setBackgroundColor('#ffffff');
  
  // Or set opacity
  backgroundPlugin.setBackgroundOpacity(0.9);
});
```

## API Reference

### ExtendBackgroundPlugin

#### Methods

- `setBackgroundImage(image: ExtendBackgroundImage)` - Set background image
- `setBackgroundColor(color: string)` - Set background color
- `setBackgroundOpacity(opacity: number)` - Set background opacity (0-1)

#### Types

```typescript
interface ExtendBackgroundImage {
  url: string;           // Image URL
  width: number;         // Image width
  height: number;        // Image height
  crossOrigin?: string;  // Cross-origin setting
}

interface ExtendBackgroundOptions {
  color?: string;        // Background color
  opacity?: number;     // Background opacity (0-1)
  image?: ExtendBackgroundImage; // Background image
}
```

## Events

The plugin emits the following events:

- `loadError` - Emitted when background image fails to load

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
