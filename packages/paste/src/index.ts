import { ExtendContext, ExtendPlugin, type WindowManager } from '@netless/window-manager';
import type { PasteCustomResult, PasteDocViewResult, PasteFileResult, PasteImageResult, PasteMediaResult, PastePdfResult, PasteSildeResult } from './types';
import xss from 'xss';
import { isBoolean } from 'lodash';
import { genUID } from './utils';
import { ObserverSet } from './ObserverSet';
import { UploadingUI } from './componet/UploadingUI';
import { Language } from './componet/locale';


export type PasteState = 'error' | 'cancel' | 'start' | 'end' | 'progress';

export type ExtendPasteOptions = {
  /**
   * 将文件转换为 PasteFileResult, 如果转换失败，则返回null
   * @param file 文件
   * @returns type PasteFileResult
   */
  convertFile: (file: File)=> Promise<PasteFileResult | null>;
  /** 指定paste、drop容器, 默认是主白板 */
  container?: HTMLElement;
  /** 是否启用默认UI */
  enableDefaultUI?: boolean;
  /** 语言 */
  language?: Language;
  /** 是否使用drop事件转换文件, 默认是falase, 如果为true, 则可以使用drop事件转换文件 */
  useDrop?: boolean;
  /** 单次最大文件转换数量, 默认是10, 如果超过这个数量, 则不进行转换 */
  maxConvertFiles?: number;
  /** 指定file extension范围，如果为空，则默认支持['.jpg', '.jpeg', '.png', '.webp', '.mp4', '.mpeg', '.ppt', '.pptx', '.doc', '.pdf'] */
  extension?: string[];
  /**
   * 过滤文件类型
   * @param file 文件
   * @returns boolean
   */
  fileFilter?: (file: File) => boolean;

  /**
   * 中断器
   * @param hasConvert 是否正还在转换文件中
   * @returns 是否中断粘贴或拖拽
   * 如果返回 true，则阻止粘贴或拖拽操作
   * 如果返回 false，则进行后续逻辑
   */
  interrupter?: (hasConvert: boolean) => boolean;
}

export class ExtendPastePlugin extends ExtendPlugin {
  readonly kind = 'extend-paste';
  private readonly options: ExtendPasteOptions;
  private readonly extension: string[] = ['.jpg', '.jpeg', '.png', '.webp', '.mp4', '.mpeg', '.ppt', '.pptx', '.doc', '.pdf'];
  private convertSet = new ObserverSet<string>();
  private enableDefaultUI: boolean = true;
  private uploadingUI?: UploadingUI;
  private language: Language = 'en';
  private useDrop: boolean = false;
  private maxConvertFiles: number = 10;
  private isMounted: boolean = false;
  private isCreated: boolean = false;
  constructor(options: ExtendPasteOptions) {
    super();
    this.options = options;
    this.extension = options.extension || this.extension;
    this.convertSet.observe(this.observeconvertSet);
    this.enableDefaultUI = isBoolean(options.enableDefaultUI) ? options.enableDefaultUI! : true;
    this.language = options.language || 'en';
    this.useDrop = options.useDrop || false;
    this.maxConvertFiles = options.maxConvertFiles || 10;
  }

  get convertList() {
    return [...this.convertSet.values()];
  }

  get windowManager():WindowManager {
    return this.context.windowManager;
  }

  get container() {
    return this.options.container || this.context.windowManagerContainer || this.mainViewElement?.parentElement;
  }

  get mainViewElement() {
    const div = this.windowManager.mainView?.divElement;
    if (div) {
      return div.children[0] as HTMLDivElement;
    }
    return undefined;
  }

  get isWritable() {
    return this.context.windowManager.room?.isWritable;
  }

  get appliancePlugin() {
    return (this.windowManager as any)?._appliancePlugin;
  }

  get hasAppliancePlugin(){
    return !!this.appliancePlugin;
  }

  onDestroy(): void {
    this.unMount();
  }

  onCreate(): void {
    this.isCreated = true;
    if (this.container) {
      this.mount();
      this.isMounted = true;
    }
  }
  
  protected _inject(context: ExtendContext): void {
    super._inject(context);
    if (!this.isCreated) {
      return;
    }
    if (this.container) {
      if (this.isMounted) {
        this.unMount();
      }
      this.mount();
    }
  }

  private observeconvertSet = (operation: 'add' | 'delete' | 'update', value: string) => {
    this.emit('convertListChange', {
      operation,
      value,
      list: this.convertList,
    });
  };

  private hasActiveEditor() {
    if (!this.hasAppliancePlugin && this.windowManager.focusedView && this.windowManager.focusedView.divElement && this.windowManager.focusedView.divElement.querySelectorAll('.editable-textarea').length > 0) {
      return true;
    }
    return false;
  }

  private handlePaste = (e: ClipboardEvent) => {
    if (!this.isWritable) {
      return;
    }
    const focuedId = this.windowManager.focused;
    if (focuedId && focuedId.includes('Quill')) {
      // 这部分逻辑有app-quill插件处理
      return;
    }

    // 如果聚焦的场景有appliancePlugin的工具,且画笔有被selected,则不处理粘贴文本
    if (!(
      this.hasAppliancePlugin && this.windowManager.focusedView && 
        this.appliancePlugin.hasElements(this.windowManager.focusedView.focusScenePath,(toolsType: number)=>toolsType===5)
    )) {
      // 处理文本内容
      const isText = this.handlePasteJustText(e);
      if (isText) {
        return;
      }
    }

    const items = e.clipboardData?.items;
    if (!items) {
      return;
    }
    const hasConvert = this.convertSet.size > 0;
    if(this.options.interrupter){
      const bol = this.options.interrupter(hasConvert);
      if (bol) {
        console.log('paste is interrupted by interrupter');
        return;
      }
    } else if (hasConvert) {
      console.error('convertSet is not empty, wait for transform to complete');
      return;
    }
    const promises: Promise<void>[] = [];
    // 处理文件和图片
    for (let i = 0; i < items.length; i++) {
      if (this.convertSet.size >= this.maxConvertFiles) {
        continue;
      }
      const item = items[i];
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (!file) {
          continue;
        }
        if (this.options.fileFilter && !this.options.fileFilter(file)) {
          continue;
        }
        const extension = '.' + file.name.split('.').pop()?.toLowerCase();
        if (this.extension && !this.extension.includes(extension)) {
          continue;
        }
        if (this.convertSet.has(file.name)) {
          continue;
        }
        promises.push(this.handlePasteFile(file));
      }
    }
    Promise.all(promises).finally(() => {
      this.convertSet.clear();
    });
  };

  private handlePasteJustText = (e: ClipboardEvent): boolean => {
    // 处理文本内容
    const text = e.clipboardData?.getData('text');
    if (text) {
      e.stopPropagation();
      e?.stopImmediatePropagation();
      if (this.hasActiveEditor() ) {
        return false;
      }
      const str = xss(text, {
        whiteList: {}, // 白名单为空，表示过滤所有标签
        stripIgnoreTag: true, // 过滤所有非白名单标签的HTML
        stripIgnoreTagBody: ['script'], // script标签较特殊，需要过滤标签中间的内容
      });
      if (!str) {
        return false;
      }
      this.handlePasteText(str);
      return true;
    }
    return false;
  };

  private async handlePasteFile(file: File) {
    this.convertSet.add(file.name);
    const result = await this.options.convertFile(file);
    this.convertSet.delete(file.name);
    if (result) {
      switch (result.kind) {
        case 'Image':
          this.handlePasteImage(result as PasteImageResult);
          break;
        case 'MediaPlayer':
          this.handlePasteMedia(result as PasteMediaResult);
          break;
        case 'DocsViewer':
          this.handlePasteDocView(result as PasteDocViewResult);
          break;
        case 'Slide':
          this.handlePasteSlide(result as PasteSildeResult);
          break;
        case 'PDFjs':
          this.handlePastePdf(result as PastePdfResult);
          break;
        default:
          this.handlePasteCustom(result as PasteCustomResult);
          break;
      }
    }
  }

  private handlePastePdf(result: PastePdfResult) {
    const { title, scenePath, taskId, prefix, kind } = result;
    if (this.windowManager) {
      if (!this.context.manager.hasRegister(kind)) {
        console.error(`[ExtendPastePlugin] ${kind} is not registered`);
        return;
      }
      this.windowManager.addApp({
        kind,
        options: { title, scenePath: scenePath || taskId && `/pdf/${taskId}` },
        attributes: { prefix, taskId },
      });
    }
  }

  private handlePasteSlide(result: PasteSildeResult) {
    const { url, title, scenePath, taskId, kind } = result;
    if (url && this.windowManager) {
      if (!this.context.manager.hasRegister(kind)) {
        console.error(`[ExtendPastePlugin] ${kind} is not registered`);
        return;
      }
      this.windowManager.addApp({
        kind,
        options: { title, scenePath: scenePath || taskId && `/pptx/${taskId}` },
        attributes: { taskId, url },
      });
    }
  }

  private handlePasteDocView(result: PasteDocViewResult) {
    const { title, scenePath, taskId, scenes, kind } = result;
    if (this.windowManager) {
      if (!this.context.manager.hasRegister(kind)) {
        console.error(`[ExtendPastePlugin] ${kind} is not registered`);
        return;
      }
      this.windowManager.addApp({
        kind,
        options: { title, scenePath: scenePath || taskId && `/docs/${taskId}`, scenes },
      });
    }
  }

  private handlePasteCustom(result: PasteCustomResult) {
    const { kind, options, attributes } = result;
    if (this.windowManager) {
      if (!this.context.manager.hasRegister(kind)) {
        console.error(`[ExtendPastePlugin] ${kind} is not registered`);
        return;
      }
      this.windowManager.addApp({
        kind,
        options,
        attributes,
      });
    }
  }

  private handlePasteMedia(result: PasteMediaResult) {
    const { url, title, kind } = result;
    if (url && this.windowManager) {
      this.windowManager.addApp({
        kind,
        options: { title },
        attributes: { src: url },
      });
    }
  }

  private handlePasteImage(result: PasteImageResult) {
    const focuedView = this.windowManager.focusedView;
    if (!focuedView) {
      return;
    }
    const { url, width, height, crossOrigin, centerX, centerY, uuid, locked } = result;
    const camera = focuedView.camera;
    this.windowManager.insertImage({
      uuid: uuid || genUID(),
      centerX: centerX || camera.centerX,
      centerY: centerY || camera.centerY,
      width,
      height,
      locked: locked || false,
      src: url,
      crossOrigin,
    });
  }

  async handlePasteText(text: string) {
    const focuedView = this.windowManager.focusedView;
    if(!focuedView){
      return;
    }
    const camera = focuedView.camera;
    this.windowManager.insertText(camera.centerX, camera.centerY, text);
  }

  private handleDrop = (e: DragEvent) => {
    if (!this.isWritable) {
      return;
    }
    const files = e.dataTransfer?.files;
    if (!files) {
      return;
    }
    const hasConvert = this.convertSet.size > 0;
    if(this.options.interrupter){
      const bol = this.options.interrupter(hasConvert);
      if (bol) {
        console.log('paste is interrupted by interrupter');
        return;
      }
    } else if (hasConvert) {
      console.error('convertSet is not empty, wait for transform to complete');
      return;
    }
    const promises: Promise<void>[] = [];
    // 处理文件和图片
    for (let i = 0; i < files.length; i++) {
      if (this.convertSet.size >= this.maxConvertFiles) {
        continue;
      }
      const file = files[i];
      if (!file) {
        continue;
      }
      if (this.options.fileFilter && !this.options.fileFilter(file)) {
        continue;
      }
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (this.extension && !this.extension.includes(extension)) {
        continue;
      }
      if (this.convertSet.has(file.name)) {
        continue;
      }
      promises.push(this.handlePasteFile(file));
    }
    Promise.all(promises).finally(() => {
      this.convertSet.clear();
    });
  };

  private preventDefaults = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  private mount(): void {
    if (this.enableDefaultUI) {
      this.uploadingUI = new UploadingUI({
        plugin: this,
        language: this.language,
      });
    }
    if (this.container) {
      this.container.addEventListener('paste', this.handlePaste, false);
      if (this.useDrop) {
        // 防止浏览器默认行为
        document.addEventListener('dragenter', this.preventDefaults);
        document.addEventListener('dragover', this.preventDefaults);
        document.addEventListener('dragleave', this.preventDefaults);
        document.addEventListener('drop', this.preventDefaults);
        this.container.addEventListener('drop', this.handleDrop);
      }
    }
    this.isMounted = true;
  }
  private unMount(){
    if (this.container) {
      this.container.removeEventListener('paste', this.handlePaste, false);
      if (this.useDrop) {
        document.removeEventListener('dragenter', this.preventDefaults);
        document.removeEventListener('dragover', this.preventDefaults);
        document.removeEventListener('dragleave', this.preventDefaults);
        document.removeEventListener('drop', this.preventDefaults);
        this.container.removeEventListener('drop', this.handleDrop);
      }
    }
    this.uploadingUI?.destroy();
    this.isMounted = false;
  }
}