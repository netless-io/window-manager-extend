import { ExtendContext, ExtendPlugin, type WindowManager } from '@netless/window-manager';
import { Language, Theme } from './locale';
import { AIPanelController } from './controller';

export type ExtendAIContext = {
    /** OpenAI API密钥 */
    apiKey: string;
    /** 模型列表, 如果为字符串, 则认为是模型ID, 如果为数组, 则认为是模型ID数组 */
    models?: string[] | string;
    /** 语言, 默认是 zh-CN */
    language?: Language;
    /** 主题, 默认是 light */
    theme?: Theme;
}

export type ExtendAIOptions = ExtendAIContext & {
    /**
     * 将文件转换为 PasteFileResult, 如果转换失败，则返回null
     * @param file 文件
     * @returns type PasteFileResult
     */
    uploadFile: (file: File)=> Promise<string | null>;
    /** 是否使用默认UI */
    useDefaultUI?: boolean;
    /** 指定aichat容器, 默认是主白板 */
    container?: HTMLElement;
    /** 回调函数 */
    callbacks?: {
        /** 面板显示时回调 */
        onShow?: () => void;
        /** 面板隐藏时回调 */
        onHide?: () => void;
    }
  }
  

export class ExtendAIPlugin extends ExtendPlugin {
  readonly kind = 'extend-ai';
  static dbName = '__WINDOW_MANAGER_EXTEND_AI_DB';
  private readonly options: ExtendAIOptions;
  private panelController?: AIPanelController;
  constructor(options: ExtendAIOptions) {
    super();
    this.options = options;
  }
  get windowManager():WindowManager {
    return this.context.windowManager;
  }
  protected _inject(context: ExtendContext): void {
    super._inject(context);
    let isActive = false;
    if (this.panelController) {
      isActive = this.panelController.isActive;
      this.cancel();
    }
    this.panelController = new AIPanelController({
      context,
      dbName: ExtendAIPlugin.dbName,
      options: this.options,
    });
    if (isActive) {
      this.active();
    }
  }
  onCreate(): void {}
  onDestroy(): void {
    this.panelController?.clearDb().then(() => {
      this.cancel();
      this.panelController = undefined;
    });
  }
  active(options?: ExtendAIContext){
    this.panelController?.create(options);
  }
  cancel(){
    this.panelController?.destroy();
  }
}
