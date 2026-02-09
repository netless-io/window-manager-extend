# window-manager-extend

[@netless/window-manager](https://github.com/netless-io/window-manager) 的扩展插件集合，用于增强白板功能。

## 插件包

### [@netless/window-manager-paste-extend](./packages/paste)

一个功能强大的粘贴和拖拽扩展插件，支持文件转换并插入到白板应用中。

**功能特性：**
- 📋 直接从剪贴板粘贴文本、图片和文件
- 🖱️ 从电脑拖拽文件到白板
- 🔄 将各种文件类型（PDF、PPT、DOC、图片、视频）转换为白板兼容格式
- 🎨 内置上传进度UI，支持自定义语言
- ⚙️ 丰富的配置选项，支持文件过滤和转换逻辑
- 🛡️ 对粘贴的文本内容进行XSS防护
- 📱 支持多种语言（英文、中文）

**支持的文件类型：**
- 图片：`.jpg`, `.jpeg`, `.png`, `.webp`
- 视频：`.mp4`, `.mpeg`
- 文档：`.ppt`, `.pptx`, `.doc`, `.pdf`

---

### [@netless/window-manager-ai-extend](./packages/ai)

基于 OpenRouter API 的 AI 对话扩展插件，支持多模态输入、流式响应、截图和思维导图导出。

**功能特性：**
- 🤖 AI 对话，支持多种模型与自动获取免费模型列表
- 🖼️ 多模态输入（文本 + 图片）
- 📸 手动截图、自动截图、快照，截图可直接发给 AI
- 💬 流式响应，支持推理过程与最终输出分离
- 📝 Markdown 渲染与代码高亮
- 🗺️ 将 Markdown 导出为思维导图并添加到白板
- 💾 IndexedDB 持久化聊天记录，多会话管理
- 🏷️ 多标签页会话
- 🌐 中英文界面

---

### [@netless/window-manager-background-extend](./packages/background)

为主视图设置自定义背景的扩展插件，支持背景图、颜色和透明度。

**功能特性：**
- 🖼️ 自定义背景图片（URL、尺寸、跨域）
- 🎨 背景颜色
- 🔲 背景透明度 (0–1)
- 📢 背景图加载失败时触发 `loadError` 事件

---

### [@netless/window-manager-maths-kit-extend](./packages/maths-kit)

数学工具包扩展，在白板主视图和应用视图上提供数学工具与标注。

**功能特性：**
- 📐 数学工具与标注
- 🎨 浅色/深色主题
- 📱 可绑定主视图与应用视图
- 🔒 只读模式
- 🔄 状态与相机在多端同步
- ⚡ 动态创建、更新、删除数学工具

---

### [@netless/window-manager-scrollbar-extend](./packages/scrollbar)

为白板主视图提供可拖拽的自定义滚动条，便于在大型内容区域导航。

**功能特性：**
- 🎯 内容超出视口时自动显示水平/垂直滚动条
- 🖱️ 拖拽滚动条导航白板
- 📏 根据缩放与内容尺寸自动调整滚动条
- 🔒 只读模式下可隐藏
- ⚙️ 可配置原始尺寸与只读状态

---

### [@netless/window-manager-wheel-extend](./packages/wheel)

滚轮扩展插件，支持通过鼠标滚轮滚动主视图及 Presentation、DocsViewer、Slide 等应用。

**功能特性：**
- 🖱️ 主视图与应用内鼠标滚轮滚动
- 📱 支持 Presentation、DocsViewer、Slide
- 🔒 只读模式
- 📏 可配置滚动边界
- ⚡ 可自定义中断器控制是否阻止白板滚动

---

## 快速开始

### 安装

按需安装所需插件：

```bash
# 粘贴扩展
pnpm add @netless/window-manager-paste-extend

# AI 对话扩展
pnpm add @netless/window-manager-ai-extend

# 背景扩展
pnpm add @netless/window-manager-background-extend

# 数学工具包扩展
pnpm add @netless/window-manager-maths-kit-extend

# 滚动条扩展
pnpm add @netless/window-manager-scrollbar-extend

# 滚轮扩展
pnpm add @netless/window-manager-wheel-extend
```

也可使用 `npm install` 或 `yarn add` 替代 `pnpm add`。各插件详细用法见对应目录下的 README（如 [packages/ai/README.zh-cn.md](./packages/ai/README.zh-cn.md)）。

### 基本使用

```typescript
import { ExtendPastePlugin } from '@netless/window-manager-paste-extend';

const pastePlugin = new ExtendPastePlugin({
  language: 'zh-CN',
  useDrop: true,
  convertFile: async (file) => {
    // 你的文件转换逻辑
    // 返回 PasteFileResult 或 null
  }
});

// 注册到窗口管理器
windowManager.useExtendPlugin(pastePlugin);
```

## 开发

### 环境要求

- Node.js 16+
- pnpm 8+

### 设置

```bash
# 克隆仓库
git clone https://github.com/netless-io/window-manager-extend.git
cd window-manager-extend

# 安装依赖
pnpm install

# 启动开发模式
pnpm dev
```

### 项目结构

```
window-manager-extend/
├── packages/
│   ├── paste/                 # 粘贴扩展 @netless/window-manager-paste-extend
│   ├── ai/                    # AI 对话扩展 @netless/window-manager-ai-extend
│   ├── background/            # 背景扩展 @netless/window-manager-background-extend
│   ├── maths-kit/             # 数学工具包扩展 @netless/window-manager-maths-kit-extend
│   ├── scrollbar/             # 滚动条扩展 @netless/window-manager-scrollbar-extend
│   └── wheel/                 # 滚轮扩展 @netless/window-manager-wheel-extend
├── example/                  # 示例应用
├── service/                  # 后端服务
└── dev/                      # 开发工具
```

### 可用脚本

- `pnpm dev` - 启动所有包的开发模式
- `pnpm lint` - 在所有包上运行 ESLint
- `pnpm lint:fix` - 自动修复 ESLint 问题
- `pnpm clear` - 清理构建输出

## 示例

查看 [example](./example) 目录获取完整的集成示例，包括：

- Fastboard 集成
- Window Manager 集成
- 文件上传和转换
- 插件注册

## 贡献

1. Fork 本仓库
2. 创建你的功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交你的更改 (`git commit -m '添加一些很棒的功能'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开一个 Pull Request

## 许可证

MIT

## 相关项目

- [@netless/window-manager](https://github.com/netless-io/window-manager) - 核心窗口管理器库
- [@netless/fastboard](https://github.com/netless-io/fastboard) - 快速白板解决方案
- [@netless/app-presentation](https://github.com/netless-io/netless-app-presentation) - 文档演示插件
- [@netless/app-pdfjs](https://github.com/netless-io/netless-app-pdfjs) - PDF 查看器插件
