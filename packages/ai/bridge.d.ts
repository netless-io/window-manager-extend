import type { ExtendAIPlugin } from "./dist/index";

export declare function loadExtendAIPluginBridge(): Promise<{
  ExtendAIPlugin: typeof ExtendAIPlugin;
}>;
