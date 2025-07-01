# 示例应用

这是一个完整的示例应用，演示如何将 `@netless/window-manager-paste-extend` 插件与 Fastboard 和 Window Manager 集成。

## 演示功能

- ✅ Fastboard 与粘贴插件集成
- ✅ Window Manager 与粘贴插件集成
- ✅ 文件上传和转换
- ✅ 插件注册（PDFjs、DocsViewer）
- ✅ 拖拽功能
- ✅ 多语言支持
- ✅ 实时文件转换进度

## 快速开始

### 环境要求

- Node.js 16+
- pnpm 8+
- Netless 账户和项目设置

### 设置

```bash
# 进入示例目录
cd example

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

应用将在 `http://localhost:3000` 可用

## 项目结构

```
example/
├── src/
│   ├── main.tsx              # 主应用入口
│   ├── index.tsx             # 带房间创建的索引页面
│   ├── api.ts                # API 工具
│   ├── config.ts             # 配置
│   ├── utils.ts              # 工具函数
│   ├── region.ts             # 区域配置
│   └── server-api/           # 服务器 API 集成
│       └── uploadfile.ts     # 文件上传服务
├── types/
│   └── types.d.ts            # TypeScript 类型定义
├── index.html                # HTML 模板
├── vite.config.ts            # Vite 配置
└── proxy-server.js           # 开发代理服务器
```

## 集成示例

### Fastboard 集成

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
  language: 'zh-CN',
  useDrop: true,
  convertFile: async (file) => {
    // 你的文件转换逻辑
    const result = await uploadFile(file);
    return result;
  },
});

fastboard.manager.useExtendPlugin(pastePlugin);
const ui = createUI(fastboard, container);
```

### Window Manager 集成

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
  language: 'zh-CN',
  useDrop: true,
  convertFile: async (file) => {
    // 你的文件转换逻辑
    const result = await uploadFile(file);
    return result;
  },
});

manager.useExtendPlugin(pastePlugin);
```

## 插件注册

### PDFjs 插件

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

### DocsViewer 插件

```typescript
import { register } from '@netless/fastboard';
import { install } from '@netless/app-presentation';

install(register, { as: 'DocsViewer' });
```

## 文件上传服务

示例包含一个完整的文件上传服务，演示：

- 文件类型检测
- 图片尺寸计算
- 文件转换为各种格式
- 错误处理
- 进度跟踪

### 支持的转换

- **图片**：直接上传并计算尺寸
- **视频**：上传并获取流媒体 URL
- **文档**：转换为幻灯片并生成场景
- **PDF**：转换为图片并支持逐页访问

## 配置

### 环境变量

在 example 目录中创建 `.env` 文件：

```env
NETLESS_APP_IDENTIFIER=your-app-identifier
NETLESS_REGION=cn-hz
UPLOAD_SERVICE_URL=your-upload-service-url
```

### 上传服务

示例期望一个能够处理以下功能的上传服务：

- 文件上传
- 文件类型转换
- 进度跟踪
- 错误处理

查看 `src/server-api/uploadfile.ts` 了解预期的 API 接口。

## 开发

### 可用脚本

- `pnpm dev` - 启动开发服务器
- `pnpm build` - 构建生产版本
- `pnpm preview` - 预览生产构建
- `pnpm lint` - 运行 ESLint

### 热重载

开发服务器支持主应用和插件包的热重载。

## 故障排除

### 常见问题

1. **模块未找到错误**：确保使用 `pnpm install` 安装所有依赖
2. **插件注册错误**：检查所有必需的插件是否正确注册
3. **文件上传失败**：验证你的上传服务是否正在运行且可访问
4. **TypeScript 错误**：运行 `pnpm lint` 检查类型问题

### 调试模式

通过设置 `DEBUG` 环境变量启用调试日志：

```bash
DEBUG=* pnpm dev
```

## 许可证

MIT