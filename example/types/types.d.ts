/* eslint-disable @typescript-eslint/no-explicit-any */
export {}
declare global {
    interface Window {
      __netlessMobXUseProxies:any;
      player: any;
      room: any;
      fastboard: any;
      fastboardUI: any;
      syncedStore: any;
      appliancePlugin: any;
      appInMainViewPlugin: any;
      manager: any;
      clipboardData: any;
      backgroundPlugin: any;
      scrollbarPlugin: any;
      getSelection(): Selection;
    }
}