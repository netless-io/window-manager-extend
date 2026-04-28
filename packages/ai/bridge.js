export async function loadExtendAIPluginBridge() {
  const { ExtendAIPlugin } = await import("./dist/extend-ai.esm.js");
  return { ExtendAIPlugin };
}
