import {
  autorun as sdkAutorun,
  toJS as sdkToJS,
} from 'white-web-sdk';

export interface WhiteWebSdkBridgeRuntime {
  autorun: typeof import('white-web-sdk').autorun;
  toJS: typeof import('white-web-sdk').toJS;
}

let runtime: WhiteWebSdkBridgeRuntime = {
  autorun: sdkAutorun,
  toJS: sdkToJS,
};

export function bindWhiteWebSdkBridgeRuntime(nextRuntime: WhiteWebSdkBridgeRuntime) {
  runtime = nextRuntime;
}

export const autorun: typeof sdkAutorun = ((...args: Parameters<typeof sdkAutorun>) =>
  runtime.autorun(...args)) as typeof sdkAutorun;

export const toJS: typeof sdkToJS = ((...args: Parameters<typeof sdkToJS>) =>
  runtime.toJS(...args)) as typeof sdkToJS;
