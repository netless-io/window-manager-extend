import type {
  ExtendMathsKitPlugin,
  WhiteWebSdkBridgeRuntime,
  WindowManagerBridgeRuntime,
} from "./dist/index";

export type { WhiteWebSdkBridgeRuntime, WindowManagerBridgeRuntime } from "./dist/index";

export declare function loadExtendMathsKitPluginBridge(
  whiteWebSdkRuntime: WhiteWebSdkBridgeRuntime,
  windowManagerRuntime?: WindowManagerBridgeRuntime,
): Promise<{
  ExtendMathsKitPlugin: typeof ExtendMathsKitPlugin;
}>;
