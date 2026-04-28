import {
  ExtendBackgroundPlugin,
  bindWhiteWebSdkBridgeRuntime,
} from "./dist/extend-background.esm.js";

export async function loadExtendBackgroundPluginBridge(runtime) {
  bindWhiteWebSdkBridgeRuntime(runtime);
  return { ExtendBackgroundPlugin };
}
