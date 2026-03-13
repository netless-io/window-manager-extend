# @netless/window-manager-background-extend

Netless Window Manager 的背景扩展插件，允许为主视图设置自定义背景图片、背景颜色和背景层透明度。背景与白板主视图同步缩放与平移。

## 安装

```bash
npm install @netless/window-manager-background-extend
# 或者
pnpm add @netless/window-manager-background-extend
# 或者
yarn add @netless/window-manager-background-extend
```

## 使用方法

### 基础设置

```typescript
import { ExtendBackgroundPlugin } from '@netless/window-manager-background-extend';

// 创建插件实例（可传入初始选项）
const backgroundPlugin = new ExtendBackgroundPlugin({
  color: '#f0f0f0',
  opacity: 0.9,
});

// 注册到窗口管理器
fastboard.manager.useExtendPlugin(backgroundPlugin);
```

### 设置背景原点尺寸（使用背景图时必调）

使用背景图片前，需要先设置主视图的「原点尺寸」与缩放，以便背景图随视角正确缩放与平移。通常在主视图挂载或重绑定时调用一次。

```typescript
// 在主视图挂载后设置
fastboard.manager.emitter.on('onMainViewMounted', (view) => {
  const { width, height } = view.size;
  backgroundPlugin.setOriginBound({
    width,
    height,
    scale: 1,
  });
});
```

### 设置背景图片

```typescript
// 设置背景图片（仅需 url，可选 crossOrigin）
backgroundPlugin.setBackgroundImage({
  url: 'https://example.com/background.jpg',
  crossOrigin: 'anonymous', // 可选，用于跨域图片
});
```

> **注意**：背景图只有在调用过 `setOriginBound` 后才会渲染；且需在**可写房间**下调用，否则会抛错。

### 设置背景颜色

```typescript
backgroundPlugin.setBackgroundColor('#f0f0f0');
```

### 设置背景透明度

```typescript
// 设置背景层整体透明度 (0–1)
backgroundPlugin.setBackgroundOpacity(0.8);
```

### 完整示例

```typescript
import { createFastboard } from '@netless/fastboard';
import { ExtendBackgroundPlugin } from '@netless/window-manager-background-extend';

const fastboard = await createFastboard({
  // ... 你的配置
});

const backgroundPlugin = new ExtendBackgroundPlugin();
fastboard.manager.useExtendPlugin(backgroundPlugin);

fastboard.manager.emitter.on('onMainViewMounted', (view) => {
  const { width, height } = view.size;

  // 1. 先设置原点尺寸（使用背景图时必选）
  backgroundPlugin.setOriginBound({ width, height, scale: 1 });

  // 2. 设置背景图片
  backgroundPlugin.setBackgroundImage({
    url: 'https://example.com/background.jpg',
    crossOrigin: 'anonymous',
  });

  // 或设置背景颜色
  backgroundPlugin.setBackgroundColor('#ffffff');

  // 或设置透明度
  backgroundPlugin.setBackgroundOpacity(0.9);
});
```

## API 参考

### ExtendBackgroundPlugin

#### 构造函数

- `new ExtendBackgroundPlugin(options?: ExtendBackgroundOptions)`  
  可选传入初始背景选项（颜色、透明度、图片、原点尺寸等）。

#### 方法

- `setOriginBound(bound: { width: number; height: number; scale: number })`  
  设置主视图原点尺寸与缩放，使用背景图前必须调用；需在可写房间下调用。

- `setBackgroundImage(image?: ExtendBackgroundImage)`  
  设置或清除背景图片；需在可写房间下调用，且已调用过 `setOriginBound` 时背景图才会显示。

- `setBackgroundColor(color: string)`  
  设置背景颜色；需在可写房间下调用。

- `setBackgroundOpacity(opacity: number)`  
  设置背景层透明度 (0–1)；需在可写房间下调用。

> 所有 `set*` 方法在房间不可写时会抛出错误。

#### 类型定义

```typescript
interface ExtendBackgroundImage {
  url: string;           // 图片 URL
  crossOrigin?: string;  // 可选，如 'anonymous'
}

interface ExtendBackgroundOptions {
  color?: string;        // 背景颜色
  opacity?: number;     // 背景透明度 (0–1)
  image?: ExtendBackgroundImage; // 背景图片
  originBound?: {        // 主视图原点尺寸（影响背景图缩放与平移）
    width: number;
    height: number;
    scale: number;
  };
}
```

## 事件

- `loadError` — 背景图片加载失败时触发，回调参数为图片 `url`。

```typescript
backgroundPlugin.on('loadError', (url) => {
  console.error('背景图片加载失败:', url);
});
```

## 依赖要求

- `@netless/window-manager`: >=1.0.6
- `white-web-sdk`: >=2.16.53

## 许可证

MIT
