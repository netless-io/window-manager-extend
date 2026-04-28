export async function loadExtendPastePluginBridge(_runtime) {
  return import("./dist/extend-paste.bridge.esm.js");
}
