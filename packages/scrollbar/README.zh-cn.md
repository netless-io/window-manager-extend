# @netless/window-manager-scrollbar-extend

为 [@netless/window-manager](https://github.com/netless-io/window-manager) 提供的滚动条扩展插件，为白板主视图提供可自定义的滚动条，让用户能够通过直观的拖拽控制来导航大型内容区域。

## 功能特性

- **🎯 自定义滚动条**: 当内容超出视口时自动显示水平和垂直滚动条
- **🖱️ 拖拽导航**: 直观的拖拽交互来导航白板
- **📏 自动调整大小**: 滚动条根据缩放级别和内容尺寸自动调整大小
- **🔒 只读模式**: 支持只读模式，在只读模式下隐藏滚动条
- **⚙️ 灵活配置**: 可配置原始尺寸和只读状态
- **🎨 样式化 UI**: 简洁现代的滚动条设计，带有 CSS 样式

## 安装

```bash
npm install @netless/window-manager-scrollbar-extend
# 或者
pnpm add @netless/window-manager-scrollbar-extend
# 或者
yarn add @netless/window-manager-scrollbar-extend
```

## 使用方法

### 基础设置

```typescript
import { ExtendScrollbarPlugin } from '@netless/window-manager-scrollbar-extend';

// 创建插件实例
const scrollbarPlugin = new ExtendScrollbarPlugin({
  readonly: false, // 启用滚动条
  originSize: {
    width: 1920,
    height: 1080
  }
});

// 注册到窗口管理器
fastboard.manager.useExtendPlugin(scrollbarPlugin);
```

### 只读模式

```typescript
// 创建只读滚动条插件（滚动条将被隐藏）
const scrollbarPlugin = new ExtendScrollbarPlugin({
  readonly: true
});

fastboard.manager.useExtendPlugin(scrollbarPlugin);
```

### 动态配置

```typescript
const scrollbarPlugin = new ExtendScrollbarPlugin();

// 动态设置只读状态
scrollbarPlugin.setReadonly(true);  // 隐藏滚动条
scrollbarPlugin.setReadonly(false); // 显示滚动条

// 设置原始尺寸（必须在可写房间中调用）
scrollbarPlugin.setOriginSize({
  width: 2560,
  height: 1440
});
```

### 完整示例

```typescript
import { createFastboard } from '@netless/fastboard';
import { ExtendScrollbarPlugin } from '@netless/window-manager-scrollbar-extend';

const fastboard = await createFastboard({
  // ... 你的配置
});

const scrollbarPlugin = new ExtendScrollbarPlugin({
  readonly: false,
  originSize: {
    width: 1920,
    height: 1080
  }
});

fastboard.manager.useExtendPlugin(scrollbarPlugin);

// 监听主视图挂载事件
fastboard.manager.emitter.on('onMainViewMounted', (view) => {
  const { width, height } = view.size;
  
  // 根据视图尺寸设置原始尺寸
  scrollbarPlugin.setOriginSize({ width, height });
});
```

## 配置选项

### ExtendScrollbarOptions

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `readonly` | `boolean` | `false` | 是否显示滚动条。当为 `true` 时，滚动条将被隐藏 |
| `originSize` | `{ width: number, height: number }` | `undefined` | 用于滚动条计算的内容区域原始尺寸 |

## API 参考

### ExtendScrollbarPlugin

#### 方法

- `setReadonly(readonly: boolean)` - 动态设置只读状态
- `setOriginSize(size: { width: number, height: number })` - 设置用于滚动条计算的原始尺寸（需要可写房间）

#### 属性

- `windowManager: WindowManager` - 窗口管理器实例的引用
- `isWritable: boolean` - 房间是否可写
- `mainView` - 主视图的引用
- `mainViewElement` - 主视图 DOM 元素的引用

## 工作原理

滚动条插件自动执行以下操作：

1. **计算滚动范围**: 根据缩放级别和原始尺寸确定可滚动区域
2. **显示/隐藏滚动条**: 仅在内容超出视口时显示滚动条
3. **更新滚动条大小**: 根据可见内容比例调整滚动条滑块大小
4. **处理拖拽事件**: 将拖拽移动转换为相机移动，实现平滑导航
5. **遵守边界**: 防止滚动超出内容边界

## 样式定制

插件包含滚动条的内置 CSS 样式。您可以通过覆盖 CSS 类来自定义外观：

- `.window-manager-scrollbar-extend-ui-container` - 主容器
- `.window-manager-scrollbar-extend-ui-container-x` - 水平滚动条容器
- `.window-manager-scrollbar-extend-ui-container-y` - 垂直滚动条容器
- `.window-manager-scrollbar-extend-ui-x` - 水平滚动条滑块
- `.window-manager-scrollbar-extend-ui-y` - 垂直滚动条滑块

## 系统要求

- `@netless/window-manager`: >=1.0.6
- `white-web-sdk`: >=2.16.53

## 许可证

MIT
