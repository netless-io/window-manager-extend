import { AnimationMode, ExtendContext, ExtendPlugin, type View, type WindowManager } from '@netless/window-manager';
import type { PresentationController } from '@netless/app-presentation';
import type { AppResult as SlideAppResult } from '@netless/app-slide';
export type ExtendWheelOptions = {
  readonly?: boolean;
  activeKinds: string[];
  container?: HTMLElement;
  originMainViewBound?: {
    width: number;
    height: number;
    scale: number;
  };
  /**
   * 中断器
   * @param e 滚动事件
   * @returns 是否中断
   * 如果返回 true，则阻止白板的滚动
   * 如果返回 false，则进行白板的滚动
   */
  interrupter?: (e: WheelEvent) => boolean;
}

export class ExtendWheelPlugin extends ExtendPlugin {
  readonly kind = 'extend-wheel';
  private isMounted: boolean = false;
  private isCreated: boolean = false;
  private options: ExtendWheelOptions;
  constructor(options: ExtendWheelOptions) {
    super();
    this.options = {
      readonly: false,
      ...options,
    };
  }
  get container():HTMLElement | undefined {
    return this.context.windowManagerContainer || this.options.container;
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

  get focusedView():View {
    return this.windowManager.focusedView || this.mainView;
  }

  get focusedId():string {
    return this.windowManager.focused || 'mainView';
  }

  get activeKinds(){
    return this.options.activeKinds;
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

  setOriginMainViewBound(bound: { width: number, height: number, scale: number }){
    this.options.originMainViewBound = bound;
  }
  
  /**
   * 设置中断器
   * @param interrupter 中断器, 如果设置为 undefined，则进行白板的滚动
   * 如果返回 true，则阻止白板的滚动
   * 如果返回 false，则进行白板的滚动
   */
  setInterrupter(interrupter?: (e: WheelEvent) => boolean){
    this.options.interrupter = interrupter;
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

  private getScrollYRange(camera: {scale: number}) {
    const height = this.mainView.size.height / camera.scale;
    const { height: originHeight, scale: originScale } = this.options.originMainViewBound || { height,  scale: 1 };
    const ratio = Math.round(height / (originHeight / originScale) * 100) / 100;
    const scrollHeight = originHeight * (1-ratio);
    const minY = -scrollHeight / 2;
    const maxY = scrollHeight / 2;
    return { minY, maxY };
  }

  private getScrollXRange(camera: {scale: number}) {
    const width = this.mainView.size.width / camera.scale;
    const { width: originWidth, scale: originScale } = this.options.originMainViewBound || { width,  scale: 1 };
    const ratio = Math.round(width / (originWidth / originScale) * 100) / 100;
    const scrollWidth = originWidth * (1-ratio);
    const minX = -scrollWidth / 2;
    const maxX = scrollWidth / 2;
    return { minX, maxX };
  }

  private onWheelHandler = (e: WheelEvent) => {
    if (this.options.interrupter && !!this.options.interrupter(e)) {
      return;
    }
    if (this.isWritable && !this.options.readonly) {
      if (typeof e.cancelable !== 'boolean' || e.cancelable) {
        e.preventDefault();
      }
      e.stopPropagation();
      e.stopImmediatePropagation();
      const dy = e.deltaY || 0;
      const dx = e.deltaX || 0;
      const focusedId = this.focusedId;
      if (focusedId && focusedId !== 'mainView') {
        const app = this.windowManager.queryOne(focusedId);
        if (app && this.activeKinds.includes(app.kind)) {
          if (((app as any).appResult as PresentationController).moveCamera) {
            const camera = (app as any).view.camera;
            const centerY = camera.centerY + dy;
            const centerX = camera.centerX + dx;
            ((app as any).appResult as PresentationController).moveCamera({
              ...camera,
              centerY,
              centerX,
            });
            return;
          }
          if (((app as any).appResult as SlideAppResult).translateView) {
            ((app as any).appResult as SlideAppResult).translateView(dx, dy);
            return;
          }
        }
        return;
      }
      const camera = this.mainView.camera;
      let centerY = camera.centerY + dy;
      let centerX = camera.centerX + dx;
      if (this.options.originMainViewBound) {
        const { minY, maxY } = this.getScrollYRange(camera);
        if (centerY < minY) {
          centerY = minY;
        } else if (centerY > maxY) {
          centerY = maxY;
        }
        const { minX, maxX } = this.getScrollXRange(camera);
        if (centerX < minX) {
          centerX = minX;
        } else if (centerX > maxX) {
          centerX = maxX;
        }
      }
      this.windowManager.moveCamera({
        centerY,
        centerX,
        animationMode: 'immediately' as AnimationMode,
      });
      return;
    }
  };

  private mount(): void {
    this.isMounted = true;
    if (this.options.readonly) {
      return;
    }
    if (!this.container) {
      return;
    }
    this.container.addEventListener('wheel', this.onWheelHandler, { passive: false, capture: true });
  }

  private unMount(){
    if(this.container){
      this.container.removeEventListener('wheel', this.onWheelHandler);
    }
    this.isMounted = false;
  }
}