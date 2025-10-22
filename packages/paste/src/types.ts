import type { AddAppOptions, SceneDefinition } from '@netless/window-manager';

export type PasteFileResult = PasteImageResult | PasteMediaResult | 
  PasteDocViewResult | PasteSildeResult | PastePdfResult |
  PasteCustomResult | PasteErrorResult;
  
export type PasteImageResult = {
  kind: 'Image';
  url: string;
  width: number;
  height: number;
  crossOrigin?: boolean;
  centerX?: number;
  centerY?: number;
  locked?: boolean;
  uuid?: string;
}

export type PasteMediaResult = {
  kind: 'MediaPlayer';
  title: string;
  url: string;
}

export type PasteSildeResult = {
  kind: 'Slide';
  title: string;
  url: string;
  taskId: string;
  scenePath?: string;
}

export type PastePdfResult = {
  kind: 'PDFjs';
  title: string;
  prefix: string;
  taskId: string;
  scenePath?: string;
}

export type PasteDocViewResult = {
  kind: 'DocsViewer';
  title: string;
  taskId: string;
  scenes: SceneDefinition[];
  scenePath?: string;
}

export type PasteErrorResult = {
  kind: 'Error';
  error: string;
}

export type PasteCustomResult<TAttributes = Record<string, unknown>> = {
  kind: string;
  options?: AddAppOptions;
  attributes?: TAttributes;
}