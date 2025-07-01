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

## 快速开始

### 安装

```bash
# 安装粘贴扩展插件
npm install @netless/window-manager-paste-extend
# 或
yarn add @netless/window-manager-paste-extend
# 或
pnpm add @netless/window-manager-paste-extend
```

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
│   └── paste/                 # 粘贴扩展插件
│       ├── src/              # 源代码
│       ├── dist/             # 构建输出
│       └── README.md         # 插件文档
├── example/                  # 示例应用
│   ├── src/                 # 示例源代码
│   └── README.md            # 示例文档
├── service/                 # 后端服务
└── dev/                     # 开发工具
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
