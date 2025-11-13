# @netless/window-manager-wheel-extend

为 [@netless/window-manager](https://github.com/netless-io/window-manager) 提供的滚轮（鼠标滚动）扩展插件，支持通过鼠标滚轮滚动白板主视图和支持的应用，提供流畅的内容导航体验。

## 功能特性

- **🖱️ 鼠标滚轮滚动**: 支持通过鼠标滚轮滚动白板主视图
- **📱 应用支持**: 支持对特定应用类型（Presentation、DocsViewer、Slide）进行滚轮滚动
- **🔒 只读模式**: 支持只读模式，在只读模式下禁用滚轮滚动
- **📏 滚动边界**: 基于原始视图尺寸的可配置滚动边界
- **⚡ 中断器**: 可自定义的中断器函数，用于控制何时阻止白板滚动
- **🎯 灵活配置**: 可配置容器、激活的应用类型和滚动行为

## 安装

```bash
npm install @netless/window-manager-wheel-extend
# 或者
pnpm add @netless/window-manager-wheel-extend
# 或者
yarn add @netless/window-manager-wheel-extend
```

## 使用方法

### 基础设置

```typescript
import { ExtendWheelPlugin } from '@netless/window-manager-wheel-extend';

// 创建插件实例
const wheelPlugin = new ExtendWheelPlugin({
  readonly: false,
  activeKinds: ['Presentation', 'DocsViewer', 'Slide'],
  container: document.body
});

// 注册到窗口管理器
fastboard.manager.useExtendPlugin(wheelPlugin);
```

### 只读模式

```typescript
// 创建只读滚轮插件（滚轮滚动将被禁用）
const wheelPlugin = new ExtendWheelPlugin({
  readonly: true,
  activeKinds: ['Presentation', 'DocsViewer', 'Slide']
});

fastboard.manager.useExtendPlugin(wheelPlugin);
```

### 设置滚动边界

```typescript
const { width, height } = fastboard.manager.mainView.size;
const { scale } = fastboard.manager.mainView.camera;

const wheelPlugin = new ExtendWheelPlugin({
  readonly: false,
  activeKinds: ['Presentation', 'DocsViewer', 'Slide'],
  originMainViewBound: {
    width,
    height,
    scale
  }
});

fastboard.manager.useExtendPlugin(wheelPlugin);
```

### 使用中断器

```typescript
const wheelPlugin = new ExtendWheelPlugin({
  readonly: false,
  activeKinds: ['Presentation', 'DocsViewer', 'Slide'],
  interrupter: (e: WheelEvent) => {
    // 返回 true 以阻止白板滚动
    // 返回 false 以允许白板滚动
    const target = e.target as HTMLElement;
    if (target.closest('.custom-scrollable-area')) {
      return true; // 当滚动自定义区域时阻止白板滚动
    }
    return false; // 允许白板滚动
  }
});

fastboard.manager.useExtendPlugin(wheelPlugin);
```

### 动态配置

```typescript
const wheelPlugin = new ExtendWheelPlugin({
  readonly: true,
  activeKinds: ['Presentation', 'DocsViewer']
});

fastboard.manager.useExtendPlugin(wheelPlugin);

// 动态设置只读状态
wheelPlugin.setReadonly(false); // 启用滚轮滚动
wheelPlugin.setReadonly(true);  // 禁用滚轮滚动

// 设置原始主视图边界
wheelPlugin.setOriginMainViewBound({
  width: 1920,
  height: 1080,
  scale: 1
});

// 动态设置中断器
wheelPlugin.setInterrupter((e: WheelEvent) => {
  // 你的自定义逻辑
  return false;
});

// 移除中断器（允许所有滚动）
wheelPlugin.setInterrupter(undefined);
```

### 完整示例

```typescript
import { createFastboard } from '@netless/fastboard';
import { ExtendWheelPlugin } from '@netless/window-manager-wheel-extend';

const fastboard = await createFastboard({
  // ... 你的配置
});

// 初始化滚轮插件
const wheelPlugin = new ExtendWheelPlugin({
  readonly: true,
  activeKinds: ['Presentation', 'DocsViewer', 'Slide'],
  container: document.body
});

fastboard.manager.useExtendPlugin(wheelPlugin);

// 当主视图准备就绪时设置原始边界
if (fastboard.manager) {
  const { width, height } = fastboard.manager.mainView.size;
  const { scale } = fastboard.manager.mainView.camera;
  
  wheelPlugin.setOriginMainViewBound({
    width,
    height,
    scale
  });
  
  // 如果用户有写入权限，启用滚轮滚动
  if (fastboard.room.isWritable) {
    wheelPlugin.setReadonly(false);
  }
}
```

## 配置选项

### ExtendWheelOptions

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `readonly` | `boolean` | `false` | 是否启用滚轮滚动。当为 `true` 时，滚轮滚动将被禁用 |
| `activeKinds` | `string[]` | **必需** | 支持滚轮滚动的应用类型数组（例如：`['Presentation', 'DocsViewer', 'Slide']`） |
| `container` | `HTMLElement` | `undefined` | 附加滚轮事件监听器的容器元素。默认为 `windowManagerContainer` |
| `originMainViewBound` | `{ width: number, height: number, scale: number }` | `undefined` | 用于计算滚动边界的原始主视图尺寸和缩放比例 |
| `interrupter` | `(e: WheelEvent) => boolean` | `undefined` | 用于确定是否阻止白板滚动的函数。返回 `true` 阻止滚动，返回 `false` 允许滚动 |

## API 参考

### ExtendWheelPlugin

#### 方法

- `setReadonly(readonly: boolean)` - 动态设置只读状态。当为 `true` 时，禁用滚轮滚动
- `setOriginMainViewBound(bound: { width: number, height: number, scale: number })` - 设置用于滚动边界计算的原始主视图边界
- `setInterrupter(interrupter?: (e: WheelEvent) => boolean)` - 设置或移除中断器函数。传入 `undefined` 以移除

#### 属性

- `windowManager: WindowManager` - 窗口管理器实例的引用
- `container: HTMLElement | undefined` - 滚轮事件的容器元素
- `isWritable: boolean` - 房间是否可写
- `mainView` - 主视图的引用
- `mainViewElement` - 主视图 DOM 元素的引用
- `focusedView: View` - 当前聚焦的视图
- `focusedId: string` - 当前聚焦视图的 ID
- `activeKinds: string[]` - 支持滚轮滚动的应用类型数组

## 工作原理

滚轮插件执行以下操作：

1. **监听滚轮事件**: 在指定的容器（或窗口管理器容器）上附加滚轮事件监听器
2. **检查中断器**: 如果设置了中断器，调用它以确定是否阻止滚动
3. **处理应用滚动**: 如果聚焦的应用匹配 `activeKinds`，使用应用特定的滚动方法：
   - `Presentation`: 使用 `moveCamera` 方法
   - `Slide`: 使用 `translateView` 方法
4. **处理主视图滚动**: 根据滚轮增量值滚动主视图相机
5. **遵守边界**: 如果设置了 `originMainViewBound`，计算并强制执行滚动边界
6. **阻止默认行为**: 在适当的时候阻止浏览器默认滚动行为

## 支持的应用类型

插件支持以下应用类型的滚轮滚动：

- **Presentation** (`@netless/app-presentation`): 使用 `moveCamera` 滚动演示文稿
- **DocsViewer**: 使用 `moveCamera` 滚动文档查看器
- **Slide** (`@netless/app-slide`): 使用 `translateView` 滚动幻灯片

## 系统要求

- `@netless/window-manager`: >=1.0.6
- `white-web-sdk`: >=2.16.53
- `@netless/app-presentation`: >=0.1.9-beta.8 (可选，用于 Presentation 支持)
- `@netless/app-slide`: >=0.2.87-beta.0 (可选，用于 Slide 支持)

## 许可证

MIT


