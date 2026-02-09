# window-manager-extend

A collection of extension plugins for [@netless/window-manager](https://github.com/netless-io/window-manager) to enhance whiteboard functionality.

## Packages

### [@netless/window-manager-paste-extend](./packages/paste)

A powerful paste and drag-and-drop extension plugin that supports file conversion and insertion into whiteboard applications.

**Features:**
- 📋 Paste text, images, and files directly from clipboard
- 🖱️ Drag and drop files from computer to whiteboard
- 🔄 Convert various file types (PDF, PPT, DOC, images, videos) to whiteboard-compatible formats
- 🎨 Built-in uploading progress UI with customizable language support
- ⚙️ Flexible configuration options for file filtering and conversion logic
- 🛡️ XSS protection for pasted text content
- 📱 Multi-language support (English, Chinese)

**Supported File Types:**
- Images: `.jpg`, `.jpeg`, `.png`, `.webp`
- Videos: `.mp4`, `.mpeg`
- Documents: `.ppt`, `.pptx`, `.doc`, `.pdf`

---

### [@netless/window-manager-ai-extend](./packages/ai)

AI chat extension based on OpenRouter API, with multimodal input, streaming responses, screenshots, and mind map export.

**Features:**
- 🤖 AI chat with multiple models and auto-fetched free model list
- 🖼️ Multimodal input (text + images)
- 📸 Manual screenshot, auto screenshot, and snapshot; send screenshots directly to AI
- 💬 Streaming responses with optional reasoning and final output separation
- 📝 Markdown rendering and code highlighting
- 🗺️ Export Markdown to mind map and add to whiteboard
- 💾 IndexedDB-persisted chat history and multi-session management
- 🏷️ Multi-tab sessions
- 🌐 English and Chinese UI

---

### [@netless/window-manager-background-extend](./packages/background)

Extension for customizing the main view background: image, color, and opacity.

**Features:**
- 🖼️ Custom background image (URL, size, crossOrigin)
- 🎨 Background color
- 🔲 Background opacity (0–1)
- 📢 `loadError` event when background image fails to load

---

### [@netless/window-manager-maths-kit-extend](./packages/maths-kit)

Maths kit extension providing math tools and annotations on the main view and app views.

**Features:**
- 📐 Math tools and annotations
- 🎨 Light/dark theme
- 📱 Bind to main view and app views
- 🔒 Read-only mode
- 🔄 State and camera sync across clients
- ⚡ Create, update, and remove math tools dynamically

---

### [@netless/window-manager-scrollbar-extend](./packages/scrollbar)

Custom draggable scrollbars for the main view to navigate large content areas.

**Features:**
- 🎯 Auto horizontal/vertical scrollbars when content overflows viewport
- 🖱️ Drag scrollbars to navigate the whiteboard
- 📏 Scrollbar size adapts to zoom and content size
- 🔒 Hide in read-only mode
- ⚙️ Configurable origin size and read-only state

---

### [@netless/window-manager-wheel-extend](./packages/wheel)

Mouse wheel extension for scrolling the main view and apps (Presentation, DocsViewer, Slide).

**Features:**
- 🖱️ Mouse wheel scrolling on main view and inside apps
- 📱 Supports Presentation, DocsViewer, Slide
- 🔒 Read-only mode
- 📏 Configurable scroll bounds
- ⚡ Custom interrupter to control when whiteboard scroll is blocked

---

## Quick Start

### Installation

Install only the plugins you need:

```bash
# Paste extension
pnpm add @netless/window-manager-paste-extend

# AI chat extension
pnpm add @netless/window-manager-ai-extend

# Background extension
pnpm add @netless/window-manager-background-extend

# Maths kit extension
pnpm add @netless/window-manager-maths-kit-extend

# Scrollbar extension
pnpm add @netless/window-manager-scrollbar-extend

# Wheel extension
pnpm add @netless/window-manager-wheel-extend
```

You can use `npm install` or `yarn add` instead of `pnpm add`. See each package’s README (e.g. [packages/ai/README.md](./packages/ai/README.md)) for detailed usage.

### Basic Usage

```typescript
import { ExtendPastePlugin } from '@netless/window-manager-paste-extend';

const pastePlugin = new ExtendPastePlugin({
  language: 'en',
  useDrop: true,
  convertFile: async (file) => {
    // Your file conversion logic
    // Return PasteFileResult or null
  }
});

// Register with window manager
windowManager.useExtendPlugin(pastePlugin);
```

## Development

### Prerequisites

- Node.js 16+
- pnpm 8+

### Setup

```bash
# Clone the repository
git clone https://github.com/netless-io/window-manager-extend.git
cd window-manager-extend

# Install dependencies
pnpm install

# Start development
pnpm dev
```

### Project Structure

```
window-manager-extend/
├── packages/
│   ├── paste/                 # Paste extension @netless/window-manager-paste-extend
│   ├── ai/                    # AI chat extension @netless/window-manager-ai-extend
│   ├── background/            # Background extension @netless/window-manager-background-extend
│   ├── maths-kit/             # Maths kit extension @netless/window-manager-maths-kit-extend
│   ├── scrollbar/             # Scrollbar extension @netless/window-manager-scrollbar-extend
│   └── wheel/                 # Wheel extension @netless/window-manager-wheel-extend
├── example/                  # Example application
├── service/                  # Backend services
└── dev/                      # Development tools
```

### Available Scripts

- `pnpm dev` - Start development mode for all packages
- `pnpm lint` - Run ESLint on all packages
- `pnpm lint:fix` - Fix ESLint issues automatically
- `pnpm clear` - Clean build outputs

## Examples

Check out the [example](./example) directory for complete integration examples with:

- Fastboard integration
- Window Manager integration
- File upload and conversion
- Plugin registration

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT

## Related Projects

- [@netless/window-manager](https://github.com/netless-io/window-manager) - Core window manager library
- [@netless/fastboard](https://github.com/netless-io/fastboard) - Fast whiteboard solution
- [@netless/app-presentation](https://github.com/netless-io/netless-app-presentation) - Document presentation plugin
- [@netless/app-pdfjs](https://github.com/netless-io/netless-app-pdfjs) - PDF viewer plugin