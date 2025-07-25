 # @netless/window-manager-paste-extend

一个功能强大的粘贴和拖拽扩展插件，专为 [@netless/window-manager](https://github.com/netless-io/window-manager) 设计，支持本地文件通过复制粘贴或拖拽添加到白板应用中。
>**注意**:需要客户自己搭建静态资源服务器及文件转换服务,具体参考[如何实现文件转换](https://doc.shengwang.cn/doc/whiteboard/javascript/fastboard-sdk/advanced-features/convert-files#%E5%AE%9E%E7%8E%B0%E6%96%87%E6%A1%A3%E8%BD%AC%E6%8D%A2)
>![Image](https://github.com/user-attachments/assets/7a06634f-2202-45e2-a969-4c26ba683bff)

## 功能特性

- **📋 粘贴支持**: 直接从剪贴板粘贴文本、图片和文件
- **🖱️ 拖拽上传**: 从电脑拖拽文件到白板
- **🔄 文件转换**: 将各种文件类型（PDF、PPT、DOC、图片、视频）转换为白板兼容格式
- **🎨 自定义UI**: 内置上传进度UI，支持自定义语言
- **⚙️ 灵活配置**: 丰富的配置选项，支持文件过滤、扩展名限制和转换逻辑
- **🛡️ 安全防护**: 对粘贴的文本内容进行XSS防护
- **📱 多语言**: 支持多种语言（英文、中文）

## 支持的文件类型

- **图片**: `.jpg`, `.jpeg`, `.png`, `.webp`
- **视频**: `.mp4`, `.mpeg`
- **文档**: `.ppt`, `.pptx`, `.doc`, `.pdf`
- **可以自定义文件类型**

## 安装

```bash
npm install @netless/window-manager-paste-extend
# 或
yarn add @netless/window-manager-paste-extend
# 或
pnpm add @netless/window-manager-paste-extend
```

## 快速开始

### 对接 fastboard
```typescript
import { ExtendPastePlugin } from '@netless/window-manager-paste-extend';
import { createFastboard, createUI } from '@netless/fastboard';

const fastboard = await createFastboard({
    sdkConfig: {
        ...
    },
    joinRoom: {
        // 必须开启使用原生剪贴板
        useNativeClipboard: true,
        ...
    },
    managerConfig: {
        ...
    }
})
// 创建插件实例
const pastePlugin = new ExtendPastePlugin({
  language: 'zh-CN',
  useDrop: true,
  convertFile: async (file) => {
    // 你的文件上传资源服务器及文件转换逻辑
    // 返回 PasteFileResult 或 null
  }
});

// 注册到窗口管理器
fastboard.manager.useExtendPlugin(pastePlugin);
const ui = createUI(fastboard, elm);
...
```

### 对接 window-manager
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
    // 必须开启使用原生剪贴板
    useNativeClipboard: true,
    useMultiViews: true, 
})
const manager = await WindowManager.mount({ ... });
// 创建插件实例
const pastePlugin = new ExtendPastePlugin({
  language: 'zh-CN',
  useDrop: true,
  convertFile: async (file) => {
    // 你的文件转换逻辑
    // 返回 PasteFileResult 或 null
  }
});
// 注册到窗口管理器
manager.useExtendPlugin(pastePlugin);
...
```

## 配置选项

### ExtendPasteOptions

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `convertFile` | `(file: File) => Promise<PasteFileResult \| null>` | **必需** | 文件转换函数，将文件转换为 PasteFileResult，如果转换失败则返回 null |
| `container` | `HTMLElement` | 主白板 | 指定 paste、drop 容器，默认是主白板 |
| `enableDefaultUI` | `boolean` | `true` | 启用内置上传UI |
| `language` | `'en' \| 'zh-CN'` | `'en'` | UI语言 |
| `useDrop` | `boolean` | `false` | 是否使用 drop 事件转换文件，如果为 true 则可以使用 drop 事件转换文件 |
| `maxConvertFiles` | `number` | `10` | 单次最大文件转换数量，如果超过这个数量则不进行转换 |
| `extension` | `string[]` | `['.jpg', '.jpeg', '.png', '.webp', '.mp4', '.mpeg', '.ppt', '.pptx', '.doc', '.pdf']` | 指定文件扩展名范围，如果为空则使用默认支持的扩展名 |
| `fileFilter` | `(file: File) => boolean` | - | 自定义文件过滤函数 |

## 文件转换结果

`convertFile` 函数应返回以下结果类型之一：

### 图片结果
```typescript
{
  kind: 'Image';
  url: string;
  width: number;
  height: number;
  crossOrigin?: boolean;
}
```

### 媒体结果
```typescript
{
  kind: 'MediaPlayer';
  title: string;
  url: string;
}
```

### 文档结果
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

// Word/其他文档
{
  kind: 'DocsViewer';
  title: string;
  taskId: string;
  scenes: SceneDefinition[];
  scenePath?: string;
}
```

### 自定义文档插件结果
```typescript
{
  kind: string;
  options?: AddAppOptions;
  attributes?: Record<string, unknown>;
}
```

> **注意**: 文档转换完成后,能否能正确打开,还需要确认项目中是否已经对相应的netless-app插件进行注册. 其中` @netless/fastboard` 内部已经集成了 `DocsViewer`、`Slide`、`MediaPlayer`、`Image`. 而 `@netless/window-manager` 内部只集成了`DocsViewer`、`MediaPlayer`. 
>
### 注册插件
如果还需其它类型文件打开,需要主动注册相应的插件.具体如下:

1. `PDFjs`,具体参考[netless-app-pdfjs](https://github.com/netless-io/netless-app-pdfjs)
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

2. 新版`DocsViewer`,具体参考[netless-app-presentation](https://github.com/netless-io/netless-app-presentation)
```typescript
// import { WindowManager } from "@netless/window-manager";
import { register } from "@netless/fastboard"
import { install } from "@netless/app-presentation"

// install(WindowManager.register, { as: 'DocsViewer' })
install(register, { as: 'DocsViewer' })
```

## 完整示例
参考 [`example`](https://github.com/netless-io/window-manager-extend/blob/main/example/src/main.tsx)

## API 参考

### ExtendPastePlugin 类

#### 属性
- `convertList: string[]` - 当前正在转换的文件列表
- `windowManager: WindowManager` - 窗口管理器实例引用
- `isWritable: boolean` - 房间是否可写

#### 方法
- `mount(): void` - 挂载插件并开始监听事件
- `unMount(): void` - 卸载插件并移除事件监听器
- `onCreate(): void` - 插件创建时调用
- `onDestroy(): void` - 插件销毁时调用

## 事件

插件会发出以下事件：

### `convertListChange`
当转换列表发生变化时触发。

```typescript
{
  operation: 'add' | 'delete' | 'update';
  value: string;
  list: string[];
}
```

## 许可证

MIT

## 相关项目

- [@netless/window-manager](https://github.com/netless-io/window-manager) - 核心窗口管理器库
- [@netless/fastboard](https://github.com/netless-io/fastboard) - 快速白板解决方案