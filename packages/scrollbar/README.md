# @netless/window-manager-scrollbar-extend

A scrollbar extension plugin for [@netless/window-manager](https://github.com/netless-io/window-manager) that provides customizable scrollbars for the main whiteboard view, enabling users to navigate large content areas with intuitive drag-and-drop controls.

## Features

- **🎯 Custom Scrollbars**: Horizontal and vertical scrollbars that automatically appear when content exceeds viewport
- **🖱️ Drag Navigation**: Intuitive drag-and-drop interaction to navigate the whiteboard
- **📏 Auto-sizing**: Scrollbars automatically adjust size based on zoom level and content dimensions
- **🔒 Readonly Mode**: Support for readonly mode where scrollbars are hidden
- **⚙️ Flexible Configuration**: Configurable origin size and readonly state
- **🎨 Styled UI**: Clean, modern scrollbar design with CSS styling

## Installation

```bash
npm install @netless/window-manager-scrollbar-extend
# or
pnpm add @netless/window-manager-scrollbar-extend
# or
yarn add @netless/window-manager-scrollbar-extend
```

## Usage

### Basic Setup

```typescript
import { ExtendScrollbarPlugin } from '@netless/window-manager-scrollbar-extend';

// Create plugin instance
const scrollbarPlugin = new ExtendScrollbarPlugin({
  readonly: false, // Enable scrollbars
  originSize: {
    width: 1920,
    height: 1080
  }
});

// Register with window manager
fastboard.manager.useExtendPlugin(scrollbarPlugin);
```

### Readonly Mode

```typescript
// Create readonly scrollbar plugin (scrollbars will be hidden)
const scrollbarPlugin = new ExtendScrollbarPlugin({
  readonly: true
});

fastboard.manager.useExtendPlugin(scrollbarPlugin);
```

### Dynamic Configuration

```typescript
const scrollbarPlugin = new ExtendScrollbarPlugin();

// Set readonly state dynamically
scrollbarPlugin.setReadonly(true);  // Hide scrollbars
scrollbarPlugin.setReadonly(false); // Show scrollbars

// Set origin size (must be called in writable room)
scrollbarPlugin.setOriginSize({
  width: 2560,
  height: 1440
});
```

### Complete Example

```typescript
import { createFastboard } from '@netless/fastboard';
import { ExtendScrollbarPlugin } from '@netless/window-manager-scrollbar-extend';

const fastboard = await createFastboard({
  // ... your config
});

const scrollbarPlugin = new ExtendScrollbarPlugin({
  readonly: false,
  originSize: {
    width: 1920,
    height: 1080
  }
});

fastboard.manager.useExtendPlugin(scrollbarPlugin);

// Listen for main view mount event
fastboard.manager.emitter.on('onMainViewMounted', (view) => {
  const { width, height } = view.size;
  
  // Set origin size based on view dimensions
  scrollbarPlugin.setOriginSize({ width, height });
});
```

## Configuration Options

### ExtendScrollbarOptions

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `readonly` | `boolean` | `false` | Whether to show scrollbars. When `true`, scrollbars are hidden |
| `originSize` | `{ width: number, height: number }` | `undefined` | The original size of the content area for scrollbar calculations |

## API Reference

### ExtendScrollbarPlugin

#### Methods

- `setReadonly(readonly: boolean)` - Set readonly state dynamically
- `setOriginSize(size: { width: number, height: number })` - Set the origin size for scrollbar calculations (requires writable room)

#### Properties

- `windowManager: WindowManager` - Reference to the window manager instance
- `isWritable: boolean` - Whether the room is writable
- `mainView` - Reference to the main view
- `mainViewElement` - Reference to the main view DOM element

## How It Works

The scrollbar plugin automatically:

1. **Calculates Scroll Range**: Determines the scrollable area based on zoom level and origin size
2. **Shows/Hides Scrollbars**: Displays scrollbars only when content exceeds the viewport
3. **Updates Scrollbar Size**: Adjusts scrollbar thumb size based on the visible content ratio
4. **Handles Drag Events**: Translates drag movements to camera movements for smooth navigation
5. **Respects Boundaries**: Prevents scrolling beyond the content boundaries

## Styling

The plugin includes built-in CSS styles for the scrollbars. You can customize the appearance by overriding the CSS classes:

- `.window-manager-scrollbar-extend-ui-container` - Main container
- `.window-manager-scrollbar-extend-ui-container-x` - Horizontal scrollbar container
- `.window-manager-scrollbar-extend-ui-container-y` - Vertical scrollbar container
- `.window-manager-scrollbar-extend-ui-x` - Horizontal scrollbar thumb
- `.window-manager-scrollbar-extend-ui-y` - Vertical scrollbar thumb

## Requirements

- `@netless/window-manager`: >=1.0.6
- `white-web-sdk`: >=2.16.53

## License

MIT
