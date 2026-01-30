# @netless/window-manager-ai-extend

An AI conversation extension plugin for Netless Window Manager, built on OpenRouter API, supporting multimodal input, streaming responses, screenshot functionality, and mind map export.

## ✨ Core Features

- 🤖 **AI Conversation** - Built on OpenRouter API, supports multiple AI models with automatic free model list retrieval
- 🖼️ **Multimodal Input** - Supports text and image input, can send images and text content simultaneously
- 📸 **Screenshot Functionality** - Supports three methods: manual screenshot, auto screenshot, and snapshot, screenshots can be directly sent to AI
- 💬 **Streaming Response** - Real-time display of AI response content, supports separate display of reasoning process and final output
- 📝 **Markdown Rendering** - Automatically recognizes and renders Markdown format content with code highlighting support
- 🗺️ **Mind Map Export** - Supports exporting Markdown content as mind maps and adding them to the whiteboard
- 💾 **Local Storage** - Uses IndexedDB for persistent storage of chat records with multi-session management
- 🏷️ **Multiple Tabs** - Supports creating multiple independent conversation sessions that can be switched or deleted at any time
- 🌐 **Multi-language Support** - Built-in Chinese and English interfaces with free switching

## 📦 Installation

```bash
npm install @netless/window-manager-ai-extend
# or
pnpm add @netless/window-manager-ai-extend
# or
yarn add @netless/window-manager-ai-extend
```

## 🚀 Quick Start

### Basic Usage

```typescript
import { ExtendAIPlugin } from '@netless/window-manager-ai-extend';
import { createFastboard } from '@netless/fastboard';

// 1. Create Fastboard instance
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
    supportAppliancePlugin: true, // Enable this option to support mind map functionality
  },
});

// 2. Implement file upload function
const uploadFile = async (file: File): Promise<string | null> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    
    const data = await response.json();
    return data.url; // Return image URL, return null on failure
  } catch (error) {
    console.error('Upload failed:', error);
    return null;
  }
};

// 3. Create AI plugin instance
const aiPlugin = new ExtendAIPlugin({
  // Required: File upload function to convert files to accessible URLs
  uploadFile,
  
  // Required: OpenRouter API key
  // Get it from: https://openrouter.ai/keys
  apiKey: 'sk-or-v1-your-api-key',
  
  // Optional: Specify models to use
  // - String: Single model ID
  // - Array: Multiple model IDs (users can select in the interface)
  // - Not specified: Automatically get list of free models supporting image input
  models: ['nvidia/nemotron-nano-12b-v2-vl:free'],
  
  // Optional: Language setting, defaults to 'zh-CN'
  language: 'zh-CN', // or 'en'
  
  // Optional: Custom container element, defaults to main whiteboard container
  // container: document.getElementById('ai-panel-container'),
  
  // Optional: Callback functions
  callbacks: {
    onShow: () => {
      console.log('AI panel shown');
    },
    onHide: () => {
      console.log('AI panel hidden');
    },
    onSwitchAiChat: (aiChatId: string) => {
      console.log('Switched to chat:', aiChatId);
    },
  },
});

// 4. Register plugin to Window Manager
fastboard.manager.useExtendPlugin(aiPlugin);

// 5. Show AI panel
aiPlugin.active();

// Hide AI panel
// aiPlugin.cancel();
```

### Auto-fetch Free Models

If the `models` parameter is not specified, the plugin will automatically fetch a list of free models that support image input from OpenRouter:

```typescript
const aiPlugin = new ExtendAIPlugin({
  uploadFile: uploadImage,
  apiKey: 'sk-or-v1-your-api-key',
  // Not specifying models will automatically fetch free model list
  // Users can select different models in the interface
});
```

> 💡 **Tip**: The automatically fetched model list will dynamically update based on OpenRouter's available models, ensuring you always use the latest free models.

## 📖 API Documentation

### ExtendAIPlugin

The main class of the AI plugin, extends `ExtendPlugin`.

#### Constructor Options

```typescript
interface ExtendAIOptions {
  /** 
   * File upload function to convert files to accessible URLs
   * @param file File to upload
   * @returns Returns image URL, returns null on upload failure
   */
  uploadFile: (file: File) => Promise<string | null>;
  
  /** 
   * OpenRouter API key
   * Get it from: https://openrouter.ai/keys
   */
  apiKey: string;
  
  /** 
   * Model list configuration
   * - String: Single model ID (e.g., 'nvidia/nemotron-nano-12b-v2-vl:free')
   * - Array: Multiple model IDs, users can select in the interface
   * - Not specified: Automatically get list of free models supporting image input
   * 
   * @example
   * models: 'nvidia/nemotron-nano-12b-v2-vl:free'
   * models: ['model-1', 'model-2']
   */
  models?: string[] | string;
  
  /** 
   * Whether to use default UI, defaults to true
   * If set to false, you need to implement UI yourself
   */
  useDefaultUI?: boolean;
  
  /** 
   * Specify AI panel container element
   * Defaults to main whiteboard container
   */
  container?: HTMLElement;
  
  /** 
   * Language setting
   * - 'zh-CN': Chinese interface
   * - 'en': English interface
   * Defaults to 'zh-CN'
   */
  language?: 'en' | 'zh-CN';
  
  /** 
   * Callback functions
   */
  callbacks?: {
    /** Triggered when panel is shown */
    onShow: () => void;
    /** Triggered when panel is hidden */
    onHide: () => void;
    /** Triggered when switching AI chat, parameter is current chat ID */
    onSwitchAiChat: (aiChatId: string) => void;
  };
}
```

#### Instance Methods

| Method | Description | Return Type |
|--------|------------|-------------|
| `active()` | Show AI panel | `void` |
| `cancel()` | Hide AI panel | `void` |

#### Properties

| Property | Description | Type |
|----------|-------------|------|
| `panelController` | Panel controller instance for advanced operations | `AIPanelController \| undefined` |
| `windowManager` | Window Manager instance | `WindowManager` |

### AIPanelController

Controller used internally by the plugin, accessible via `aiPlugin.panelController`. Mainly used for advanced operations and custom functionality.

> ⚠️ **Note**: These methods are mainly for advanced scenarios, general use cases don't need to call them directly.

#### Main Methods

```typescript
// Activate screenshot functionality (manual screenshot mode)
aiPlugin.panelController?.activeCaptureView();

// Cancel screenshot functionality
aiPlugin.panelController?.cancalCaptureView();

// Activate auto screenshot functionality (auto capture whiteboard changes)
aiPlugin.panelController?.activeAutoSnapshot();

// Cancel auto screenshot functionality
aiPlugin.panelController?.cancelAutoSnapshot();

// Manually create snapshot
// @param filename File name (optional)
// @returns Promise<File | null> Returns snapshot file
const snapshotFile = await aiPlugin.panelController?.snapshot('filename.png');

// Update chat record in database
// @param chatId Chat ID
// @param messages Message list
await aiPlugin.panelController?.updateDbRecord(chatId, messages);

// Get chat record from database
// @param chatId Chat ID
// @returns Promise<AiChatRecordItem | null> Returns chat record
const record = await aiPlugin.panelController?.getDbRecord(chatId);
```

## 🎯 Feature Details

### Multimodal Input

The plugin supports sending text and image content simultaneously, enabling true multimodal interaction:

1. **Text Input** - Directly input text content in the input box
2. **Image Input** - Add images through screenshot functionality or auto screenshot functionality
3. **Combined Send** - Can send both text and images simultaneously, AI will understand both inputs

> 💡 **Use Case**: You can send whiteboard screenshots with questions, allowing AI to understand whiteboard content and answer questions.

### Screenshot Functionality

The plugin provides three screenshot methods to meet different use cases:

1. **Manual Screenshot** (`clip`) - Click button and manually select screenshot area, suitable for precisely selecting needed content
2. **Auto Screenshot** (`auto clip`) - Automatically capture whiteboard changes and take screenshots, suitable for scenarios requiring continuous monitoring of whiteboard changes
3. **Snapshot** (`snapshot`) - Directly snapshot the current view, quickly capturing the entire whiteboard content

Screenshots are automatically added to the current conversation input and can be directly sent to AI.

### Streaming Response

The plugin supports streaming display of AI responses, providing a better interactive experience:

- **Reasoning Process** - If the model supports it (e.g., models supporting reasoning), the reasoning process will be displayed separately and can be collapsed
- **Final Output** - Real-time display of the model's final answer content
- **Markdown Rendering** - Automatically recognizes and renders Markdown format, supporting code highlighting, tables, lists, etc.

### Mind Map Export

If the AI returns content in Markdown format, you can click the export button to convert it into a mind map and add it to the whiteboard:

- Automatically parses Markdown structure
- Generates interactive mind maps
- Supports editing and adjustment on the whiteboard

> ⚠️ **Note**: You need to enable the `supportAppliancePlugin` option to use this feature.

### Multi-tab Management

- Supports creating multiple independent conversation sessions, each session is independent
- Each session's data is independently stored in IndexedDB
- Can switch, rename, or delete sessions at any time
- Supports session persistence, data won't be lost after page refresh

## 🔧 Configuration

### Model Configuration

The plugin supports using various AI models through OpenRouter. It's recommended to use models that support multimodal (image + text) input:

```typescript
// Method 1: Single model
models: 'nvidia/nemotron-nano-12b-v2-vl:free'

// Method 2: Multiple models (users can select in the interface)
models: [
  'nvidia/nemotron-nano-12b-v2-vl:free',
  'google/gemini-pro-vision',
  'openai/gpt-4-vision-preview'
]

// Method 3: Not specified, auto-fetch free models
// models: undefined
```

> 📚 **Model Selection Recommendations**:
> - View supported model list: https://openrouter.ai/models
> - Recommended to use models supporting `vision` or `multimodal`
> - Free model recommendation: `nvidia/nemotron-nano-12b-v2-vl:free`

### File Upload Configuration

The `uploadFile` function needs to implement file upload logic, upload files to the server and return an accessible URL:

```typescript
const uploadFile = async (file: File): Promise<string | null> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Upload failed');
    }
    
    const data = await response.json();
    return data.url; // Return image URL, ensure URL is accessible by AI models
  } catch (error) {
    console.error('Upload failed:', error);
    return null; // Return null on failure, plugin will handle error prompts
  }
};
```

> ⚠️ **Important Notes**:
> - The returned URL must be accessible by OpenRouter API (publicly accessible)
> - If using private storage, ensure OpenRouter can access it
> - Recommended to use HTTPS URL
> - Supports common image formats: PNG, JPEG, GIF, WebP, etc.

## 📋 Dependencies

### Required Dependencies (Peer Dependencies)

These dependencies need to be installed in the project using this plugin:

- `@netless/window-manager` >= 1.0.10 - Window Manager core library
- `white-web-sdk` >= 2.16.53 - Whiteboard SDK
- `react` >= 17.0.2 - React framework
- `react-dom` >= 17.0.2 - React DOM rendering

### Optional Dependencies (for Mind Map functionality)

- `@netless/appliance-plugin` >= 1.1.30 - For mind map export functionality

### Auto-installed Dependencies

The plugin will automatically install the following dependencies (no manual installation needed):

- `@openrouter/sdk` ^0.3.10 - OpenRouter API SDK
- `antd` ^5.29.2 - Ant Design UI component library
- `@ant-design/icons` ^5.5.1 - Ant Design icon library
- `markdown` ^0.5.0 - Markdown parsing library
- `markmap-common` ^0.18.0 - Mind map core library
- `markmap-lib` ^0.18.0 - Mind map library
- `markmap-toolbar` ^0.18.0 - Mind map toolbar
- `markmap-view` ^0.18.0 - Mind map view
- `lodash` ^4.17.21 - Utility function library
- `d3` ^7.9.0 - Data visualization library (for mind maps)

## 🛠️ Development Guide

### Environment Requirements

- Node.js >= 16
- pnpm >= 7 (recommended to use pnpm)

### Development Workflow

```bash
# 1. Clone repository
git clone <repository-url>

# 2. Enter project directory
cd packages/ai

# 3. Install dependencies
pnpm install

# 4. Development mode (watch file changes and auto-build)
pnpm dev

# 5. Build production version
pnpm build

# 6. Code linting
pnpm lint
```

### Project Structure

```
packages/ai/
├── src/
│   ├── component/        # React components
│   │   ├── chat.tsx      # Chat component
│   │   └── panel.tsx     # Panel component
│   ├── controller.tsx    # Controller
│   ├── index.ts          # Entry file
│   ├── locale.ts         # Internationalization
│   ├── types.ts          # Type definitions
│   ├── server-api/       # API related
│   │   ├── iconify-api.ts
│   │   └── openRuter-api.ts
│   └── utils/            # Utility functions
│       ├── autoSnapshot.ts
│       ├── indexDB.ts
│       ├── ObserverMap.ts
│       └── snapshot.ts
├── build.mjs            # Build script
├── tsconfig.json        # TypeScript configuration
└── package.json         # Project configuration
```

## 📝 Important Notes

### Security

1. **API Key Security** ⚠️
   - Keep your OpenRouter API key secure, do not commit it to code repositories
   - Recommended to use environment variables or configuration services to manage keys
   - Do not hardcode keys in client-side code

2. **File Upload Security**
   - Ensure uploaded files are validated and filtered
   - Limit file size and type
   - Use HTTPS for transmission

### Feature Limitations

3. **Model Compatibility**
   - Different models may have different requirements for image format and size
   - Recommended to use PNG or JPEG format, keep size under 10MB
   - Some models may not support multimodal input

4. **Storage Limitations**
   - IndexedDB has storage limits (usually 50% of browser storage)
   - Large amounts of chat records may require regular cleanup
   - Recommended to implement data cleanup mechanisms

5. **Network Requirements**
   - Requires network environment that can access OpenRouter API
   - Some regions may require proxy or VPN
   - API calls may incur costs (depending on the model used)

### Best Practices

6. **Error Handling**
   - Implement comprehensive error handling mechanisms
   - Provide friendly prompts for upload failures, API call failures, etc.

7. **Performance Optimization**
   - Large amounts of chat records may affect performance
   - Consider implementing virtual scrolling or pagination loading
   - Regularly clean up old chat records

## ❓ FAQ

### Q: How to get OpenRouter API key?

A: Visit https://openrouter.ai/keys to register an account and create an API key.

### Q: What image formats are supported?

A: Supports common image formats including PNG, JPEG, GIF, WebP, etc. It's recommended to use PNG or JPEG format for best compatibility.

### Q: How to implement file upload?

A: You need to implement the `uploadFile` function to upload files to your server or cloud storage service (such as OSS, S3, etc.) and return a publicly accessible URL.

### Q: Why isn't the mind map functionality working?

A: Make sure you've enabled the `supportAppliancePlugin: true` option when creating the Fastboard instance.

### Q: Where are chat records stored?

A: Chat records are stored in the browser's IndexedDB, with the database name `__WINDOW_MANAGER_EXTEND_AI_DB`.

### Q: How to clean up chat records?

A: You can delete individual sessions in the interface, or clear all data using the `panelController.clearDb()` method.

## 🤝 Contributing

Welcome to submit Issues and Pull Requests!

Before submitting code, please ensure:
- Code passes `pnpm lint` check
- Necessary tests have been added
- Related documentation has been updated

## 📄 License

MIT License

## 🔗 Related Links

- [Netless Window Manager](https://github.com/netless-io/window-manager) - Window Manager official repository
- [OpenRouter API Documentation](https://openrouter.ai/docs) - OpenRouter API complete documentation
- [Fastboard](https://github.com/netless-io/fastboard) - Fastboard official repository
- [OpenRouter Model List](https://openrouter.ai/models) - View all available models
