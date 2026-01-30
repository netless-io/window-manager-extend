import { Plugin, Main_View_Id, EToolsKey, EvevtWorkState } from '@netless/appliance-plugin';

export type IRectType = {
    x: number;
    y: number;
    w: number;
    h: number;
};

export type AutoSnapshotRect = {
    centerX: number;
    centerY: number;
    width: number;
    height: number;
};

export type AutoSnapshotOptions = {
    /** Delay to take a snapshot, default is 2000ms */
    delay?: number;
    onGenerateSnapshots: (snapshotFile: File) => Promise<void>;
    onClipStateChange?: (isCliping: boolean) => void;
};

export type PointX = number;
export type PointY = number;
export type PointTimer = number;
export type AutdrawInk = [Array<PointX>, Array<PointY>, Array<PointTimer>];

export class AutoSnapshotPlugin extends Plugin {
  readonly kind = 'autoSnapshot';
  private localStorage: Set<string> = new Set();
  private excludeStorage: Set<string> = new Set();
  private timer?: number;
  private isActive: boolean = false;
  private scenePath?: string;
  private delay: number;
  private options: AutoSnapshotOptions;
  constructor(options: AutoSnapshotOptions) {
    super();
    this.delay = options.delay || 2000;
    this.options = options;
  }

  get viewId(): string {
    return this.control.viewContainerManager.focuedViewId || Main_View_Id;
  }

  get isActived(): boolean {
    return this.isActive;
  }

  get collector() {
    return this.control.collector;
  }
  
  get roomUuid() {
    return this.control.room?.uuid;
  }
  
  get suid(){
    return this.control.room?.uid;
  }
  onDestroy(): void {
    this.unMount();
  }
  onCreate(): void {}
  mount(): void {
    this.scenePath = this.control.viewContainerManager.getView(
      this.viewId,
    )?.focusScenePath;
    this.excludeStorage = this.getOwnStorage(this.viewId, this.scenePath);
    const key = this.control.worker.currentToolsData?.toolsType;
    key && this.onSetToolkey(key);
    this.callbacks('setToolkey', this.onSetToolkey.bind(this));
    this.callbacks('syncStorage', this.syncStorage.bind(this));
    this.callbacks('sceneChange', this.sceneChange.bind(this));
    this.callbacks('localEvent', this.localEvent.bind(this));
    this.options.onClipStateChange?.(true);
  }
  unMount() {
    this.timer && clearTimeout(this.timer);
    this.timer = undefined;
    this.excludeStorage.clear();
    this.localStorage.clear();
    this.removeCallback('setToolkey');
    this.removeCallback('syncStorage');
    this.removeCallback('sceneChange');
    this.removeCallback('localEvent');
    this.options.onClipStateChange?.(false);
  }
  private onSetToolkey(key: EToolsKey): void {
    if (key === EToolsKey.Pencil) {
      this.isActive = true;
    } else {
      if (this.isActive) {
        this.localStorage.clear();
        this.timer && clearTimeout(this.timer);
        this.timer = undefined;
      }
      this.isActive = false;
    }
  }
  private syncStorage(viewId: string, scenePath?: string) {
    if (!this.isActive || viewId !== this.viewId) {
      return;
    }
    if (!scenePath) {
      this.localStorage.clear();
      return;
    }
    const ids = this.getOwnStorage(this.viewId, scenePath);
    ids.forEach((id) => {
      this.localStorage.add(this.collector?.getLocalId(id) || id);
    });
  }
  private sceneChange(viewId: string, scenePath: string) {
    if (viewId === this.viewId) {
      this.scenePath = scenePath;
      this.excludeStorage = this.getOwnStorage(viewId, scenePath);
    }
    this.localStorage.clear();
  }
  private localEvent(viewId: string, eventState: EvevtWorkState) {
    if (
      viewId === this.viewId &&
            this.control.worker.currentToolsData?.toolsType === EToolsKey.Pencil
    ) {
      switch (eventState) {
        case EvevtWorkState.Start: {
          if (this.timer) {
            clearTimeout(this.timer);
            this.timer = undefined;
          }
          break;
        } 
        case EvevtWorkState.Done: {
          if (this.timer) {
            clearTimeout(this.timer);
          }
          this.timer = setTimeout(async () => {
            this.timer = undefined;
            const rect = await this.batchLocalDraw();
            if (!rect) {
              return;
            }
            const snapshotFile = await this.getSnapshot(rect);
            if (snapshotFile) {
              await this.options.onGenerateSnapshots(snapshotFile);
            }
          }, this.delay) as unknown as number;
          break;
        } 
        default:
          break;
      }
    }
  }
  private getOwnStorage(viewId?: string, scenePath?: string): Set<string> {
    if (!viewId || !scenePath) {
      return new Set();
    }
    const storage = this.collector?.storage[viewId]?.[scenePath];
    if (!storage) {
      return new Set();
    }
    const ids = Object.keys(storage).filter(
      (id) =>
        this.collector?.isOwn(id) &&
          storage[id]?.toolsType === EToolsKey.Pencil &&
          !this.excludeStorage.has(id),
    );
    return new Set(ids);
  }
  private computRect(rect1?: IRectType, rect2?: IRectType): IRectType | undefined {
    if (rect1 && rect2) {
      const x = Math.min(rect1.x, rect2.x);
      const y = Math.min(rect1.y, rect2.y);
      const maxX = Math.max(rect1.x + rect1.w, rect2.x + rect2.w);
      const maxY = Math.max(rect1.y + rect1.h, rect2.y + rect2.h);
      const w = maxX - x;
      const h = maxY - y;
      return { x, y, w, h };
    }
    return rect2 || rect1;
  }
  private async batchLocalDraw(): Promise<AutoSnapshotRect | undefined> {
    if (this.localStorage.size === 0) {
      return;
    }
    if (!this.scenePath) {
      return;
    }
    const storage = this.collector?.getStorageData(this.viewId, this.scenePath);
    if (!storage) {
      return undefined;
    }
    const _uuid = Date.now().toString();
    const info = await this.control.worker.getVNodeInfo(
      _uuid,
      this.viewId,
      Array.from(this.localStorage.values()),
    );
    if (!info) {
      return undefined;
    }
    const { vInfo, uuid } = info;
    if (uuid === _uuid && vInfo) {
      const result: AutoSnapshotRect = {
        centerX: 0,
        centerY: 0,
        width: 0,
        height: 0,
      };
      let r: IRectType | undefined;
      for (const item of vInfo) {
        if (item && item.rect) {
          r = this.computRect(r, item.rect);
        }
      }
      if (r) {
        result.centerX = Math.floor(r.x + r.w / 2);
        result.centerY = Math.floor(r.y + r.h / 2);
        result.width = Math.floor(r.w);
        result.height = Math.floor(r.h);
      }
      return result;
    }
    return undefined;
  }
  private async getSnapshot(rect: AutoSnapshotRect):Promise<File | undefined> {
    const focusScenePath = this.control.viewContainerManager.getView(this.viewId)?.focusScenePath;
    if (!focusScenePath) {
      return undefined;
    }
    const centerPoint = this.control.viewContainerManager.transformToScenePoint([rect.centerX, rect.centerY], this.viewId);
    const scale = this.control.viewContainerManager.getView(this.viewId)?.viewData?.camera?.scale || 1;
    const images = await this.control.worker.getSnapshot(focusScenePath, rect.width, rect.height, {
      centerX: centerPoint[0],
      centerY: centerPoint[1],
      scale,
    });
    if (images) {
      return this.imageBitmapToFile(images, `${this.roomUuid}-${this.suid}-snapshot.png`, 'image/png', 1);
    }
    return undefined;
  }
  private async imageBitmapToFile(images: Array<ImageBitmap | HTMLImageElement | null>, fileName: string, mimeType = 'image/png', quality: number) {
    const { width, height } = images.reduce((obj, image) => {
      if (image) {
        obj.width = Math.max(obj.width, image.width);
        obj.height = Math.max(obj.height, image.height);
      }
      return obj;
    }, { width: 0, height: 0 });
    if (width === 0 || height === 0) {
      return undefined;
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      for (const image of images) {
        if (image) {
          ctx.drawImage(image, 0, 0);
        }
      }
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert canvas to blob'));
          }
        }, mimeType, quality);
      });
      const file = new File([blob], fileName, { type: mimeType });
      canvas.remove();
      return file;
    }
    canvas.remove();
    return undefined;
  }
}