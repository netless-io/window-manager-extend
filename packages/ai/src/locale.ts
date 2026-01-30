export type Language = 'en' | 'zh-CN';

export type Theme = 'light' | 'dark';

export type I18nData<T extends string> = Record<Language, Record<T, string>>;


export type I18nKey = 'title' | 'clip' | 'clipping' | 'autoClip' | 'autoClipping' | 'snapshot' | 'snapshotting' | 'cancel' | 'clear' | 'send' | 'noContent' | 'reasoning' | 'more';

export const I18n: I18nData<I18nKey> = {
  'en': {
    title: 'ai panel',
    clip: 'clip',
    clipping: 'clipping...',
    autoClip: 'auto clip',
    autoClipping: 'auto clipping...',
    snapshot: 'snapshot',
    snapshotting: 'snapshotting...',
    cancel: 'cancel',
    clear: 'clear',
    send: 'send',
    noContent: 'no content',
    reasoning: 'reasoning',
    more: '（click to more）',
  },
  'zh-CN': {
    title: 'ai 控制面板',
    clip: '手动截图',
    clipping: '截图中...',
    autoClip: '自动截图',
    autoClipping: '自动截图中...',
    snapshot: '页面快照',
    snapshotting: '页面快照中...',
    cancel: '取消',
    clear: '清除',
    send: '发送',
    noContent: '暂无内容',
    reasoning: '推理过程',
    more: '（点击展开查看完整内容）',
  },
};