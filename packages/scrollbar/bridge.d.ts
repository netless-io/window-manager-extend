import type {
  ExtendScrollbarPlugin,
  WhiteWebSdkBridgeRuntime,
} from "./dist/index";

export type { WhiteWebSdkBridgeRuntime } from "./dist/index";

export declare function loadExtendScrollbarPluginBridge(
  runtime: WhiteWebSdkBridgeRuntime,
): Promise<{
  ExtendScrollbarPlugin: typeof ExtendScrollbarPlugin;
}>;
