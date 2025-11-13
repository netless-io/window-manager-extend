# @netless/window-manager-wheel-extend

A wheel (mouse scroll) extension plugin for [@netless/window-manager](https://github.com/netless-io/window-manager) that enables mouse wheel scrolling for the whiteboard main view and supported applications, providing smooth navigation through content.

## Features

- **🖱️ Mouse Wheel Scrolling**: Enable mouse wheel to scroll the whiteboard main view
- **📱 App Support**: Support wheel scrolling for specific app types (Presentation, DocsViewer, Slide)
- **🔒 Readonly Mode**: Support for readonly mode where wheel scrolling is disabled
- **📏 Scroll Boundaries**: Configurable scroll boundaries based on origin view size
- **⚡ Interrupter**: Customizable interrupter function to control when to prevent whiteboard scrolling
- **🎯 Flexible Configuration**: Configurable container, active app kinds, and scroll behavior

## Installation

```bash
npm install @netless/window-manager-wheel-extend
# or
pnpm add @netless/window-manager-wheel-extend
# or
yarn add @netless/window-manager-wheel-extend
```

## Usage

### Basic Setup

```typescript
import { ExtendWheelPlugin } from '@netless/window-manager-wheel-extend';

// Create plugin instance
const wheelPlugin = new ExtendWheelPlugin({
  readonly: false,
  activeKinds: ['Presentation', 'DocsViewer', 'Slide'],
  container: document.body
});

// Register with window manager
fastboard.manager.useExtendPlugin(wheelPlugin);
```

### Readonly Mode

```typescript
// Create readonly wheel plugin (wheel scrolling will be disabled)
const wheelPlugin = new ExtendWheelPlugin({
  readonly: true,
  activeKinds: ['Presentation', 'DocsViewer', 'Slide']
});

fastboard.manager.useExtendPlugin(wheelPlugin);
```

### With Scroll Boundaries

```typescript
const { width, height } = fastboard.manager.mainView.size;
const { scale } = fastboard.manager.mainView.camera;

const wheelPlugin = new ExtendWheelPlugin({
  readonly: false,
  activeKinds: ['Presentation', 'DocsViewer', 'Slide'],
  originMainViewBound: {
    width,
    height,
    scale
  }
});

fastboard.manager.useExtendPlugin(wheelPlugin);
```

### With Interrupter

```typescript
const wheelPlugin = new ExtendWheelPlugin({
  readonly: false,
  activeKinds: ['Presentation', 'DocsViewer', 'Slide'],
  interrupter: (e: WheelEvent) => {
    // Return true to prevent whiteboard scrolling
    // Return false to allow whiteboard scrolling
    const target = e.target as HTMLElement;
    if (target.closest('.custom-scrollable-area')) {
      return true; // Prevent whiteboard scroll when scrolling custom area
    }
    return false; // Allow whiteboard scroll
  }
});

fastboard.manager.useExtendPlugin(wheelPlugin);
```

### Dynamic Configuration

```typescript
const wheelPlugin = new ExtendWheelPlugin({
  readonly: true,
  activeKinds: ['Presentation', 'DocsViewer']
});

fastboard.manager.useExtendPlugin(wheelPlugin);

// Set readonly state dynamically
wheelPlugin.setReadonly(false); // Enable wheel scrolling
wheelPlugin.setReadonly(true);  // Disable wheel scrolling

// Set origin main view bound
wheelPlugin.setOriginMainViewBound({
  width: 1920,
  height: 1080,
  scale: 1
});

// Set interrupter dynamically
wheelPlugin.setInterrupter((e: WheelEvent) => {
  // Your custom logic
  return false;
});

// Remove interrupter (allow all scrolling)
wheelPlugin.setInterrupter(undefined);
```

### Complete Example

```typescript
import { createFastboard } from '@netless/fastboard';
import { ExtendWheelPlugin } from '@netless/window-manager-wheel-extend';

const fastboard = await createFastboard({
  // ... your config
});

// Initialize wheel plugin
const wheelPlugin = new ExtendWheelPlugin({
  readonly: true,
  activeKinds: ['Presentation', 'DocsViewer', 'Slide'],
  container: document.body
});

fastboard.manager.useExtendPlugin(wheelPlugin);

// Set origin bound when main view is ready
if (fastboard.manager) {
  const { width, height } = fastboard.manager.mainView.size;
  const { scale } = fastboard.manager.mainView.camera;
  
  wheelPlugin.setOriginMainViewBound({
    width,
    height,
    scale
  });
  
  // Enable wheel scrolling if user has write permission
  if (fastboard.room.isWritable) {
    wheelPlugin.setReadonly(false);
  }
}
```

## Configuration Options

### ExtendWheelOptions

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `readonly` | `boolean` | `false` | Whether to enable wheel scrolling. When `true`, wheel scrolling is disabled |
| `activeKinds` | `string[]` | **Required** | Array of app kinds that support wheel scrolling (e.g., `['Presentation', 'DocsViewer', 'Slide']`) |
| `container` | `HTMLElement` | `undefined` | Container element to attach wheel event listener. Defaults to `windowManagerContainer` |
| `originMainViewBound` | `{ width: number, height: number, scale: number }` | `undefined` | Original main view size and scale for calculating scroll boundaries |
| `interrupter` | `(e: WheelEvent) => boolean` | `undefined` | Function to determine whether to prevent whiteboard scrolling. Returns `true` to prevent, `false` to allow |

## API Reference

### ExtendWheelPlugin

#### Methods

- `setReadonly(readonly: boolean)` - Set readonly state dynamically. When `true`, disables wheel scrolling
- `setOriginMainViewBound(bound: { width: number, height: number, scale: number })` - Set the origin main view bound for scroll boundary calculations
- `setInterrupter(interrupter?: (e: WheelEvent) => boolean)` - Set or remove the interrupter function. Pass `undefined` to remove

#### Properties

- `windowManager: WindowManager` - Reference to the window manager instance
- `container: HTMLElement | undefined` - Container element for wheel events
- `isWritable: boolean` - Whether the room is writable
- `mainView` - Reference to the main view
- `mainViewElement` - Reference to the main view DOM element
- `focusedView: View` - Currently focused view
- `focusedId: string` - ID of the currently focused view
- `activeKinds: string[]` - Array of app kinds that support wheel scrolling

## How It Works

The wheel plugin:

1. **Listens for Wheel Events**: Attaches wheel event listener to the specified container (or window manager container)
2. **Checks Interrupter**: If an interrupter is set, calls it to determine whether to prevent scrolling
3. **Handles App Scrolling**: If a focused app matches `activeKinds`, uses app-specific scrolling methods:
   - `Presentation`: Uses `moveCamera` method
   - `Slide`: Uses `translateView` method
4. **Handles Main View Scrolling**: Scrolls the main view camera based on wheel delta values
5. **Respects Boundaries**: If `originMainViewBound` is set, calculates and enforces scroll boundaries
6. **Prevents Default**: Prevents default browser scrolling behavior when appropriate

## Supported App Types

The plugin supports wheel scrolling for the following app kinds:

- **Presentation** (`@netless/app-presentation`): Uses `moveCamera` to scroll the presentation
- **DocsViewer**: Uses `moveCamera` to scroll the document viewer
- **Slide** (`@netless/app-slide`): Uses `translateView` to scroll the slide

## Requirements

- `@netless/window-manager`: >=1.0.6
- `white-web-sdk`: >=2.16.53
- `@netless/app-presentation`: >=0.1.9-beta.8 (optional, for Presentation support)
- `@netless/app-slide`: >=0.2.87-beta.0 (optional, for Slide support)

## License

MIT


