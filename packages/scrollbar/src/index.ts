import { AnimationMode, ExtendContext, ExtendPlugin, type WindowManager } from '@netless/window-manager';
import './style.scss';
import { makeDraggable } from './Draggable';
import { autorun, toJS } from 'white-web-sdk';
import { isEqual } from 'lodash';

export type ExtendScrollbarOptions = {
  readonly?: boolean;
  originSize?: {
    width: number;
    height: number;
  };
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
    this.options = {
      readonly: false,
      ...options,
    };
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

  setOriginSize(size: { width: number, height: number }){
    if (!this.isWritable) {
      throw new Error('[ExtendBackgroundPlugin] setBackgroundImage must be called in writable room');
    }
    this.windowManager.safeUpdateAttributes(['scrollbarOriginSize'], size);
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
  };

  private getScrollXRange(camera: {scale: number}) {
    const size = this.mainView.size;
    const width = size.width / camera.scale;
    const { width: originWidth } = this.options.originSize || { width };
    const ratio = Math.round(width / originWidth * 1000) / 1000;
    const scrollWidth = originWidth * (1-ratio);
    const minX = -scrollWidth / 2;
    const maxX = scrollWidth / 2;
    return { minX, maxX };
  }

  private getScrollYRange(camera: {scale: number}) {
    const size = this.mainView.size;
    const height = size.height / camera.scale;
    const { height: originHeight } = this.options.originSize || { height };
    const ratio = Math.round(height / originHeight * 1000) / 1000;
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
    }
  };

  private onDragEnd = () => {
    this.cameraCache = undefined;
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
      const originSize = toJS(this.attributes.scrollbarOriginSize);
      if (!isEqual(originSize, this.options.originSize)) {
        this.options.originSize = originSize;
        this.onCameraUpdatedHandler();
      }
    });
    this.windowManager.emitter.on('onMainViewRebind', this.onMainViewRebindHandler);
    this.mainView.callbacks.on('onCameraUpdated', this.onCameraUpdatedHandler);
    this.windowManager.room.callbacks.on('onEnableWriteNowChanged', this.onEnableWriteNowChangedHandler);
  }

  private onCameraUpdatedHandler = () => {
    if (this.options.readonly) return;
    const { scale, centerX, centerY } = this.mainView.camera;
    const width = this.mainView.size.width / scale;
    const height = this.mainView.size.height / scale;
    const { width: originWidth } = this.options.originSize || { width, height };
    const ratio = Math.round(width / originWidth * 1000) / 1000;
    const ratioClient = Math.round(this.mainView.size.width / originWidth * 1000) / 1000;

    const scrollX = Math.round(centerX * ratioClient);
    const scrollY = Math.round(centerY * ratioClient);

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
  };

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