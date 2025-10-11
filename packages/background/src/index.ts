import { ExtendContext, ExtendPlugin, type WindowManager } from '@netless/window-manager';
import { autorun, toJS } from 'white-web-sdk';
import { isEqual } from 'lodash';
import './style.scss';


export type ExtendBackgroundImage = {
  url: string;
  width: number;
  height: number;
  crossOrigin?: string;
}

export type ExtendBackgroundOptions = {
  /**
   * 背景颜色
   */
  color?: string;
  /**
   * 背景图片透明度, 0-1
   */
  opacity?: number;
  /**
   * 背景图片
   */
  image?: ExtendBackgroundImage;
}

export class ExtendBackgroundPlugin extends ExtendPlugin {
  readonly kind = 'extend-background';
  private readonly namespace: string = 'window-manager-background-extend-ui';
  private options: ExtendBackgroundOptions = {};
  private backgroundElement: HTMLDivElement | null = null;
  private backgroundImage: HTMLImageElement | null = null;
  private isMounted: boolean = false;
  private isCreated: boolean = false;
  private stateDisposer: (() => void) | null = null;
  constructor() {
    super();
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

  setBackgroundImage(image?: ExtendBackgroundImage){
    if (!this.isWritable) {
      throw new Error('[ExtendBackgroundPlugin] setBackgroundImage must be called in writable room');
      // return;
    }
    if(!this.backgroundElement) {
      return;
    }
    this.windowManager.safeUpdateAttributes(['backgroundOptions', 'image'], image);
  }

  setBackgroundColor(color: string){
    if (!this.isWritable) {
      throw new Error('[ExtendBackgroundPlugin] setBackgroundColor must be called in writable room');
      // return;
    }
    if(!this.backgroundElement) {
      return;
    }
    this.windowManager.safeUpdateAttributes(['backgroundOptions', 'color'], color);
  }

  setBackgroundOpacity(opacity: number){
    if (!this.isWritable) {
      throw new Error('[ExtendBackgroundPlugin] setBackgroundOpacity must be called in writable room');
      // return;
    }
    if(!this.backgroundElement) {
      return;
    }
    this.windowManager.safeUpdateAttributes(['backgroundOptions', 'opacity'], opacity);
  }

  onDestroy(): void {
    this.unMount();
  }

  onCreate(): void {
    if (!this.attributes.backgroundOptions) {
      this.windowManager.updateAttributes(['backgroundOptions'], this.options);
    } else {
      this.options = toJS(this.attributes.backgroundOptions);
    }
    this.isCreated = true;
    this.mount();
    this.isMounted = true;
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

  private renderBackgroundImage(image?: ExtendBackgroundImage){
    if(!this.backgroundElement) {
      return;
    }
    if (image) {
      const { url, width, height, crossOrigin } = image;
      if (!this.backgroundImage) {
        this.backgroundImage = new Image();
        this.backgroundImage.classList.add(this.c('image'));
        this.backgroundImage.onerror = () => {
          this.emit('loadError', url);
        };
        this.backgroundElement.appendChild(this.backgroundImage);
        this.mainView.callbacks.on('onCameraUpdated', this.onCameraUpdatedHandler);
      }
      this.backgroundImage.width = width;
      this.backgroundImage.height = height;
      if (crossOrigin) {
        this.backgroundImage.crossOrigin = crossOrigin.toString();
      }
      this.backgroundImage.src = url;
      this.onCameraUpdatedHandler();
    } else if(this.backgroundImage) {
      this.mainView.callbacks.off('onCameraUpdated', this.onCameraUpdatedHandler);
      this.backgroundImage?.remove();
      this.backgroundImage = null;
    }
  }
  private renderColorBackground(color?: string){
    if(!this.backgroundElement) {
      return;
    }
    if (color) {
      this.backgroundElement.style.backgroundColor = color;
    } else {
      this.backgroundElement.style.removeProperty('background-color');
    }
  }
  private renderOpacityBackground(opacity?: number){
    if(!this.backgroundElement) {
      return;
    }
    if (opacity) {
      this.backgroundElement.style.opacity = opacity.toString();
    } else {
      this.backgroundElement.style.removeProperty('opacity');
    }
  }

  private mount(): void {
    console.log('mount', !!this.mainViewElement);
    if (this.mainViewElement) {
      this.backgroundElement = document.createElement('div');
      this.backgroundElement.classList.add(this.c('container'));
      const { image, color, opacity } = this.options;
      this.renderBackgroundImage(image);
      this.renderColorBackground(color);
      this.renderOpacityBackground(opacity);
      this.mainViewElement.appendChild(this.backgroundElement);
      this.observe();
    }
    this.isMounted = true;
  }

  private onCameraUpdatedHandler = () => {
    if (this.backgroundImage) {
      const { centerX, centerY } = this.mainView.camera;
      const originPosition = this.mainView.convertToPointOnScreen(0, 0);
      const position = this.mainView.convertToPointOnScreen(centerX, centerY);
      const translate = [originPosition.x - position.x, originPosition.y - position.y];
      // const matrix = `matrix(${scale}, 0, 0, ${scale}, ${translate[0]}, ${translate[1]})`;
      const matrix = `matrix(1, 0, 0, 1, ${translate[0]}, ${translate[1]})`;
      this.backgroundImage.style.transform = matrix;
    }
  };

  private onMainViewRebindHandler = () => {
    console.log('onMainViewRebindHandler', this.isMounted);
    if (this.isMounted) {
      this.unMount();
    }
    this.mount();
  };

  private observe() {
    this.windowManager.emitter.on('onMainViewRebind', this.onMainViewRebindHandler);
    this.stateDisposer = autorun(() => {
      const options = toJS(this.attributes.backgroundOptions);
      if (options.color !== this.options.color) {
        this.renderColorBackground(options.color);
      }
      if (options.opacity !== this.options.opacity) {
        this.renderOpacityBackground(options.opacity);
      }
      if (!isEqual(options.image, this.options.image)) {
        this.renderBackgroundImage(options.image);
      }
      this.options = options;
    });
  }

  private unobserve() {
    if(this.stateDisposer){
      this.stateDisposer();
      this.stateDisposer = null;
    }
    if(this.backgroundImage) {
      this.mainView.callbacks.off('onCameraUpdated', this.onCameraUpdatedHandler);
    }
    this.windowManager.emitter.off('onMainViewRebind', this.onMainViewRebindHandler);
  }

  private unMount(){
    if (this.backgroundElement) {
      this.unobserve();
      this.backgroundElement?.remove();
      this.backgroundElement = null;
    }
    this.isMounted = false;
  }
}