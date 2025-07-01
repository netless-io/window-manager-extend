import { ExtendPastePlugin } from '..';
import { NameSpace } from '../const';
import { makeDraggable } from './Draggable';
import { I18n, I18nKey, Language } from './locale';
import './style.scss';

export interface UploadingProps {
  plugin: ExtendPastePlugin;
  language: Language;
}

export class UploadingUI {
  private readonly namespace: string = NameSpace;
  public readonly container: HTMLDivElement = document.createElement('div');
  private readonly plugin: ExtendPastePlugin;
  private readonly language: Language = 'en';
  private i18n: Record<I18nKey, string>;
  private theme: 'light' | 'dark';
  private $disposeDrag?: {
    destroy: () => void;
  };
  constructor(props: UploadingProps) {
    this.plugin = props.plugin;
    this.language = props.language;
    this.i18n = I18n[this.language];
    this.theme = this.wmTheme;
    this.init();
    this.observe();
  }

  get wmTheme(){
    return this.plugin.windowManager.prefersColorScheme && this.plugin.windowManager.prefersColorScheme !== 'auto' ? this.plugin.windowManager.prefersColorScheme : 'light';
  }

  private observe() {
    this.plugin.windowManager.emitter.on('prefersColorSchemeChange', this.onPrefersColorSchemeChangeHandler);
    this.plugin.on('convertListChange', this.onConvertListChangeHandler);
  }
  
  private unobserve(){
    this.plugin.windowManager.emitter.off('prefersColorSchemeChange', this.onPrefersColorSchemeChangeHandler);
    this.plugin.off('convertListChange', this.onConvertListChangeHandler);
  }

  private onPrefersColorSchemeChangeHandler = () => {
    this.container.classList.remove(this.theme);
    this.theme = this.wmTheme;
    this.container.classList.add(this.theme);
  };

  private onConvertListChangeHandler = (data: {
    operation: 'add' | 'delete' | 'update';
    value: string;
    list: string[];
  }) => {
    this.render(data.list);
  };

  private async init(){
    this.createContainer();
    this.render(this.plugin.convertList);
    // this.render(['1.jpg', '2.jpg', '3.pdf', '4.doc', '5.mp4', '6.mp3', '7.mp3', '8.mp3', '9.mp3', '10.mp3']);
  }

  private c(className: string): string {
    return `${this.namespace}-${className}`;
  }

  private removeContainer(){
    this.plugin.DropContainer?.removeChild(this.container);
    this.$disposeDrag?.destroy();
  }

  private createContainer(){
    this.container.classList.add(this.c('uploading-container'), this.theme);
    this.container.innerHTML = '';
    this.plugin.DropContainer?.appendChild(this.container);
    this.$disposeDrag?.destroy();
  }

  private closeContainer = (e?: MouseEvent) => {
    e?.stopPropagation();
    e?.stopImmediatePropagation();
    this.container.innerHTML = '';
    this.container.remove();
    this.$disposeDrag?.destroy();
  };

  private progressType(name: string): 'image' | 'file' {
    if (name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png') || name.endsWith('.webp')) {
      return 'image';
    }
    return 'file';
  }

  private render(convertList: string[]) {
    this.closeContainer();
    if (convertList.length > 0) {
      const title = document.createElement('div');
      title.classList.add(this.c('uploading-title'));
      title.innerText = this.i18n.title;
      const close = document.createElement('div');
      close.classList.add(this.c('uploading-close'));
      close.addEventListener('pointerdown', this.closeContainer);
      title.appendChild(close);
      const list = document.createElement('div');
      list.classList.add(this.c('uploading-list'));
      for (const item of convertList) {
        const type = this.progressType(item);
        const itemElement = document.createElement('div');
        itemElement.classList.add(this.c('uploading-item'), `uploading-item-${type}`);
        const title = document.createElement('div');
        title.classList.add(this.c('uploading-item-title'));
        title.innerText = item;
        const progress = document.createElement('div');
        progress.classList.add(this.c('uploading-item-progress'));
        const icon = document.createElement('div');
        icon.classList.add(this.c('uploading-item-icon'));
        const loading = document.createElement('div');
        loading.classList.add(this.c('uploading-item-loading'));
        const subLoading1 = document.createElement('div');
        subLoading1.classList.add(this.c('uploading-item-loading-sub'), 'loading-1');
        const subLoading2 = document.createElement('div');
        subLoading2.classList.add(this.c('uploading-item-loading-sub'), 'loading-2');
        const subLoading3 = document.createElement('div');
        subLoading3.classList.add(this.c('uploading-item-loading-sub'), 'loading-3');
        loading.append(subLoading1, subLoading2, subLoading3);
        const cloud = document.createElement('div');
        cloud.classList.add(this.c('uploading-item-cloud'));
        progress.append(icon, loading, cloud);
        itemElement.append(title, progress);
        list.appendChild(itemElement);
      }
      const bottom = document.createElement('div');
      bottom.classList.add(this.c('uploading-des'));
      bottom.innerText = this.i18n.uploading;
      this.container.append(title, list, bottom);
      this.plugin.DropContainer?.appendChild(this.container);
      this.$disposeDrag = makeDraggable(this.container);
    }
  }
  destroy(){
    this.unobserve();
    this.removeContainer();
  }
}

