import React from 'react';
import { Button, Dropdown, MenuProps, Space, Tabs, ConfigProvider, theme } from 'antd';
import { I18n, I18nKey, Language } from '../locale';
import { AIPanelController } from '../controller';
import { Message, TextContent } from '../types';
import { isArray, isString } from 'lodash';
import { ChatApp } from './chat';
import { CloseOutlined, EllipsisOutlined } from '@ant-design/icons';
import { OpenRouter } from '@openrouter/sdk';
import { getOpenRouterModelsByQuery } from '../server-api/openRuter-api';

export type TargetKey = React.MouseEvent | React.KeyboardEvent | string;
export type AiChatId = string;

export type AiChatRecordItem = Message ;

export type PanelAppProps = {
    controller: AIPanelController;
    language: Language;
};
export interface PanelAppState {
  activeAiChatId: AiChatId;
  activeMode: string;
  tabs: {label: string, key: string, children: Array<AiChatRecordItem> | ''}[];
  isCliping: boolean;
  isAutoCliping: boolean;
  models: string[];
}

export const PanelContext = React.createContext<{
  language: Language;
  i18n: Record<I18nKey, string>;
  isCliping: boolean;
  isAutoCliping: boolean;
  openrouter?: OpenRouter;
  models: string[];
  activeMode: string;
}>({
  language: 'zh-CN',
  i18n: I18n['zh-CN'],
  isCliping: false,
  isAutoCliping: false,
  openrouter: undefined,
  models: [],
  activeMode: '',
});

export class PanelApp extends React.Component<PanelAppProps, PanelAppState> {
  openrouter: OpenRouter;
  tabBarExtraItems: MenuProps['items'] = [
    {
      key: 'clear',
      label: 'clear',
    },
  ];
  constructor(props: PanelAppProps) {
    super(props);
    this.state = {
      activeAiChatId: '',
      activeMode: '',
      tabs: [],
      isCliping: false,
      isAutoCliping: false,
      models: [],
    };
    // 初始化 OpenRouter SDK
    // 注意：如果遇到 CORS 问题，可能需要检查 API Key 是否正确配置
    this.openrouter = new OpenRouter({ 
      apiKey: props.controller.options.apiKey,
      // 如果 SDK 支持，可以尝试添加以下配置
      // baseURL: 'https://openrouter.ai/api/v1',
    });
    this.getModels().then(models => this.setState({ models, activeMode: models[0] }));
  }

  private getModels = async (): Promise<string[]> => {
    const models = this.props.controller.options.models;
    if (isString(models)) {
      return [models];
    } else if (isArray(models)) {
      return models;
    } else {
      const freeModels = await getOpenRouterModelsByQuery({
        input_modalities: 'image',
        output_modalities: 'text',
        isFree: true,
      }).then(freeModels => freeModels.data.map((model: any) => model.id) as string[]);
      return freeModels;
    }
  };

  getTabs = async () => {
    const tabs: {label: string, key: string, children: Array<AiChatRecordItem> | ''}[] = [];
    let recordIds = await this.props.controller.getDbRecordIds();
    recordIds = recordIds.sort();
    for (const recordId of recordIds) {
      const record = await this.props.controller.getDbRecord(recordId);
      // 允许显示空数组记录，保留 key 和 label（record 可能是空数组 []）
      if (record !== undefined && record !== null) {
        // 确保 record 是数组（即使是空数组也要处理）
        const recordArray = Array.isArray(record) ? record : [];
        const tab = { label: 'new Chat', key: recordId, children: [...recordArray] }; // 使用展开运算符创建新数组
        
        // 只在有消息时更新 label
        if (recordArray.length > 0) {
          const message = recordArray.find((item: AiChatRecordItem) => item && (item as Message)?.role === 'user');
          if (message) {
            const content = (message as Message).content;
            let label = '';
            if(isArray(content)){
              const textContent = content.find((item: any) => item.type === 'text');
              if(textContent){
                label = (textContent as TextContent).text;
              }
            } else if (isString(content)) {
              label = content;
            }
            if (label) {
              tab.label = label.length > 10 ? label.slice(0, 10)+'...' : label;
            }
          }
        }
        
        // 检查是否有待发送的用户输入提示
        if (this.props.controller.inputUserPrompts.has(recordId)) {
          const inputUserPrompt = this.props.controller.inputUserPrompts.get(recordId);
          if (inputUserPrompt) {
            tab.children.push({ role: 'user', content: inputUserPrompt });
          }
        }
        tabs.push(tab);
      }
    }
    return tabs;
  };

  async componentDidMount() {
    const tabs = await this.getTabs();
    let state = {
      activeAiChatId: '',
      tabs,
    };
    if (tabs.length === 0) {
      await this.add();
    } else {
      const activeAiChatId = await this.props.controller.getDbActiveAiChatId();
      state = {
        activeAiChatId: activeAiChatId || tabs[0].key,
        tabs,
      };
      this.setState(state);
    }
    this.props.controller.vDom = this;
    this.props.controller.onShow();
  }
  componentWillUnmount() {
    this.props.controller.vDom = undefined;
    this.props.controller.onHide();
  }

  private onChange = (activeAiChatId: string) => {
    this.setState({ activeAiChatId });
  };
  private onEdit = (targetKey: TargetKey, action: 'add' | 'remove') => {
    if (action === 'add') {
      this.add();
    } else {
      this.remove(targetKey as string);
    }
  };

  private add = async () => {
    const newKey = Date.now().toString();
    await this.props.controller.updateDbRecord(newKey, []);
    const tabs = await this.getTabs();
    this.setState({ tabs: tabs, activeAiChatId: newKey });
  };

  private remove = async(targetKey: string) => {
    const hasInputUserPrompt = this.props.controller.inputUserPrompts.has(targetKey);
    if (hasInputUserPrompt) {
      this.props.controller.inputUserPrompts.delete(targetKey);
    }
    const record = await this.props.controller.getDbRecord(targetKey);
    if (!record) {
      return;
    }
    await this.props.controller.removeDbRecord(targetKey);
    const tabs = await this.getTabs();
    if (tabs.length > 0) {
      this.setState({ tabs, activeAiChatId: tabs[0].key });
    } else {
      await this.add();
    }
  };

  private onTabBarExtraMenuClick: MenuProps['onClick'] = async (info) =>{
    if (info.key === 'clear') {
      this.props.controller.inputUserPrompts.clear();
      await this.props.controller.clearDb();
      await this.add();
    }
  };

  private onClose = () => {
    this.props.controller.destroy();
    this.props.controller.vDom = undefined;
  };

  render(){
    const { controller, language } = this.props;
    const { activeAiChatId, activeMode, tabs, isCliping, isAutoCliping,  models } = this.state;
    const i18n = I18n[language];
    const currentTheme = controller.options.theme || 'light';
    const antdTheme = {
      algorithm: currentTheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
    };
    return (
      <div className={controller.c('panel')}>
        <ConfigProvider theme={antdTheme}>
          <PanelContext.Provider value={{ language, i18n, isCliping, isAutoCliping, openrouter: this.openrouter, models, activeMode }}>
            <Tabs
              type="editable-card"
              style={{ pointerEvents:'auto' }}
              onChange={this.onChange}
              activeKey={activeAiChatId}
              onEdit={this.onEdit}
              tabBarExtraContent={{ 'right': <Space.Compact>
                <Button onClick={this.onClose} icon={<CloseOutlined />}></Button>
                <Dropdown menu={{ items: this.tabBarExtraItems, onClick: this.onTabBarExtraMenuClick }} placement="bottomRight">
                  <Button icon={<EllipsisOutlined />} />
                </Dropdown>
              </Space.Compact> }}
              items={tabs.map(e=>(
                {
                  key: e.key,
                  label: e.label,
                  children: '',
                }
              ))}
            />
            <ChatApp
              activeAiChatId={activeAiChatId}
              key={activeAiChatId}
              record={tabs.find(e=>e.key === activeAiChatId)?.children || []}
              controller={controller}
              setActiveMode={(mode: string) => this.setState({ activeMode: mode })}
            />
          </PanelContext.Provider>
        </ConfigProvider>
      </div>
    );
  }
}
