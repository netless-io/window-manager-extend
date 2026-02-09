# @netless/window-manager-maths-kit-extend

为 [@netless/window-manager](https://github.com/netless-io/window-manager) 提供的数学工具包扩展插件，支持在白板主视图和支持的应用上使用数学工具和标注，提供丰富的数学表达式功能。

## 功能特性

- **📐 数学工具**: 在白板视图上启用数学工具和标注
- **🎨 主题支持**: 支持浅色和深色主题
- **📱 多视图支持**: 支持绑定到主视图和应用视图
- **🔒 只读模式**: 支持只读模式，在只读模式下禁用数学工具
- **🔄 状态同步**: 在所有连接的客户端之间自动同步状态
- **📊 相机同步**: 当视图相机更新时自动同步相机缩放比例
- **⚡ 动态管理**: 动态创建、更新和删除数学工具

## 安装

```bash
npm install @netless/window-manager-maths-kit-extend
# 或者
pnpm add @netless/window-manager-maths-kit-extend
# 或者
yarn add @netless/window-manager-maths-kit-extend
```

## 使用方法

### 基础设置

```typescript
import { ExtendMathsKitPlugin } from '@netless/window-manager-maths-kit-extend';

// 创建插件实例
const mathsKitPlugin = new ExtendMathsKitPlugin({
  readonly: false,
  bindMainView: true,
  bindAppViews: false,
  theme: 'light'
});

// 注册到窗口管理器
manager.useExtendPlugin(mathsKitPlugin);
```

### 只读模式

```typescript
// 创建只读数学工具包插件（数学工具将被禁用）
const mathsKitPlugin = new ExtendMathsKitPlugin({
  readonly: true,
  bindMainView: true,
  bindAppViews: false
});

manager.useExtendPlugin(mathsKitPlugin);
```

### 使用主题

```typescript
const mathsKitPlugin = new ExtendMathsKitPlugin({
  readonly: false,
  bindMainView: true,
  bindAppViews: false,
  theme: 'dark' // 或 'light'
});

manager.useExtendPlugin(mathsKitPlugin);
```

### 绑定应用视图

```typescript
const mathsKitPlugin = new ExtendMathsKitPlugin({
  readonly: false,
  bindMainView: true,
  bindAppViews: true // 为所有应用视图启用数学工具
});

manager.useExtendPlugin(mathsKitPlugin);
```

### 动态配置

```typescript
const mathsKitPlugin = new ExtendMathsKitPlugin({
  readonly: true,
  bindMainView: true,
  bindAppViews: false
});

manager.useExtendPlugin(mathsKitPlugin);

// 动态设置只读状态
mathsKitPlugin.setReadonly(false); // 启用数学工具
mathsKitPlugin.setReadonly(true);  // 禁用数学工具
```

### 创建数学工具

```typescript
import { MathsKitType } from '@netless/maths-kit';

// 在主视图上创建数学工具
mathsKitPlugin.create('mainView', MathsKitType.Pen, 'kit-1', {
  // 可选的初始状态
});

// 在应用视图上创建数学工具
mathsKitPlugin.create('app-id-123', MathsKitType.Pen, 'kit-2');
```

### 更新数学工具

```typescript
import { MathsKitState } from '@netless/maths-kit';

// 更新数学工具
const updatedState: MathsKitState = {
  type: MathsKitType.Pen,
  // ... 其他状态属性
};

mathsKitPlugin.update('mainView', 'kit-1', updatedState);
```

### 删除数学工具

```typescript
// 删除数学工具
mathsKitPlugin.remove('mainView', 'kit-1');
```

### 完整示例

```typescript
import { createFastboard } from '@netless/fastboard';
import { ExtendMathsKitPlugin } from '@netless/window-manager-maths-kit-extend';
import { MathsKitType } from '@netless/maths-kit';

const fastboard = await createFastboard({
  // ... 你的配置
});

// 初始化数学工具包插件
const mathsKitPlugin = new ExtendMathsKitPlugin({
  readonly: true,
  bindMainView: true,
  bindAppViews: false,
  theme: 'light'
});

fastboard.manager.useExtendPlugin(mathsKitPlugin);

// 如果用户有写入权限，启用数学工具
if (fastboard.room.isWritable) {
  mathsKitPlugin.setReadonly(false);
  
  // 创建数学工具
  mathsKitPlugin.create('mainView', MathsKitType.Pen, 'my-kit-1');
}
```

## 配置选项

### ExtendMathsKitOptions

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `readonly` | `boolean` | `false` | 是否启用数学工具。当为 `true` 时，工具将被禁用 |
| `theme` | `'light' \| 'dark'` | `undefined` | 数学工具 UI 的主题 |
| `bindMainView` | `boolean` | `true` | 是否将数学工具绑定到主视图 |
| `bindAppViews` | `boolean` | `false` | 是否将数学工具绑定到所有应用视图 |

## API 参考

### ExtendMathsKitPlugin

#### 方法

- `setReadonly(readonly: boolean)` - 动态设置只读状态。当为 `true` 时，禁用数学工具
- `create(appId: ViewId, type: MathsKitType, kitId?: MathsKitId, state?: Partial<MathsKitState>)` - 在指定视图上创建新的数学工具
- `update(appId: ViewId, kitId: MathsKitId, state: MathsKitState)` - 更新现有的数学工具
- `remove(appId: ViewId, kitId: MathsKitId)` - 删除数学工具

#### 属性

- `windowManager: WindowManager` - 窗口管理器实例的引用
- `isWritable: boolean` - 房间是否可写
- `localMathsKitViewData: ISerializableSyncMathsKitViewData` - 所有视图的当前本地数学工具数据

#### 类型

- `ViewId: 'mainView' | string` - 视图标识符（'mainView' 或应用 ID）
- `MathsKitId: string` - 数学工具标识符
- `ISerializableMathsKitData` - 单个视图的数学工具数据
- `ISerializableSyncMathsKitViewData` - 所有视图的数学工具数据

## 工作原理

数学工具包插件执行以下操作：

1. **创建 MathsKitManager 实例**: 为每个绑定的视图（主视图和/或应用视图）创建一个 `MathsKitManager`
2. **状态同步**: 使用 `autorun` 监控属性变化，在所有客户端之间同步数学工具状态
3. **相机同步**: 当视图相机更新时，自动更新数学工具的全局缩放比例
4. **生命周期管理**: 处理视图创建或销毁时数学工具管理器的挂载/卸载
5. **状态持久化**: 将数学工具状态存储在窗口管理器属性中，以实现持久化和同步

## 支持的视图

插件支持在以下视图上使用数学工具：

- **主视图**: 白板主视图（当 `bindMainView: true` 时）
- **应用视图**: 所有应用视图（当 `bindAppViews: true` 时）

## 依赖要求

- `@netless/window-manager`: >=1.0.6
- `white-web-sdk`: >=2.16.53
- `@netless/maths-kit`: 0.0.6

## 许可证

MIT

