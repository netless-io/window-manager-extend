export interface WhiteWebSdkBridgeRuntime {
  autorun: typeof import('white-web-sdk').autorun;
  toJS: typeof import('white-web-sdk').toJS;
}

let runtime: WhiteWebSdkBridgeRuntime | undefined;

export function bindWhiteWebSdkBridgeRuntime(nextRuntime: WhiteWebSdkBridgeRuntime) {
  runtime = nextRuntime;
}

export const autorun: typeof import('white-web-sdk').autorun = ((...args) => {
  if (!runtime) {
    throw new Error('[@netless/window-manager-maths-kit-extend/bridge] white-web-sdk runtime has not been bound yet.');
  }
  return runtime.autorun(...args);
}) as typeof import('white-web-sdk').autorun;

export const toJS: typeof import('white-web-sdk').toJS = ((...args) => {
  if (!runtime) {
    throw new Error('[@netless/window-manager-maths-kit-extend/bridge] white-web-sdk runtime has not been bound yet.');
  }
  return runtime.toJS(...args);
}) as typeof import('white-web-sdk').toJS;
