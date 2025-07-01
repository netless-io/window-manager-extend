# @netless/window-manager-paste-extend

A powerful paste and drag-and-drop extension plugin for [@netless/window-manager](https://github.com/netless-io/window-manager), supporting local file insertion into whiteboard applications through copy-paste or drag-and-drop operations.

>**Note**: Customers need to build their own static resource server and file conversion service. For details, refer to [Implementing File Conversion](https://docs.agora.io/en/interactive-whiteboard/develop/file-conversion-overview#introduction)

## Features

- **📋 Paste Support**: Paste text, images, and files directly from clipboard
- **🖱️ Drag & Drop**: Drag and drop files from your computer to the whiteboard
- **🔄 File Conversion**: Convert various file types (PDF, PPT, DOC, images, videos) to whiteboard-compatible formats
- **🎨 Custom UI**: Built-in uploading progress UI with customizable language support
- **⚙️ Flexible Configuration**: Extensive configuration options for file filtering, extensions, and conversion logic
- **🛡️ Security**: XSS protection for pasted text content
- **📱 Multi-language**: Support for multiple languages (English, Chinese)

## Supported File Types

- **Images**: `.jpg`, `.jpeg`, `.png`, `.webp`
- **Videos**: `.mp4`, `.mpeg`
- **Documents**: `.ppt`, `.pptx`, `.doc`, `.pdf`
- **Custom file types can be defined**

## Installation

```bash
npm install @netless/window-manager-paste-extend
# or
yarn add @netless/window-manager-paste-extend
# or
pnpm add @netless/window-manager-paste-extend
```

## Quick Start

### Integration with Fastboard
```typescript
import { ExtendPastePlugin } from '@netless/window-manager-paste-extend';
import { createFastboard, createUI } from '@netless/fastboard';

const fastboard = await createFastboard({
    sdkConfig: {
        ...
    },
    joinRoom: {
        // The native clipboard must be enabled for use
        useNativeClipboard: true,
        ...
    },
    managerConfig: {
        ...
    }
})
// Create the plugin instance
const pastePlugin = new ExtendPastePlugin({
  language: 'en',
  useDrop: true,
  convertFile: async (file) => {
    // Your file upload resource server and file conversion logic
    // Return PasteFileResult or null
  }
});

// Register with window manager
fastboard.manager.useExtendPlugin(pastePlugin);
const ui = createUI(fastboard, elm);
...
```

### Integration with Window Manager
```typescript
import { ExtendPastePlugin } from '@netless/window-manager-paste-extend';
import { WhiteWebSdk } from "white-web-sdk";
import { WindowManager } from "@netless/window-manager";

const whiteWebSdk = new WhiteWebSdk({
    useMobXState: true,
    ...
})
const room = await whiteWebSdk.joinRoom({
    ...
    // The native clipboard must be enabled for use
    useNativeClipboard: true,
    useMultiViews: true, 
})
const manager = await WindowManager.mount({ ... });
// Create the plugin instance
const pastePlugin = new ExtendPastePlugin({
  language: 'en',
  useDrop: true,
  convertFile: async (file) => {
    // Your file conversion logic
    // Return PasteFileResult or null
  }
});
// Register with window manager
manager.useExtendPlugin(pastePlugin);
...
```

## Configuration Options

### ExtendPasteOptions

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `convertFile` | `(file: File) => Promise<PasteFileResult \| null>` | **Required** | File conversion function |
| `enableDefaultUI` | `boolean` | `true` | Enable built-in uploading UI |
| `language` | `'en' \| 'zh-CN'` | `'en'` | UI language |
| `useDrop` | `boolean` | `false` | Enable drag and drop functionality |
| `maxConvertFiles` | `number` | `10` | Maximum files to convert at once |
| `extension` | `string[]` | `['.jpg', '.jpeg', '.png', '.webp', '.mp4', '.mpeg', '.ppt', '.pptx', '.doc', '.pdf']` | Supported file extensions |
| `fileFilter` | `(file: File) => boolean` | - | Custom file filter function |

## File Conversion Results

The `convertFile` function should return one of these result types:

### Image Result
```typescript
{
  kind: 'Image';
  url: string;
  width: number;
  height: number;
  crossOrigin?: boolean;
}
```

### Media Result
```typescript
{
  kind: 'MediaPlayer';
  title: string;
  url: string;
}
```

### Document Results
```typescript
// PDF
{
  kind: 'PDFjs';
  title: string;
  prefix: string;
  taskId: string;
  scenePath?: string;
}

// PowerPoint
{
  kind: 'Slide';
  title: string;
  url: string;
  taskId: string;
  scenePath?: string;
}

// Word/Other Documents
{
  kind: 'DocsViewer';
  title: string;
  taskId: string;
  scenes: SceneDefinition[];
  scenePath?: string;
}
```

### Custom Document Plugin Result
```typescript
{
  kind: string;
  options?: AddAppOptions;
  attributes?: Record<string, unknown>;
}
```

> **Note**: After document conversion is complete, whether it can be opened correctly depends on whether the corresponding netless-app plugins are registered in your project. `@netless/fastboard` internally integrates `DocsViewer`, `Slide`, `MediaPlayer`, and `Image`. While `@netless/window-manager` only integrates `DocsViewer` and `MediaPlayer`.
>
### Register Plugins
If you need to open other types of files, you need to actively register the corresponding plugins. Details are as follows:

1. `PDFjs`, refer to [netless-app-pdfjs](https://github.com/netless-io/netless-app-pdfjs)
```typescript
// import { WindowManager } from "@netless/window-manager";
import { register } from '@netless/fastboard';
import { install } from "@netless/app-pdfjs";

// install(WindowManager.register, {
install(register, {
  appOptions: {
    pdfjsLib: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@latest/build/pdf.min.mjs',
    workerSrc: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@latest/build/pdf.worker.min.mjs'
  }
})
```

2. New `DocsViewer`, refer to [netless-app-presentation](https://github.com/netless-io/netless-app-presentation)
```typescript
// import { WindowManager } from "@netless/window-manager";
import { register } from "@netless/fastboard"
import { install } from "@netless/app-presentation"

// install(WindowManager.register, { as: 'DocsViewer' })
install(register, { as: 'DocsViewer' })
```

## Complete Example
Refer to [`example`](https://github.com/netless-io/window-manager-extend/blob/main/example/src/main.tsx)

## API Reference

### ExtendPastePlugin Class

#### Properties
- `convertList: string[]` - List of currently converting files
- `windowManager: WindowManager` - Reference to the window manager instance
- `isWritable: boolean` - Whether the room is writable

#### Methods
- `mount(): void` - Mount the plugin and start listening for events
- `unMount(): void` - Unmount the plugin and remove event listeners
- `onCreate(): void` - Called when the plugin is created
- `onDestroy(): void` - Called when the plugin is destroyed

## Events

The plugin emits the following events:

### `convertListChange`
Emitted when the conversion list changes.

```typescript
{
  operation: 'add' | 'delete' | 'update';
  value: string;
  list: string[];
}
```

## License

MIT

## Related

- [@netless/window-manager](https://github.com/netless-io/window-manager) - The core window manager library
- [@netless/fastboard](https://github.com/netless-io/fastboard) - Fast whiteboard solution