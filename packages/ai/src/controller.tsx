import ReactDOM from 'react-dom';
import React from 'react';
import type { ExtendContext } from '@netless/window-manager';
import { UtilsSnapshot } from './utils/snapshot';
import { UtilsIndexDB } from './utils/indexDB';
import { ExtendAIContext, ExtendAIOptions } from '.';
import { AiChatId, AiChatRecordItem, PanelApp } from './component/panel';
import { Language } from './locale';
import { ContentPart } from './types';
import './style.scss';
import { ObserverMap } from './utils/ObserverMap';
import { AppliancePluginInstance } from '@netless/appliance-plugin';
import { AutoSnapshotPlugin } from './utils/autoSnapshot';

export type AIPanelControllerOptions = {
  context: ExtendContext;
  dbName: string;
  options: ExtendAIOptions;
}

export class AIPanelController {
  readonly props: AIPanelControllerOptions;
  private readonly namespace: string = 'window-manager-ai-extend-ui';
  private snapshotUtils: UtilsSnapshot;
  private indexDbUtils: UtilsIndexDB;
  private autoSnapshotPlugin?: AutoSnapshotPlugin;
  private panelContainer?: HTMLElement;
  private originalPaddingRight?: string;
  private originalBoxSizing?: string;
  private _isActive: boolean = false;
  vDom?:PanelApp;
  inputUserPrompts: ObserverMap<string, ContentPart[] | undefined> = new ObserverMap();

  c(className: string): string {
    return `${this.namespace}-${className}`;
  }
  get isActive(): boolean {
    return this._isActive;
  }
  get context(): ExtendContext {
    return this.props.context;
  }

  get dbName(): string {
    return this.props.dbName;
  }

  get options(): ExtendAIOptions {
    return this.props.options;
  }

  get language(): Language {
    return this.options.language || 'zh-CN';
  }
  get appliancePlugin(): AppliancePluginInstance {
    return this.context.windowManager._appliancePlugin as AppliancePluginInstance;
  }

  get isAbleAutoSnapshot(): boolean {
    return !!this.autoSnapshotPlugin;
  }

  constructor(props: AIPanelControllerOptions) {
    this.props = props;
    this.snapshotUtils = new UtilsSnapshot(this.context.windowManager,{
      onGenerateSnapshots: this.onGenerateSnapshots,
      onClipStateChange: this.onClipStateChange,
    });
    const uuid = this.context.windowManager.room.uuid;
    const uid = this.context.windowManager.room.uid;
    this.indexDbUtils = new UtilsIndexDB(this.dbName, `${uuid}_${uid}`);
    this.inputUserPrompts.observe(async () => {
      if (this.vDom) {
        const tabs = await this.vDom.getTabs();
        this.vDom.setState({ tabs: tabs });
      }
    });
    if (this.appliancePlugin) {
      this.autoSnapshotPlugin = new AutoSnapshotPlugin({
        onGenerateSnapshots: this.onGenerateSnapshots,
        onClipStateChange: this.onAutoClipStateChange,
      });
      this.appliancePlugin.usePlugin(this.autoSnapshotPlugin);
    }
  }
  onGenerateSnapshots = async (file: File) => {
    const url = await this.options.uploadFile(file);
    if (url && this.vDom) {
      const { activeAiChatId } = this.vDom.state;
      if (activeAiChatId) {
        this.inputUserPrompts.set(activeAiChatId, [{ type: 'image_url', imageUrl: { url } }]);
      }
    }
  };
  onClipStateChange =(isCliping: boolean)=>{
    if (this.vDom) {
      this.vDom.setState({ isCliping });
    }
  };
  onAutoClipStateChange =(isAutoCliping: boolean)=>{
    if (this.vDom) {
      this.vDom.setState({ isAutoCliping });
    }
  };
  private createPanelContainer() {
    this.panelContainer = document.createElement('div');
    const theme = this.options.theme || 'light';
    this.panelContainer.classList.add(this.c('container'), this.c(`theme-${theme}`));
    this.panelContainer.style.width = '400px';
    if (!this.options.container && this.context.windowManagerContainer) {
      if (this.context.windowManagerContainer) {
        // 保存原来的 paddingRight 值
        this.originalPaddingRight = this.context.windowManagerContainer.style.paddingRight || '';
        this.originalBoxSizing = this.context.windowManagerContainer.style.boxSizing || '';
        this.context.windowManagerContainer.style.paddingRight = '400px';
        this.context.windowManagerContainer.style.boxSizing = 'border-box';
        this.context.windowManagerContainer.appendChild(this.panelContainer);
      }
    } else if (this.options.container) {
      this.options.container?.appendChild(this.panelContainer);
    } else {
      document.body.appendChild(this.panelContainer);
    }
    return this.panelContainer;
  }
  create(options?: ExtendAIContext) {
    this.props.options = Object.assign(this.options, options);
    if (this._isActive) {
      throw new Error('ai is already active');
    }
    this._isActive = true;
    this.createPanelContainer();
    if (this.panelContainer) {
      ReactDOM.render(<PanelApp controller={this} language={this.language} />, this.panelContainer);
    }
  }
  destroy() {
    this._isActive = false;
    if (!this.options.container && this.context.windowManagerContainer) {
      // 恢复原来的 paddingRight 值
      this.context.windowManagerContainer.style.paddingRight = this.originalPaddingRight || '';
      this.context.windowManagerContainer.style.boxSizing = this.originalBoxSizing || '';
    }
    this.panelContainer?.remove();
    this.onHide();
  }
  onShow(){
    // todo 监听 panel 被打开
    this.options.callbacks?.onShow?.();
  }

  onHide(){
    // todo 监听 panel 被关闭
    this.options.callbacks?.onHide?.();
  }

  activeCaptureView(){
    this.snapshotUtils.activeCaptureView();
  }
  cancalCaptureView(){
    this.snapshotUtils.cancalCaptureView();
  }


  isAutoSnapshotActived(): boolean {
    return this.autoSnapshotPlugin?.isActived || false;
  }

  activeAutoSnapshot(){
    this.autoSnapshotPlugin?.mount();
  }

  cancelAutoSnapshot(){
    this.autoSnapshotPlugin?.unMount();
  }

  async snapshot(fileName: string = 'snapshot.png', mimeType: string = 'image/png', quality: number = 1){
    const viewId = this.snapshotUtils.focusedId;
    return await this.snapshotUtils.snapshotByView(viewId, fileName, mimeType, quality);
  }

  async updateDbActiveAiChatId(activeAiChatId: AiChatId, force: boolean = false){
    await this.indexDbUtils.setItem('activeAiChatId', activeAiChatId);
    if (force && this.vDom) {
      this.vDom.setState({ activeAiChatId });
    }
  }

  async getDbActiveAiChatId(): Promise<AiChatId | undefined>{
    return await this.indexDbUtils.getItem<AiChatId>('activeAiChatId');
  }
  
  async updateDbRecord(chatId: string, record: AiChatRecordItem[], force: boolean = false){
    await this.indexDbUtils.setItem(chatId, record);
    if (force && this.vDom) {
      const tabs = await this.vDom.getTabs();
      this.vDom.setState({ tabs: tabs });
    }
  }

  async removeDbRecord(chatId: string, force: boolean = false){
    await this.indexDbUtils.removeItem(chatId);
    if (force && this.vDom) {
      const tabs = await this.vDom.getTabs();
      this.vDom.setState({ tabs: tabs });
    }
  }

  async getDbRecord(chatId: string): Promise<AiChatRecordItem[] | undefined>{
    return await this.indexDbUtils.getItem<AiChatRecordItem[]>(chatId);
  }

  async getDbRecordIds(): Promise<string[]>{
    return await this.indexDbUtils.getAllItemKeys().then(keys => {
      return keys && keys.filter(key => key !== 'activeAiChatId') || [];
    });
  }

  async clearDb(){
    await this.indexDbUtils.clear();
  }

} 