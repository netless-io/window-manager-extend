# Example Application

This is a complete example application demonstrating how to integrate the `@netless/window-manager-paste-extend` plugin with both Fastboard and Window Manager.

## Features Demonstrated

- ✅ Fastboard integration with paste plugin
- ✅ Window Manager integration with paste plugin
- ✅ File upload and conversion
- ✅ Plugin registration (PDFjs, DocsViewer)
- ✅ Drag and drop functionality
- ✅ Multi-language support
- ✅ Real-time file conversion progress

## Quick Start

### Prerequisites

- Node.js 16+
- pnpm 8+
- Netless account and project setup

### Setup

```bash
# Navigate to example directory
cd example

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The application will be available at `http://localhost:3000`

## Project Structure

```
example/
├── src/
│   ├── main.tsx              # Main application entry
│   ├── index.tsx             # Index page with room creation
│   ├── api.ts                # API utilities
│   ├── config.ts             # Configuration
│   ├── utils.ts              # Utility functions
│   ├── region.ts             # Region configuration
│   └── server-api/           # Server API integration
│       └── uploadfile.ts     # File upload service
├── types/
│   └── types.d.ts            # TypeScript type definitions
├── index.html                # HTML template
├── vite.config.ts            # Vite configuration
└── proxy-server.js           # Development proxy server
```

## Integration Examples

### Fastboard Integration

```typescript
import { createFastboard, createUI } from '@netless/fastboard';
import { ExtendPastePlugin } from '@netless/window-manager-paste-extend';

const fastboard = await createFastboard({
  sdkConfig: {
    appIdentifier: 'your-app-identifier',
    region: 'cn-hz',
  },
  joinRoom: {
    uid: 'user-id',
    uuid: 'room-uuid',
    roomToken: 'room-token',
    isWritable: true,
  },
  managerConfig: {
    cursor: true,
    supportAppliancePlugin: true,
  },
});

const pastePlugin = new ExtendPastePlugin({
  language: 'en',
  useDrop: true,
  convertFile: async (file) => {
    // Your file conversion logic
    const result = await uploadFile(file);
    return result;
  },
});

fastboard.manager.useExtendPlugin(pastePlugin);
const ui = createUI(fastboard, container);
```

### Window Manager Integration

```typescript
import { WhiteWebSdk } from 'white-web-sdk';
import { WindowManager } from '@netless/window-manager';
import { ExtendPastePlugin } from '@netless/window-manager-paste-extend';

const whiteWebSdk = new WhiteWebSdk({
  useMobXState: true,
  appIdentifier: 'your-app-identifier',
});

const room = await whiteWebSdk.joinRoom({
  uuid: 'room-uuid',
  roomToken: 'room-token',
  useMultiViews: true,
});

const manager = await WindowManager.mount({
  room,
  container,
  cursorAdapter: true,
});

const pastePlugin = new ExtendPastePlugin({
  language: 'en',
  useDrop: true,
  convertFile: async (file) => {
    // Your file conversion logic
    const result = await uploadFile(file);
    return result;
  },
});

manager.useExtendPlugin(pastePlugin);
```

## Plugin Registration

### PDFjs Plugin

```typescript
import { register } from '@netless/fastboard';
import { install } from '@netless/app-pdfjs';

install(register, {
  appOptions: {
    pdfjsLib: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@latest/build/pdf.min.mjs',
    workerSrc: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@latest/build/pdf.worker.min.mjs',
  },
});
```

### DocsViewer Plugin

```typescript
import { register } from '@netless/fastboard';
import { install } from '@netless/app-presentation';

install(register, { as: 'DocsViewer' });
```

## File Upload Service

The example includes a complete file upload service that demonstrates:

- File type detection
- Image size calculation
- File conversion to various formats
- Error handling
- Progress tracking

### Supported Conversions

- **Images**: Direct upload with size calculation
- **Videos**: Upload and get streaming URL
- **Documents**: Convert to slides with scene generation
- **PDFs**: Convert to images with page-by-page access

## Configuration

### Environment Variables

Create a `.env` file in the example directory:

```env
NETLESS_APP_IDENTIFIER=your-app-identifier
NETLESS_REGION=cn-hz
UPLOAD_SERVICE_URL=your-upload-service-url
```

### Upload Service

The example expects an upload service that can handle:

- File uploads
- File type conversion
- Progress tracking
- Error handling

See `src/server-api/uploadfile.ts` for the expected API interface.

## Development

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm lint` - Run ESLint

### Hot Reload

The development server supports hot reload for both the main application and the plugin package.

## Troubleshooting

### Common Issues

1. **Module not found errors**: Ensure all dependencies are installed with `pnpm install`
2. **Plugin registration errors**: Check that all required plugins are properly registered
3. **File upload failures**: Verify your upload service is running and accessible
4. **TypeScript errors**: Run `pnpm lint` to check for type issues

### Debug Mode

Enable debug logging by setting the `DEBUG` environment variable:

```bash
DEBUG=* pnpm dev
```

## License

MIT
