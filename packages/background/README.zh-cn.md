# @netless/window-manager-background-extend

Netless Window Manager 的背景扩展插件，允许为主视图设置自定义背景图片、颜色和透明度。

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

// 创建插件实例
const backgroundPlugin = new ExtendBackgroundPlugin();

// 注册到窗口管理器
fastboard.manager.useExtendPlugin(backgroundPlugin);
```

### 设置背景图片

```typescript
// 设置背景图片
backgroundPlugin.setBackgroundImage({
  url: "https://example.com/background.jpg",
  width: 1920,
  height: 1080,
  crossOrigin: 'anonymous' // 可选
});
```

### 设置背景颜色

```typescript
// 设置背景颜色
backgroundPlugin.setBackgroundColor('#f0f0f0');
```

### 设置背景透明度

```typescript
// 设置背景透明度 (0-1)
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

// 监听主视图挂载事件
fastboard.manager.emitter.on('onMainViewMounted', (view) => {
  const { width, height } = view.size;
  
  // 设置背景图片
  backgroundPlugin.setBackgroundImage({
    url: "https://example.com/background.jpg",
    width,
    height,
    crossOrigin: 'anonymous'
  });
  
  // 或者设置背景颜色
  backgroundPlugin.setBackgroundColor('#ffffff');
  
  // 或者设置透明度
  backgroundPlugin.setBackgroundOpacity(0.9);
});
```

## API 参考

### ExtendBackgroundPlugin

#### 方法

- `setBackgroundImage(image: ExtendBackgroundImage)` - 设置背景图片
- `setBackgroundColor(color: string)` - 设置背景颜色
- `setBackgroundOpacity(opacity: number)` - 设置背景透明度 (0-1)

#### 类型定义

```typescript
interface ExtendBackgroundImage {
  url: string;           // 图片URL
  width: number;         // 图片宽度
  height: number;        // 图片高度
  crossOrigin?: string;  // 跨域设置
}

interface ExtendBackgroundOptions {
  color?: string;        // 背景颜色
  opacity?: number;     // 背景透明度 (0-1)
  image?: ExtendBackgroundImage; // 背景图片
}
```

## 事件

插件会发出以下事件：

- `loadError` - 当背景图片加载失败时触发

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
