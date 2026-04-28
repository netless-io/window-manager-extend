import type { ExtendContext, ExtendPlugin as WindowManagerExtendPlugin } from '@netless/window-manager';

export interface WindowManagerBridgeRuntime {
  ExtendPlugin?: typeof WindowManagerExtendPlugin;
}

export function bindWindowManagerBridgeRuntime(_nextRuntime?: WindowManagerBridgeRuntime) {
  // The bridge bundle embeds a compatible ExtendPlugin base class and does not
  // need to import the external window-manager runtime in full mode.
}

class BridgeEmitter {
  private listeners = new Map<string | symbol, Set<(payload: unknown) => void>>();

  on(eventName: string | symbol, listener: (payload: unknown) => void) {
    let listeners = this.listeners.get(eventName);
    if (!listeners) {
      listeners = new Set();
      this.listeners.set(eventName, listeners);
    }
    listeners.add(listener);
    return () => {
      listeners?.delete(listener);
    };
  }

  off(eventName: string | symbol, listener: (payload: unknown) => void) {
    this.listeners.get(eventName)?.delete(listener);
  }

  emit(eventName: string | symbol, payload?: unknown) {
    this.listeners.get(eventName)?.forEach(listener => {
      listener(payload);
    });
    return Promise.resolve();
  }
}

export abstract class ExtendPlugin extends BridgeEmitter {
  context!: ExtendContext;
  abstract readonly kind: string;
  protected _inject(context: ExtendContext) {
    this.context = context;
  }
  abstract onCreate(): void;
  abstract onDestroy(): void;
}
