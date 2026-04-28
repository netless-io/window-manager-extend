export async function loadExtendMathsKitPluginBridge(
  whiteWebSdkRuntime,
  windowManagerRuntime,
) {
  const bridgeModule = await import("./dist/extend-maths-kit.bridge.esm.js");
  bridgeModule.bindWhiteWebSdkBridgeRuntime(whiteWebSdkRuntime);
  bridgeModule.bindWindowManagerBridgeRuntime(windowManagerRuntime);
  return bridgeModule;
}
