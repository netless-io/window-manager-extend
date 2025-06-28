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

## Quick Start

### Installation

```bash
# Install the paste extension
npm install @netless/window-manager-paste-extend
# or
yarn add @netless/window-manager-paste-extend
# or
pnpm add @netless/window-manager-paste-extend
```

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
│   └── paste/                 # Paste extension plugin
│       ├── src/              # Source code
│       ├── dist/             # Build output
│       └── README.md         # Plugin documentation
├── example/                  # Example application
│   ├── src/                 # Example source code
│   └── README.md            # Example documentation
├── service/                 # Backend services
└── dev/                     # Development tools
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

## Related

- [@netless/window-manager](https://github.com/netless-io/window-manager) - The core window manager library
- [@netless/fastboard](https://github.com/netless-io/fastboard) - Fast whiteboard solution
- [@netless/app-presentation](https://github.com/netless-io/netless-app-presentation) - Document presentation plugin
- [@netless/app-pdfjs](https://github.com/netless-io/netless-app-pdfjs) - PDF viewer plugin