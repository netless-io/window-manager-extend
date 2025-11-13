import { AnimationMode, ExtendContext, ExtendPlugin, type WindowManager } from '@netless/window-manager';
import './style.scss';
import { makeDraggable } from './Draggable';
import { autorun, toJS } from 'white-web-sdk';
import { debounce, isEqual } from 'lodash';

export interface ScrollbarEventCallback {
  onScrollbarDragStart?: () => void;
  onScrollbarDragEnd?: () => void;
  onScrollbarDragX?: (x: number) => void;
  onScrollbarDragY?: (y: number) => void;
  onScrollCameraUpdated?: (originScale: number, scale: number) => void;
}

export type ExtendScrollbarOptions = {
  readonly?: boolean;
  originBound?: {
    width: number;
    height: number;
    scale: number;
  };
  scrollbarEventCallback?: ScrollbarEventCallback
}

export class ExtendScrollbarPlugin extends ExtendPlugin {
  readonly kind = 'extend-scrollbar';
  private readonly namespace: string = 'window-manager-scrollbar-extend-ui';
  private isMounted: boolean = false;
  private isCreated: boolean = false;
  private container?: HTMLElement;
  private scrollbarContainerX?: HTMLDivElement;
  private scrollbarContainerY?: HTMLDivElement;
  private scrollbarX?: HTMLDivElement;
  private scrollbarY?: HTMLDivElement;
  private draggableX?: { destroy: () => void };
  private draggableY?: { destroy: () => void };
  private cameraCache?: {
    centerX: number;
    centerY: number;
    scale: number;
  };
  private options: ExtendScrollbarOptions;
  private stateDisposer: (() => void) | null = null;
  constructor(options: ExtendScrollbarOptions) {
    super();
    this.options = options;
  }

  private c(className: string): string {
    return `${this.namespace}-${className}`;
  }

  get windowManager():WindowManager {
    return this.context.windowManager;
  }

  get isWritable() {
    return this.windowManager.room.isWritable;
  }

  get mainView() {
    return this.windowManager.mainView;
  }

  get mainViewElement() {
    return this.mainView.divElement;
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
    this.unMount();
    this.mount();
  }

  setOriginBound(bound: { width: number, height: number, scale: number }){
    if (!this.isWritable) {
      throw new Error('[ExtendBackgroundPlugin] setBackgroundImage must be called in writable room');
    }
    this.windowManager.safeUpdateAttributes(['scrollbarOriginBound'], bound);
  }
  
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

  private onDragStart = () => {
    const camera = this.mainView.camera;
    this.cameraCache = {
      centerX: camera.centerX,
      centerY: camera.centerY,
      scale: camera.scale,
    };
    this.options.scrollbarEventCallback?.onScrollbarDragStart?.();
  };

  private getScrollXRange(camera: {scale: number}) {
    const size = this.mainView.size;
    const width = size.width / camera.scale;
    const { width: originWidth, scale: originScale } = this.options.originBound || { width, scale: 1 };
    const ratio = Math.round(width / (originWidth / originScale) * 100) / 100;
    const scrollWidth = originWidth * (1-ratio);
    const minX = -scrollWidth / 2;
    const maxX = scrollWidth / 2;
    return { minX, maxX };
  }

  private getScrollYRange(camera: {scale: number}) {
    const size = this.mainView.size;
    const height = size.height / camera.scale;
    const { height: originHeight, scale: originScale } = this.options.originBound || { height,  scale: 1 };
    const ratio = Math.round(height / (originHeight / originScale) * 100) / 100;
    const scrollHeight = originHeight * (1-ratio);
    const minY = -scrollHeight / 2;
    const maxY = scrollHeight / 2;
    return { minY, maxY };
  }

  private onDragX = (transformedDrag: {x: number, y: number}) => {
    if (this.cameraCache) {
      const { x } = transformedDrag;
      const { minX, maxX } = this.getScrollXRange(this.cameraCache);
      let centerX = x + this.cameraCache.centerX;
      if (centerX < minX) {
        centerX = minX;
      } else if (centerX > maxX) {
        centerX = maxX;
      }
      this.windowManager.moveCamera({
        centerX,
        animationMode: 'immediately' as AnimationMode,
      });
      this.options.scrollbarEventCallback?.onScrollbarDragX?.(centerX);
    }
  };

  private onDragY = (transformedDrag: {x: number, y: number}) => {
    if(this.cameraCache){
      const { y } = transformedDrag;
      const { minY, maxY } = this.getScrollYRange(this.cameraCache);
      let centerY = y + this.cameraCache.centerY;
      if (centerY < minY) {
        centerY = minY;
      } else if (centerY > maxY) {
        centerY = maxY;
      }
      this.windowManager.moveCamera({
        centerY,
        animationMode: 'immediately' as AnimationMode,
      }); 
      this.options.scrollbarEventCallback?.onScrollbarDragY?.(centerY);
    }
  };

  private onDragEnd = () => {
    this.cameraCache = undefined;
    this.options.scrollbarEventCallback?.onScrollbarDragEnd?.();
  };

  private mount(): void {
    this.isMounted = true;
    if (this.options.readonly) {
      return;
    }
    this.scrollbarX = document.createElement('div');
    this.scrollbarX.classList.add(this.c('x'));
    if (this.isWritable) {
      this.draggableX = makeDraggable(this.scrollbarX, {
        direction: 'x',
        onDrag: this.onDragX,
        onDragEnd: this.onDragEnd,
        onDragStart: this.onDragStart,
      });
    }
    Object.assign(this.scrollbarX.style, {
      width: '100%',
      display: 'none',
    });
    this.scrollbarContainerX = document.createElement('div');
    this.scrollbarContainerX.classList.add(this.c('container-x'));
    this.scrollbarContainerX.appendChild(this.scrollbarX);

    this.scrollbarY = document.createElement('div');
    this.scrollbarY.classList.add(this.c('y'));
    if (this.isWritable) {
      this.draggableY = makeDraggable(this.scrollbarY, {
        direction: 'y',
        onDrag: this.onDragY,
        onDragEnd: this.onDragEnd,
        onDragStart: this.onDragStart,
      });
    }
    Object.assign(this.scrollbarY.style, {
      height: '100%',
      display: 'none',
    });
    this.scrollbarContainerY = document.createElement('div');
    this.scrollbarContainerY.classList.add(this.c('container-y'));
    this.scrollbarContainerY.appendChild(this.scrollbarY);

    this.container = document.createElement('div');
    this.container.classList.add(this.c('container'));
    this.container.append(this.scrollbarContainerX, this.scrollbarContainerY);
    this.mainViewElement?.appendChild(this.container);
    this.onCameraUpdatedHandler();
    this.stateDisposer = autorun(() => {
      const originBound = toJS(this.attributes.scrollbarOriginBound);
      if (!isEqual(originBound, this.options.originBound)) {
        this.options.originBound = originBound;
        this.onCameraUpdatedHandler();
      }
    });
    this.windowManager.emitter.on('onMainViewRebind', this.onMainViewRebindHandler);
    this.mainView.callbacks.on('onCameraUpdated', this.onCameraUpdatedHandler);
    this.windowManager.room.callbacks.on('onEnableWriteNowChanged', this.onEnableWriteNowChangedHandler);
  }

  private onCameraUpdatedHandler = debounce(() => {
    if (this.options.readonly) return;
    const { scale, centerX, centerY } = this.mainView.camera;
    const width = this.mainView.size.width / scale;
    const height = this.mainView.size.height / scale;
    const { width: originWidth, scale: originScale } = this.options.originBound || { width, height, scale: 1 };
    const ratio = Math.round(width / (originWidth / originScale) * 100) / 100;

    const scrollX = Math.round(centerX * this.ratioClient);
    const scrollY = Math.round(centerY * this.ratioClient);

    if (this.scrollbarX) {
      this.scrollbarX.style.width = `${ratio * 100}%`;
      this.scrollbarX.style.display = ratio >= 1 ? 'none' : 'block';
      this.scrollbarX.style.transform = `translateX(${scrollX}px)`;
    }
    if (this.scrollbarY) {
      this.scrollbarY.style.height = `${ratio * 100}%`;
      this.scrollbarY.style.display = ratio >= 1 ? 'none' : 'block';
      this.scrollbarY.style.transform = `translateY(${scrollY}px)`;
    }
    this.options.scrollbarEventCallback?.onScrollCameraUpdated?.(this.originScale, scale);
  }, 50);

  get originBound() {
    return this.options.originBound || { width: 0, height: 0, scale: 1 };
  }

  get ratioClient() {
    const { width: originWidth } = this.originBound;
    return Math.round(this.mainView.size.width / originWidth * 100) / 100;
  }

  get originScale() {
    const { scale } = this.originBound;
    return scale  * this.ratioClient;
  }

  get scale(){
    return this.mainView.camera.scale;
  }

  private onMainViewRebindHandler = () => {
    if (this.isMounted) {
      this.unMount();
    }
    this.mount();
  };
  private onEnableWriteNowChangedHandler = () => {
    if (this.isMounted) {
      this.unMount();
    }
    this.mount();
  };

  private unMount(){
    if(this.stateDisposer){
      this.stateDisposer();
      this.stateDisposer = null;
    }
    this.windowManager.emitter.off('onMainViewRebind', this.onMainViewRebindHandler);
    this.mainView.callbacks.off('onCameraUpdated', this.onCameraUpdatedHandler);
    this.windowManager.room.callbacks.off('onEnableWriteNowChanged', this.onEnableWriteNowChangedHandler);
    this.container?.remove();
    this.container = undefined;
    this.scrollbarX?.remove();
    this.scrollbarY?.remove();
    this.scrollbarX = undefined;
    this.scrollbarY = undefined;

    this.draggableX?.destroy();
    this.draggableY?.destroy();
    this.draggableX = undefined;
    this.draggableY = undefined;
    this.isMounted = false;
  }
}