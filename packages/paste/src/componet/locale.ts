export type Language = 'en' | 'zh-CN';

export type I18nData<T extends string> = Record<Language, Record<T, string>>;


export type I18nKey = 'title' | 'uploading';

export const I18n: I18nData<I18nKey> = {
  'en': {
    title: 'Upload list',
    uploading: 'The upload conversion is in progress. Please wait a moment...',
  },
  'zh-CN': {
    title: '转换列表',
    uploading: '正在上传转换中,请稍后...',
  },
};