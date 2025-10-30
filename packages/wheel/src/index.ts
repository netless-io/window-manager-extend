import { AnimationMode, ExtendContext, ExtendPlugin, type View, type WindowManager } from '@netless/window-manager';
import type { PresentationController } from '@netless/app-presentation';
import type { AppResult as SlideAppResult } from '@netless/app-slide';
export type ExtendWheelOptions = {
  readonly?: boolean;
  activeKinds: string[];
  container?: HTMLElement;
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

  private onWheelHandler = (e: WheelEvent) => {
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
      }
      const camera = this.mainView.camera;
      const centerY = camera.centerY + dy;
      const centerX = camera.centerX + dx;
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