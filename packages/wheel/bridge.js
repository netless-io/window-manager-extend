export async function loadExtendWheelPluginBridge() {
  const { ExtendWheelPlugin } = await import("./dist/extend-wheel.esm.js");
  return { ExtendWheelPlugin };
}
