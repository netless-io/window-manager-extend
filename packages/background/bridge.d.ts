import type {
  ExtendBackgroundPlugin,
  WhiteWebSdkBridgeRuntime,
} from "./dist/index";

export type { WhiteWebSdkBridgeRuntime } from "./dist/index";

export declare function loadExtendBackgroundPluginBridge(
  runtime: WhiteWebSdkBridgeRuntime,
): Promise<{
  ExtendBackgroundPlugin: typeof ExtendBackgroundPlugin;
}>;
