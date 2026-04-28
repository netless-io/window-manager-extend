import type { ExtendPastePlugin } from "./dist/index";
import type { WindowManagerBridgeRuntime } from "./dist/window-manager-runtime";

export type { WindowManagerBridgeRuntime } from "./dist/window-manager-runtime";

export declare function loadExtendPastePluginBridge(
  runtime?: WindowManagerBridgeRuntime,
): Promise<{
  ExtendPastePlugin: typeof ExtendPastePlugin;
}>;
