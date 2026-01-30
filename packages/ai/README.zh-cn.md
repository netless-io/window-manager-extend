# @netless/window-manager-ai-extend

一个为 Netless Window Manager 提供的 AI 对话扩展插件，基于 OpenRouter API 实现，支持多模态输入、流式响应、截图功能和思维导图导出。

## ✨ 核心特性

- 🤖 **AI 对话功能** - 基于 OpenRouter API，支持多种 AI 模型，可自动获取免费模型列表
- 🖼️ **多模态输入** - 支持文本和图片输入，可同时发送图片和文字内容
- 📸 **截图功能** - 支持手动截图、自动截图和快照三种方式，截图可直接发送给 AI
- 💬 **流式响应** - 实时显示 AI 响应内容，支持推理过程（reasoning）和最终输出分离显示
- 📝 **Markdown 渲染** - 自动识别并渲染 Markdown 格式内容，支持代码高亮
- 🗺️ **思维导图导出** - 支持将 Markdown 内容导出为思维导图并添加到白板
- 💾 **本地存储** - 使用 IndexedDB 持久化存储聊天记录，支持多会话管理
- 🏷️ **多标签页** - 支持创建多个独立的对话会话，可随时切换或删除
- 🌐 **多语言支持** - 内置中文和英文界面，可自由切换

## 📦 安装

```bash
npm install @netless/window-manager-ai-extend
# 或
pnpm add @netless/window-manager-ai-extend
# 或
yarn add @netless/window-manager-ai-extend
```

## 🚀 快速开始

### 基本使用

```typescript
import { ExtendAIPlugin } from '@netless/window-manager-ai-extend';
import { createFastboard } from '@netless/fastboard';

// 1. 创建 Fastboard 实例
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
    supportAppliancePlugin: true, // 启用此选项以支持思维导图功能
  },
});

// 2. 实现文件上传函数
const uploadFile = async (file: File): Promise<string | null> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    
    const data = await response.json();
    return data.url; // 返回图片 URL，失败返回 null
  } catch (error) {
    console.error('上传失败:', error);
    return null;
  }
};

// 3. 创建 AI 插件实例
const aiPlugin = new ExtendAIPlugin({
  // 必需：文件上传函数，将文件转换为可访问的 URL
  uploadFile,
  
  // 必需：OpenRouter API 密钥
  // 获取方式：https://openrouter.ai/keys
  apiKey: 'sk-or-v1-your-api-key',
  
  // 可选：指定使用的模型
  // - 字符串：单个模型 ID
  // - 数组：多个模型 ID（用户可在界面中选择）
  // - 未指定：自动获取支持图片输入且免费的模型列表
  models: ['nvidia/nemotron-nano-12b-v2-vl:free'],
  
  // 可选：语言设置，默认为 'zh-CN'
  language: 'zh-CN', // 或 'en'
  
  // 可选：自定义容器元素，默认添加到主白板容器
  // container: document.getElementById('ai-panel-container'),
  
  // 可选：回调函数
  callbacks: {
    onShow: () => {
      console.log('AI 面板已显示');
    },
    onHide: () => {
      console.log('AI 面板已隐藏');
    },
    onSwitchAiChat: (aiChatId: string) => {
      console.log('切换到聊天:', aiChatId);
    },
  },
});

// 4. 注册插件到 Window Manager
fastboard.manager.useExtendPlugin(aiPlugin);

// 5. 显示 AI 面板
aiPlugin.active();

// 隐藏 AI 面板
// aiPlugin.cancel();
```

### 自动获取免费模型

如果不指定 `models` 参数，插件会自动从 OpenRouter 获取支持图片输入且免费的模型列表：

```typescript
const aiPlugin = new ExtendAIPlugin({
  uploadFile: uploadImage,
  apiKey: 'sk-or-v1-your-api-key',
  // 不指定 models，将自动获取免费模型列表
  // 用户可以在界面中选择不同的模型
});
```

> 💡 **提示**：自动获取的模型列表会根据 OpenRouter 的可用模型动态更新，确保始终使用最新的免费模型。

## 📖 API 文档

### ExtendAIPlugin

AI 插件的主类，继承自 `ExtendPlugin`。

#### 构造函数选项

```typescript
interface ExtendAIOptions {
  /** 
   * 文件上传函数，将文件转换为可访问的 URL
   * @param file 要上传的文件
   * @returns 返回图片 URL，上传失败返回 null
   */
  uploadFile: (file: File) => Promise<string | null>;
  
  /** 
   * OpenRouter API 密钥
   * 获取方式：https://openrouter.ai/keys
   */
  apiKey: string;
  
  /** 
   * 模型列表配置
   * - 字符串：单个模型 ID（如 'nvidia/nemotron-nano-12b-v2-vl:free'）
   * - 数组：多个模型 ID，用户可在界面中选择
   * - 未指定：自动获取支持图片输入且免费的模型列表
   * 
   * @example
   * models: 'nvidia/nemotron-nano-12b-v2-vl:free'
   * models: ['model-1', 'model-2']
   */
  models?: string[] | string;
  
  /** 
   * 是否使用默认 UI，默认为 true
   * 如果设置为 false，需要自行实现 UI
   */
  useDefaultUI?: boolean;
  
  /** 
   * 指定 AI 面板容器元素
   * 默认添加到主白板容器
   */
  container?: HTMLElement;
  
  /** 
   * 语言设置
   * - 'zh-CN': 中文界面
   * - 'en': 英文界面
   * 默认为 'zh-CN'
   */
  language?: 'en' | 'zh-CN';
  
  /** 
   * 回调函数集合
   */
  callbacks?: {
    /** 面板显示时触发 */
    onShow: () => void;
    /** 面板隐藏时触发 */
    onHide: () => void;
    /** 切换 AI 聊天时触发，参数为当前聊天 ID */
    onSwitchAiChat: (aiChatId: string) => void;
  };
}
```

#### 实例方法

| 方法 | 说明 | 返回值 |
|------|------|--------|
| `active()` | 显示 AI 面板 | `void` |
| `cancel()` | 隐藏 AI 面板 | `void` |

#### 属性

| 属性 | 说明 | 类型 |
|------|------|------|
| `panelController` | 面板控制器实例，用于高级操作 | `AIPanelController \| undefined` |
| `windowManager` | Window Manager 实例 | `WindowManager` |

### AIPanelController

插件内部使用的控制器，可通过 `aiPlugin.panelController` 访问。主要用于高级操作和自定义功能。

> ⚠️ **注意**：这些方法主要用于高级场景，一般使用场景不需要直接调用。

#### 主要方法

```typescript
// 激活截图功能（手动截图模式）
aiPlugin.panelController?.activeCaptureView();

// 取消截图功能
aiPlugin.panelController?.cancalCaptureView();

// 激活自动截图功能（自动捕获白板变化）
aiPlugin.panelController?.activeAutoSnapshot();

// 取消自动截图功能
aiPlugin.panelController?.cancelAutoSnapshot();

// 手动创建快照
// @param filename 文件名（可选）
// @returns Promise<File | null> 返回快照文件
const snapshotFile = await aiPlugin.panelController?.snapshot('filename.png');

// 更新数据库中的聊天记录
// @param chatId 聊天 ID
// @param messages 消息列表
await aiPlugin.panelController?.updateDbRecord(chatId, messages);

// 获取数据库中的聊天记录
// @param chatId 聊天 ID
// @returns Promise<AiChatRecordItem | null> 返回聊天记录
const record = await aiPlugin.panelController?.getDbRecord(chatId);
```

## 🎯 功能详解

### 多模态输入

插件支持同时发送文本和图片内容，实现真正的多模态交互：

1. **文本输入** - 在输入框中直接输入文本内容
2. **图片输入** - 通过截图功能或自动截图功能添加图片
3. **组合发送** - 可以同时发送文本和图片，AI 会同时理解两种输入

> 💡 **使用场景**：可以发送白板截图并配上问题，让 AI 理解白板内容并回答问题。

### 截图功能

插件提供三种截图方式，满足不同使用场景：

1. **手动截图** (`clip`) - 点击按钮后手动选择截图区域，适合精确选择需要的内容
2. **自动截图** (`auto clip`) - 自动捕获白板变化并截图，适合需要持续监控白板变化的场景
3. **快照** (`snapshot`) - 直接对当前视图进行快照，快速捕获整个白板内容

截图后会自动添加到当前对话的输入中，可以直接发送给 AI。

### 流式响应

插件支持流式显示 AI 响应，提供更好的交互体验：

- **推理过程** - 如果模型支持（如支持 reasoning 的模型），会单独显示推理过程，可折叠查看
- **最终输出** - 实时显示模型的最终回答内容
- **Markdown 渲染** - 自动识别并渲染 Markdown 格式，支持代码高亮、表格、列表等

### 思维导图导出

如果 AI 返回的内容是 Markdown 格式，可以点击导出按钮将其转换为思维导图并添加到白板中：

- 自动解析 Markdown 结构
- 生成交互式思维导图
- 支持在白板中编辑和调整

> ⚠️ **注意**：需要启用 `supportAppliancePlugin` 选项才能使用此功能。

### 多标签页管理

- 支持创建多个独立的对话会话，每个会话互不干扰
- 每个会话的数据独立存储在 IndexedDB 中
- 可以随时切换、重命名或删除会话
- 支持会话持久化，刷新页面后数据不丢失

## 🔧 配置说明

### 模型配置

插件支持通过 OpenRouter 使用多种 AI 模型。推荐使用支持多模态（图片+文本）的模型：

```typescript
// 方式 1：单个模型
models: 'nvidia/nemotron-nano-12b-v2-vl:free'

// 方式 2：多个模型（用户可在界面中选择）
models: [
  'nvidia/nemotron-nano-12b-v2-vl:free',
  'google/gemini-pro-vision',
  'openai/gpt-4-vision-preview'
]

// 方式 3：不指定，自动获取免费模型
// models: undefined
```

> 📚 **模型选择建议**：
> - 查看支持的模型列表：https://openrouter.ai/models
> - 推荐使用支持 `vision` 或 `multimodal` 的模型
> - 免费模型推荐：`nvidia/nemotron-nano-12b-v2-vl:free`

### 文件上传配置

`uploadFile` 函数需要实现文件上传逻辑，将文件上传到服务器并返回可访问的 URL：

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
      throw new Error('上传失败');
    }
    
    const data = await response.json();
    return data.url; // 返回图片 URL，确保 URL 可以被 AI 模型访问
  } catch (error) {
    console.error('上传失败:', error);
    return null; // 失败返回 null，插件会处理错误提示
  }
};
```

> ⚠️ **重要提示**：
> - 返回的 URL 必须可以被 OpenRouter API 访问（公开可访问）
> - 如果使用私有存储，需要确保 OpenRouter 能够访问
> - 建议使用 HTTPS URL
> - 支持常见图片格式：PNG、JPEG、GIF、WebP 等

## 📋 依赖要求

### 必需依赖（Peer Dependencies）

这些依赖需要在使用该插件的项目中安装：

- `@netless/window-manager` >= 1.0.10 - Window Manager 核心库
- `white-web-sdk` >= 2.16.53 - 白板 SDK
- `react` >= 17.0.2 - React 框架
- `react-dom` >= 17.0.2 - React DOM 渲染

### 可选依赖（用于思维导图功能）

- `@netless/appliance-plugin` >= 1.1.30 - 用于思维导图导出功能

### 自动安装的依赖

插件会自动安装以下依赖（无需手动安装）：

- `@openrouter/sdk` ^0.3.10 - OpenRouter API SDK
- `antd` ^5.29.2 - Ant Design UI 组件库
- `@ant-design/icons` ^5.5.1 - Ant Design 图标库
- `markdown` ^0.5.0 - Markdown 解析库
- `markmap-common` ^0.18.0 - 思维导图核心库
- `markmap-lib` ^0.18.0 - 思维导图库
- `markmap-toolbar` ^0.18.0 - 思维导图工具栏
- `markmap-view` ^0.18.0 - 思维导图视图
- `lodash` ^4.17.21 - 工具函数库
- `d3` ^7.9.0 - 数据可视化库（用于思维导图）

## 🛠️ 开发指南

### 环境要求

- Node.js >= 16
- pnpm >= 7（推荐使用 pnpm）

### 开发流程

```bash
# 1. 克隆仓库
git clone <repository-url>

# 2. 进入项目目录
cd packages/ai

# 3. 安装依赖
pnpm install

# 4. 开发模式（监听文件变化并自动构建）
pnpm dev

# 5. 构建生产版本
pnpm build

# 6. 代码检查
pnpm lint
```

### 项目结构

```
packages/ai/
├── src/
│   ├── component/        # React 组件
│   │   ├── chat.tsx      # 聊天组件
│   │   └── panel.tsx     # 面板组件
│   ├── controller.tsx    # 控制器
│   ├── index.ts          # 入口文件
│   ├── locale.ts         # 国际化
│   ├── types.ts          # 类型定义
│   ├── server-api/       # API 相关
│   │   ├── iconify-api.ts
│   │   └── openRuter-api.ts
│   └── utils/            # 工具函数
│       ├── autoSnapshot.ts
│       ├── indexDB.ts
│       ├── ObserverMap.ts
│       └── snapshot.ts
├── build.mjs            # 构建脚本
├── tsconfig.json        # TypeScript 配置
└── package.json         # 项目配置
```

## 📝 注意事项

### 安全相关

1. **API 密钥安全** ⚠️
   - 请妥善保管 OpenRouter API 密钥，不要提交到代码仓库
   - 建议使用环境变量或配置服务管理密钥
   - 不要在客户端代码中硬编码密钥

2. **文件上传安全**
   - 确保上传的文件经过验证和过滤
   - 限制文件大小和类型
   - 使用 HTTPS 传输

### 功能限制

3. **模型兼容性**
   - 不同模型对图片格式和大小可能有不同要求
   - 建议使用 PNG 或 JPEG 格式，大小控制在 10MB 以内
   - 某些模型可能不支持多模态输入

4. **存储限制**
   - IndexedDB 有存储限制（通常为浏览器存储的 50%）
   - 大量聊天记录可能需要定期清理
   - 建议实现数据清理机制

5. **网络要求**
   - 需要能够访问 OpenRouter API 的网络环境
   - 某些地区可能需要代理或 VPN
   - API 调用可能产生费用（取决于使用的模型）

### 最佳实践

6. **错误处理**
   - 实现完善的错误处理机制
   - 对上传失败、API 调用失败等情况进行友好提示

7. **性能优化**
   - 大量聊天记录可能影响性能
   - 考虑实现虚拟滚动或分页加载
   - 定期清理旧的聊天记录

## ❓ 常见问题

### Q: 如何获取 OpenRouter API 密钥？

A: 访问 https://openrouter.ai/keys 注册账号并创建 API 密钥。

### Q: 支持哪些图片格式？

A: 支持常见的图片格式，包括 PNG、JPEG、GIF、WebP 等。建议使用 PNG 或 JPEG 格式以获得最佳兼容性。

### Q: 如何实现文件上传？

A: 需要实现 `uploadFile` 函数，将文件上传到你的服务器或云存储服务（如 OSS、S3 等），并返回可公开访问的 URL。

### Q: 为什么思维导图功能不工作？

A: 确保在创建 Fastboard 实例时启用了 `supportAppliancePlugin: true` 选项。

### Q: 聊天记录存储在哪里？

A: 聊天记录存储在浏览器的 IndexedDB 中，数据库名称为 `__WINDOW_MANAGER_EXTEND_AI_DB`。

### Q: 如何清理聊天记录？

A: 可以在界面中删除单个会话，或通过 `panelController.clearDb()` 方法清空所有数据。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

在提交代码前，请确保：
- 代码通过 `pnpm lint` 检查
- 已添加必要的测试
- 更新了相关文档

## 📄 许可证

MIT License

## 🔗 相关链接

- [Netless Window Manager](https://github.com/netless-io/window-manager) - Window Manager 官方仓库
- [OpenRouter API 文档](https://openrouter.ai/docs) - OpenRouter API 完整文档
- [Fastboard](https://github.com/netless-io/fastboard) - Fastboard 官方仓库
- [OpenRouter 模型列表](https://openrouter.ai/models) - 查看所有可用模型
