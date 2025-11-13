# @netless/window-manager-maths-kit-extend

A mathematics toolkit extension plugin for [@netless/window-manager](https://github.com/netless-io/window-manager) that enables mathematical tools and annotations on the whiteboard main view and supported applications, providing rich mathematical expression capabilities.

## Features

- **📐 Mathematical Tools**: Enable mathematical tools and annotations on whiteboard views
- **🎨 Theme Support**: Support light and dark themes
- **📱 Multi-View Support**: Support binding to main view and application views
- **🔒 Readonly Mode**: Support for readonly mode where mathematical tools are disabled
- **🔄 State Synchronization**: Automatic state synchronization across all connected clients
- **📊 Camera Sync**: Automatic camera scale synchronization with view camera updates
- **⚡ Dynamic Management**: Create, update, and remove mathematical tools dynamically

## Installation

```bash
npm install @netless/window-manager-maths-kit-extend
# or
pnpm add @netless/window-manager-maths-kit-extend
# or
yarn add @netless/window-manager-maths-kit-extend
```

## Usage

### Basic Setup

```typescript
import { ExtendMathsKitPlugin } from '@netless/window-manager-maths-kit-extend';

// Create plugin instance
const mathsKitPlugin = new ExtendMathsKitPlugin({
  readonly: false,
  bindMainView: true,
  bindAppViews: false,
  theme: 'light'
});

// Register with window manager
fastboard.manager.useExtendPlugin(mathsKitPlugin);
```

### Readonly Mode

```typescript
// Create readonly maths kit plugin (mathematical tools will be disabled)
const mathsKitPlugin = new ExtendMathsKitPlugin({
  readonly: true,
  bindMainView: true,
  bindAppViews: false
});

fastboard.manager.useExtendPlugin(mathsKitPlugin);
```

### With Theme

```typescript
const mathsKitPlugin = new ExtendMathsKitPlugin({
  readonly: false,
  bindMainView: true,
  bindAppViews: false,
  theme: 'dark' // or 'light'
});

fastboard.manager.useExtendPlugin(mathsKitPlugin);
```

### Binding App Views

```typescript
const mathsKitPlugin = new ExtendMathsKitPlugin({
  readonly: false,
  bindMainView: true,
  bindAppViews: true // Enable mathematical tools for all app views
});

fastboard.manager.useExtendPlugin(mathsKitPlugin);
```

### Dynamic Configuration

```typescript
const mathsKitPlugin = new ExtendMathsKitPlugin({
  readonly: true,
  bindMainView: true,
  bindAppViews: false
});

fastboard.manager.useExtendPlugin(mathsKitPlugin);

// Set readonly state dynamically
mathsKitPlugin.setReadonly(false); // Enable mathematical tools
mathsKitPlugin.setReadonly(true);  // Disable mathematical tools
```

### Creating Mathematical Tools

```typescript
import { MathsKitType } from '@netless/maths-kit';

// Create a mathematical tool on main view
mathsKitPlugin.create('mainView', MathsKitType.Pen, 'kit-1', {
  // optional initial state
});

// Create a mathematical tool on an app view
mathsKitPlugin.create('app-id-123', MathsKitType.Pen, 'kit-2');
```

### Updating Mathematical Tools

```typescript
import { MathsKitState } from '@netless/maths-kit';

// Update a mathematical tool
const updatedState: MathsKitState = {
  type: MathsKitType.Pen,
  // ... other state properties
};

mathsKitPlugin.update('mainView', 'kit-1', updatedState);
```

### Removing Mathematical Tools

```typescript
// Remove a mathematical tool
mathsKitPlugin.remove('mainView', 'kit-1');
```

### Complete Example

```typescript
import { createFastboard } from '@netless/fastboard';
import { ExtendMathsKitPlugin } from '@netless/window-manager-maths-kit-extend';
import { MathsKitType } from '@netless/maths-kit';

const fastboard = await createFastboard({
  // ... your config
});

// Initialize maths kit plugin
const mathsKitPlugin = new ExtendMathsKitPlugin({
  readonly: true,
  bindMainView: true,
  bindAppViews: false,
  theme: 'light'
});

fastboard.manager.useExtendPlugin(mathsKitPlugin);

// Enable mathematical tools if user has write permission
if (fastboard.room.isWritable) {
  mathsKitPlugin.setReadonly(false);
  
  // Create a mathematical tool
  mathsKitPlugin.create('mainView', MathsKitType.Pen, 'my-kit-1');
}
```

## Configuration Options

### ExtendMathsKitOptions

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `readonly` | `boolean` | `false` | Whether to enable mathematical tools. When `true`, tools are disabled |
| `theme` | `'light' \| 'dark'` | `undefined` | Theme for the mathematical tools UI |
| `bindMainView` | `boolean` | `true` | Whether to bind mathematical tools to the main view |
| `bindAppViews` | `boolean` | `false` | Whether to bind mathematical tools to all app views |

## API Reference

### ExtendMathsKitPlugin

#### Methods

- `setReadonly(readonly: boolean)` - Set readonly state dynamically. When `true`, disables mathematical tools
- `create(appId: ViewId, type: MathsKitType, kitId?: MathsKitId, state?: Partial<MathsKitState>)` - Create a new mathematical tool on the specified view
- `update(appId: ViewId, kitId: MathsKitId, state: MathsKitState)` - Update an existing mathematical tool
- `remove(appId: ViewId, kitId: MathsKitId)` - Remove a mathematical tool

#### Properties

- `windowManager: WindowManager` - Reference to the window manager instance
- `isWritable: boolean` - Whether the room is writable
- `localMathsKitViewData: ISerializableSyncMathsKitViewData` - Current local mathematical tools data for all views

#### Types

- `ViewId: 'mainView' | string` - View identifier (either 'mainView' or an app ID)
- `MathsKitId: string` - Mathematical tool identifier
- `ISerializableMathsKitData` - Mathematical tools data for a single view
- `ISerializableSyncMathsKitViewData` - Mathematical tools data for all views

## How It Works

The maths kit plugin:

1. **Creates MathsKitManager Instances**: Creates a `MathsKitManager` for each bound view (main view and/or app views)
2. **State Synchronization**: Uses `autorun` to monitor attribute changes and synchronize mathematical tool states across clients
3. **Camera Sync**: Automatically updates the global scale of mathematical tools when view camera is updated
4. **Lifecycle Management**: Handles mounting/unmounting of mathematical tool managers when views are created or destroyed
5. **State Persistence**: Stores mathematical tool states in window manager attributes for persistence and synchronization

## Supported Views

The plugin supports mathematical tools on:

- **Main View**: The whiteboard main view (when `bindMainView: true`)
- **App Views**: All application views (when `bindAppViews: true`)

## Requirements

- `@netless/window-manager`: >=1.0.6
- `white-web-sdk`: >=2.16.53
- `@netless/maths-kit`: 0.0.5-beta.3

## License

MIT

