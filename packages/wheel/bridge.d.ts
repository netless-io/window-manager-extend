import type { ExtendWheelPlugin } from "./dist/index";

export declare function loadExtendWheelPluginBridge(): Promise<{
  ExtendWheelPlugin: typeof ExtendWheelPlugin;
}>;
