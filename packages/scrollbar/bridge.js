import {
  ExtendScrollbarPlugin,
  bindWhiteWebSdkBridgeRuntime,
} from "./dist/extend-scrollbar.esm.js";

export async function loadExtendScrollbarPluginBridge(runtime) {
  bindWhiteWebSdkBridgeRuntime(runtime);
  return { ExtendScrollbarPlugin };
}
