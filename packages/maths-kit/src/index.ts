import { MathsKitManager, MathsKitState, MathsKitType } from '@netless/maths-kit';
import { ExtendContext, ExtendPlugin, type View, type WindowManager } from '@netless/window-manager';
import { difference, differenceWith, isEqual } from 'lodash';
import { autorun, RoomState, toJS } from 'white-web-sdk';

export type ExtendMathsKitOptions = {
  readonly?: boolean;
  theme?: 'light' | 'dark';
  bindMainView?: boolean;
  bindAppViews?: boolean;
}

export type MathsKitManagerItem = {
  manager: MathsKitManager;
  stateCallback: (operation: 'add' | 'delete' | 'update', key: string, value: MathsKitState) => void;
  cameraUpdatedCallback: () => void;
}

export type ViewId = 'mainView' | string;
export type MathsKitId = string;

export interface ISerializableMathsKitData {
  [key: MathsKitId]: MathsKitState;
}
export type ISerializableSyncMathsKitViewData = {
  [key: ViewId]: ISerializableMathsKitData;
};

export class ExtendMathsKitPlugin extends ExtendPlugin {
  readonly kind = 'extend-maths-kit';
  private isMounted: boolean = false;
  private isCreated: boolean = false;
  private options: ExtendMathsKitOptions;
  private mainViewMathsKitManager?: MathsKitManagerItem | undefined;
  private appViewMathsKitManagers: Map<string, MathsKitManagerItem> = new Map();
  private stateDisposer: (() => void) | null = null;
  constructor(options: ExtendMathsKitOptions) {
    super();
    this.options = {
      readonly: false,
      bindMainView: true,
      bindAppViews: false,
      ...options,
    };
  }

  get windowManager():WindowManager {
    return this.context.windowManager;
  }

  get isWritable() {
    return this.windowManager.room.isWritable;
  }

  get appliancePlugin() {
    return (this.windowManager as any)?._appliancePlugin;
  }

  get hasAppliancePlugin(){
    return !!this.appliancePlugin;
  }

  get attributes() {
    return this.windowManager.attributes;
  }

  get localMathsKitViewData() {
    const localMathsKitViewData: ISerializableSyncMathsKitViewData = {};
    const mainView = this.mainViewMathsKitManager;
    if (mainView) {
      const state = mainView.manager.state;
      if(state.size > 0) {
        if (!localMathsKitViewData.mainView) {
          localMathsKitViewData.mainView = {};
        }
        for (const [key, value] of state.entries()) {
          localMathsKitViewData.mainView[key] = value;
        }
      }
    }
    const appViewMathsKitManagers = this.appViewMathsKitManagers;
    if (appViewMathsKitManagers.size > 0) {
      for (const [appId, mathsKitManager] of appViewMathsKitManagers.entries()) {
        const state = mathsKitManager.manager.state;
        if(state.size > 0) {
          if (!localMathsKitViewData[appId]) {
            localMathsKitViewData[appId] = {};
          }
          for (const [key, value] of state.entries()) {
            localMathsKitViewData[appId][key] = value;
          }
        }
      }
    }
    return localMathsKitViewData;
  }

  get room() {
    return this.windowManager.room;
  }

  onDestroy(): void {
    this.unMount();
  }

  onCreate(): void {
    this.isCreated = true;
    this.mount();
    this.isMounted = true;
  }

  setReadonly(bol: boolean){
    this.options.readonly = bol;
    if (this.mainViewMathsKitManager) {
      this.mainViewMathsKitManager.manager.setActive(!bol);
    }
    Array.from(this.appViewMathsKitManagers.values()).forEach((mathsKitManager) => {
      mathsKitManager.manager.setActive(!bol);
    });
  }

  create(appId: ViewId, type: MathsKitType, kitId?: MathsKitId, state?: Partial<MathsKitState>): void {
    if(appId === 'mainView' && this.mainViewMathsKitManager) {
      this.mainViewMathsKitManager.manager.create(type, kitId, state);
      return;
    }
    const mathsKitManager = this.appViewMathsKitManagers.get(appId);
    if(!mathsKitManager) {
      return;
    }
    mathsKitManager.manager.create(type, kitId, state);
  }

  update(appId: ViewId, kitId:MathsKitId, state: MathsKitState){
    if(appId === 'mainView' && this.mainViewMathsKitManager) {
      this.mainViewMathsKitManager.manager.update(kitId,state);
      return;
    }
    const mathsKitManager = this.appViewMathsKitManagers.get(appId);
    if(!mathsKitManager) {
      return;
    }
    mathsKitManager.manager.update(kitId,state);
  }

  remove(appId: ViewId, kitId:MathsKitId){
    if(appId === 'mainView' && this.mainViewMathsKitManager) {
      this.mainViewMathsKitManager.manager.remove(kitId);
      return;
    }
    const mathsKitManager = this.appViewMathsKitManagers.get(appId);
    if(!mathsKitManager) {
      return;
    }
    mathsKitManager.manager.remove(kitId);
  }

  private createMathsKitManager(appId: string): void {
    let view: View | undefined;
    if (appId === 'mainView') {
      if (this.mainViewMathsKitManager) {
        return;
      }
      view = this.windowManager.mainView;
    } else if(this.windowManager.queryOne(appId)) {
      if (this.appViewMathsKitManagers.has(appId)) {
        return;
      }
      view = this.windowManager.queryOne(appId)?.view;
    }
    if (!view) {
      return;
    }
    const target = (view.divElement as HTMLDivElement)?.firstChild as HTMLElement;
    if (!target) {
      return;
    }
    const mathsKitManagerContainer = this.createMathsKitManagerContainer(appId);
    (view.divElement?.parentElement as HTMLElement).appendChild(mathsKitManagerContainer);
    const mathsKitManager = new MathsKitManager({
      container: mathsKitManagerContainer,
      target,
      theme: this.options.theme,
      globalScale: view.camera.scale,
    });
    mathsKitManager.setActive(!this.options.readonly);
    const stateCallbackFun = (operation: 'add' | 'delete' | 'update', key: string, value: MathsKitState) => {
      if (this.options.readonly) {
        return;
      }
      switch (operation) {
        case 'add':
        case 'update': {
          if (!this.attributes.mathsKits) {
            this.windowManager.safeUpdateAttributes(['mathsKits'], {
              [appId]: {
                [key]: value,
              },
            });
          } else if (!this.attributes.mathsKits[appId]) {
            this.windowManager.safeUpdateAttributes(['mathsKits', appId], { [key]: value });
          } else {
            this.windowManager.safeUpdateAttributes(['mathsKits', appId, key], value);
          }
          break;
        }
        case 'delete':
          if (this.attributes.mathsKits && this.attributes.mathsKits[appId] && this.attributes.mathsKits[appId][key]) {
            const keys = Object.keys(this.attributes.mathsKits[appId]);
            if (keys.length === 1 && keys.includes(key)) {
              this.windowManager.safeUpdateAttributes(['mathsKits', appId], undefined);
            } else {
              this.windowManager.safeUpdateAttributes(['mathsKits', appId, key], undefined);
            }
          }
          break;
        default:
          break;
      }
    };
    if (appId === 'mainView') {
      this.mainViewMathsKitManager = {
        manager: mathsKitManager,
        stateCallback: stateCallbackFun,
        cameraUpdatedCallback: () => {
          if (this.mainViewMathsKitManager && this.windowManager.mainView && this.mainViewMathsKitManager.manager) {
            this.mainViewMathsKitManager.manager.globalScale = this.windowManager.mainView.camera.scale;
          }
        },
      };
      mathsKitManager.on('stateChange', this.mainViewMathsKitManager.stateCallback);
      view.callbacks.on('onCameraUpdated', this.mainViewMathsKitManager.cameraUpdatedCallback);
      return ;
    }
    const mathsKitManagerItem = {
      manager: mathsKitManager,
      stateCallback: stateCallbackFun,
      cameraUpdatedCallback: () => {
        const mathsKitManagerItem = this.appViewMathsKitManagers.get(appId);
        if (mathsKitManagerItem && mathsKitManagerItem.manager) {
          const view = this.windowManager.queryOne(appId)?.view;
          if (view) {
            mathsKitManagerItem.manager.globalScale = view.camera.scale;
          }
        }
      },
    };
    mathsKitManager.on('stateChange', mathsKitManagerItem.stateCallback);
    view.callbacks.on('onCameraUpdated', mathsKitManagerItem.cameraUpdatedCallback);
    this.appViewMathsKitManagers.set(appId, mathsKitManagerItem);
    const mathsKitViewData =(toJS(this.attributes.mathsKits) || {}) as ISerializableSyncMathsKitViewData;
    this.syncMathsKitViewData(appId, mathsKitViewData[appId]);
  }

  private roomStateChangeListener = (state: RoomState) => {
    if (state && state.memberState && state.memberState.currentApplianceName) {
      const currentApplianceName = state.memberState.currentApplianceName;
      if (this.mainViewMathsKitManager && this.mainViewMathsKitManager.manager) {
        const container = this.mainViewMathsKitManager.manager.container;
        if (container) {
          container.classList.toggle(`cursor-${currentApplianceName}`, this.isWritable);
        }
      }
      Object.keys(this.appViewMathsKitManagers).forEach((appId) => {
        const mathsKitManager = this.appViewMathsKitManagers.get(appId);
        if (mathsKitManager && mathsKitManager.manager) {
          const container = mathsKitManager.manager.container;
          if (container) {
            container.classList.toggle(`cursor-${currentApplianceName}`, this.isWritable);
          }
        }
      });
    }
  };

  protected _inject(context: ExtendContext): void {
    super._inject(context);
    if (!this.isCreated) {
      return;
    }
    if (this.isMounted) {
      this.unMount();
    }
    this.mount();
  }

  private createMathsKitManagerContainer(appId?: string): HTMLDivElement {
    const mathsKitContainer = document.createElement('div');
    mathsKitContainer.style.position = 'absolute';
    mathsKitContainer.style.top = '0';
    mathsKitContainer.style.left = '0';
    mathsKitContainer.style.width = '100%';
    mathsKitContainer.style.height = '100%';
    mathsKitContainer.style.zIndex = appId === 'mainView' ? '99' : '101';
    mathsKitContainer.style.touchAction = 'none';
    mathsKitContainer.classList.add('maths-kit-manager-container');
    return mathsKitContainer;
  }

  private onMainViewMountedHandler = () => {
    this.destroyMainViewMathsKitManager();
    this.createMathsKitManager('mainView');
  };

  private onAppViewMountedHandler = ({ appId }: {appId: string}) => {
    const mathsKitManager = this.appViewMathsKitManagers.get(appId);
    if (mathsKitManager) {
      this.destroyAppViewMathsKitManager(appId);
    }
    this.createMathsKitManager(appId);
  };

  private destroyMainViewMathsKitManager = () => {
    if (this.mainViewMathsKitManager) {
      this.windowManager.mainView.callbacks.off('onCameraUpdated',  this.mainViewMathsKitManager.cameraUpdatedCallback);
      this.mainViewMathsKitManager.manager.off('stateChange', this.mainViewMathsKitManager.stateCallback);
      this.mainViewMathsKitManager.manager.destroy();
      this.mainViewMathsKitManager = undefined;
    }
  };

  private destroyAppViewMathsKitManager = (appId: string) => {
    const mathsKitManager = this.appViewMathsKitManagers.get(appId);
    if (mathsKitManager) {
      const view = this.windowManager.queryOne(appId)?.view;
      if(view){
        view.callbacks.off('onCameraUpdated', mathsKitManager.cameraUpdatedCallback);
      }
      mathsKitManager.manager.off('stateChange', mathsKitManager.stateCallback);
      mathsKitManager.manager.destroy();
      this.appViewMathsKitManagers.delete(appId);
    }
  };

  private mount(): void {
    this.isMounted = true;
    if (this.options.bindMainView) {
      this.createMathsKitManager('mainView');
      this.windowManager.emitter.on('onMainViewMounted', this.onMainViewMountedHandler);
      this.windowManager.emitter.on('onMainViewRebind', this.onMainViewMountedHandler);
    }
    if (this.options.bindAppViews) {
      this.windowManager.queryAll().forEach((app) => {
        if (app && app.view) {
          this.createMathsKitManager(app.id);
        }
      });
      this.windowManager.emitter.on('appsChange', this.onAppsChangeHandler);
      this.windowManager.emitter.on('onAppViewMounted', this.onAppViewMountedHandler);
    }
    this.stateDisposer = autorun(() => {
      const mathsKitViewData =(toJS(this.attributes.mathsKits) || {}) as ISerializableSyncMathsKitViewData;
      if (!isEqual(mathsKitViewData, this.localMathsKitViewData)) {
        const syncKeys = Object.keys(mathsKitViewData);
        const localKeys = Object.keys(this.localMathsKitViewData);
        const removeDiff = difference(localKeys, syncKeys);
        removeDiff.forEach((viewId) => {
          const mathsKitManager = viewId === 'mainView' ? this.mainViewMathsKitManager : this.appViewMathsKitManagers.get(viewId);
          if (mathsKitManager && this.localMathsKitViewData && this.localMathsKitViewData[viewId]) {
            const keys = Object.keys(this.localMathsKitViewData[viewId]);
            keys.forEach((key) => {
              this.remove(viewId, key);
            });
          }
        });
        const syncValues = Object.keys(mathsKitViewData).length > 0 ? Object.entries(mathsKitViewData) : [];
        const localValues = Object.keys(this.localMathsKitViewData).length > 0 ? Object.entries(this.localMathsKitViewData) : [];
        const diff = differenceWith(syncValues, localValues, isEqual);
        diff.forEach(([viewId, mathsKitDatas]) => {
          if (mathsKitViewData[viewId]) {
            const mathsKitManager = viewId === 'mainView' ? this.mainViewMathsKitManager : this.appViewMathsKitManagers.get(viewId);
            if (!mathsKitManager) {
              // this.createMathsKitManager(viewId);
              return;
            }
            const syncKeys = Object.keys(mathsKitDatas);
            const localKeys = this.localMathsKitViewData[viewId] && Object.keys(this.localMathsKitViewData[viewId]) || [];
            const removeDiff = difference(localKeys, syncKeys);
            removeDiff.forEach((key) => {
              this.remove(viewId, key);
            });
            const syncData = syncKeys.length > 0 ? Object.entries(mathsKitDatas) : [];
            const localData = localKeys.length > 0 ? Object.entries(this.localMathsKitViewData[viewId]) : [];
            const diffDatas = difference(syncData, localData);
            diffDatas.forEach(([key, value]) => {
              if(mathsKitDatas[key]) {
                if (localData.find(([localKey,_value]) => localKey === key)) {
                  this.update(viewId, key, value);
                } else {
                  this.create(viewId, value.type, key, value);
                }
              } else {
                this.remove(viewId, key);
              }
            });
          }
        });
      } 
    });
    if(this.room){
      this.room.callbacks.on('onRoomStateChanged', this.roomStateChangeListener);
    }
  }

  private syncMathsKitViewData = (viewId: ViewId, mathsKitDatas: ISerializableMathsKitData) => {
    if (mathsKitDatas && Object.keys(mathsKitDatas).length > 0) {
      Object.entries(mathsKitDatas).forEach(([key, value]) => {
        if(mathsKitDatas[key]) {
          this.create(viewId, value.type, key, value);
        }
      });
    }
  };

  private onAppsChangeHandler = (apps:string[]) => {
    Array.from(this.appViewMathsKitManagers.keys()).forEach((appId) => {
      if (!apps.includes(appId)) {
        this.destroyAppViewMathsKitManager(appId);
        if(this.isWritable){
          this.windowManager.updateAttributes(['mathsKits', appId], undefined);
        }
      }
    });
  };

  private unMount(){
    if(this.options.bindMainView && this.mainViewMathsKitManager) {
      this.destroyMainViewMathsKitManager();
      this.windowManager.emitter.off('onMainViewMounted', this.onMainViewMountedHandler);
      this.windowManager.emitter.off('onMainViewRebind', this.onMainViewMountedHandler);
    }
    if(this.options.bindAppViews) {
      if (this.appViewMathsKitManagers.size > 0) {
        Array.from(this.appViewMathsKitManagers.keys()).forEach((appId) => {
          this.destroyAppViewMathsKitManager(appId);
        });
      }
      this.windowManager.emitter.off('appsChange', this.onAppsChangeHandler);
      this.windowManager.emitter.off('onAppViewMounted', this.onAppViewMountedHandler);
    }
    if(this.room){
      this.room.callbacks.off('onRoomStateChanged', this.roomStateChangeListener);
    }
    this.isMounted = false;
    this.stateDisposer?.();
    this.stateDisposer = null;
  }
}