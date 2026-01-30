import type { View, WindowManager } from '@netless/window-manager';
import type { PresentationController } from '@netless/app-presentation';
import type { AppResult as SlideAppResult } from '@netless/app-slide';


export type CallbacksFun = {
  onGenerateSnapshots: (snapshotFile: File) => Promise<void>;
  onClipStateChange?: (isCliping: boolean) => void;
}

export class UtilsSnapshot{
  private windowManager: WindowManager;
  private activeCaptureDiv?: HTMLDivElement;
  private clipRectDiv?: HTMLDivElement;
  private isCliping:boolean = false;
  private capturePoint: {
    start: {x: number, y: number} | undefined;
    end: {x: number, y: number} | undefined;
  } =  {
      start: undefined,
      end: undefined,
    }; 
  private callbacks: CallbacksFun;
  constructor(windowManager: WindowManager, callbacks: CallbacksFun) {
    this.windowManager = windowManager;
    this.callbacks = callbacks;
  }
  
  get focusedId(): string {
    return this.windowManager.focused || 'mainView';
  }

  get focusedView(): View | undefined {
    return this.getViewById(this.focusedId);
  }

  get focusedKind(): string | undefined {
    if (this.focusedId !== 'mainView') {
      return 'mainView';
    }
    return this.windowManager.queryOne(this.focusedId)?.kind;
  }

  get hasAppliancePlugin(): boolean {
    return !!this.windowManager._appliancePlugin;
  }

  private getViewById(viewId: string): View | undefined {
    if (viewId === 'mainView') {
      return this.windowManager.mainView;
    }
    return this.windowManager.queryOne(viewId)?.view as View;
  }
  private async snapshot(viewId: string, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    const view = this.getViewById(viewId);
    if (!view) {
      return undefined;
    }
    if (viewId === 'mainView') {
      const { width, height } = view.size;
      canvas.width = width;
      canvas.height = height;
      if (this.hasAppliancePlugin) {
        await this.windowManager._appliancePlugin.screenshotToCanvasAsync(
          ctx,
          view.focusScenePath || '/init',
          width,
          height,
          { ...view.camera },
        );
      } else {
        await view.screenshotToCanvasAsync(
          ctx,
          view.focusScenePath || '/init',
          width,
          height,
          view.camera,
        );
      }
    } else {
      const app = this.windowManager.queryOne(viewId);
      if (!app) {
        return;
      }
      const kind = app.kind;
      switch (kind) {
        case 'DocsViewer':
        case 'Presentation': {
          const app = this.windowManager.queryOne(viewId);
          if (!app) {
            return;
          }
          const appResult = app.appResult as unknown as PresentationController;
          const screenshotCurrentPageAsync = appResult?.screenshotCurrentPageAsync;
          const getPageSize = appResult?.getPageSize;
          if (!screenshotCurrentPageAsync || !getPageSize) {
            return;
          }
          const { width, height } = getPageSize();
          canvas.width = width;
          canvas.height = height;
          await screenshotCurrentPageAsync(ctx, width, height);
          break;
        }
        case 'Slide': {
          const app = this.windowManager.queryOne(viewId);
          if (!app) {
            return;
          }
          const appResult = app.appResult as unknown as SlideAppResult;
          const slide = appResult?.slide();
          const controller = appResult?.controller();
          const slideView = appResult?.viewer();
          if (!slide || !slideView) {
            return;
          }
          if (!controller) {
            (slideView as any).reportProgress(100, null);
            return;
          }
          const { width, height } = slide;
          if (!(slideView as any).getWhiteSnapshot) {
            (slideView as any).reportProgress(100, null);
            return ;
          }
          canvas.width = width;
          canvas.height = height;
          const pageIndex = (slide as any).player.currentIndex as number;
          const slideSnapshot = await controller.slide.snapshotWithTimingEnd(pageIndex);
          if (slideSnapshot) {
            const img = document.createElement('img');
            img.crossOrigin = 'anonymous';
            img.src = slideSnapshot;
            await new Promise(resolve => (img.onload = resolve));
            ctx.drawImage(img, 0, 0, width, height);
          }
          const whiteSnapshotCanvas = document.createElement('canvas');
          whiteSnapshotCanvas.width = width;
          whiteSnapshotCanvas.height = height;
          const whiteSnapshotCtx = whiteSnapshotCanvas.getContext('2d');
          if (whiteSnapshotCtx) {
            await (slideView as any).getWhiteSnapshot(pageIndex, whiteSnapshotCanvas, whiteSnapshotCtx, width, height);
            const whiteSnapshot = whiteSnapshotCanvas.toDataURL('image/png');
            const whiteImg = document.createElement('img');
            whiteImg.src = whiteSnapshot;
            await new Promise(resolve => (whiteImg.onload = resolve));
            ctx.drawImage(whiteImg, 0, 0, width, height);
          }
          break;
        }
      }
    }
  }
  async snapshotByView(viewId: string, fileName: string = 'snapshot.png', mimeType: string = 'image/png', quality: number = 1): Promise<File | undefined> {
    const view = this.getViewById(viewId);
    if (!view) {
      return;
    }
    const snapshotCanvas = document.createElement('canvas');
    const snapshotCtx = snapshotCanvas.getContext('2d');
    if (!snapshotCtx) {
      return;
    }
    await this.snapshot(viewId, snapshotCanvas, snapshotCtx);
    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        snapshotCanvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert canvas to blob'));
          }
        }, mimeType, quality);
      });
      const file = new File([blob], fileName, { type: mimeType });
      return file;
    } catch (err) {
      console.error(err);
      return;
    }
  }
  async snapshotByRect(viewId: string, rect: { x: number, y: number, width: number, height: number }, fileName: string = 'snapshot.png', mimeType: string = 'image/png', quality: number = 1): Promise<File | undefined> {
    const view = this.getViewById(viewId);
    if (!view) {
      return;
    }
    let snapshotRect: { x: number, y: number, width: number, height: number } | undefined;
    let offsetRect: { x: number, y: number, width: number, height: number } | undefined;
    if (viewId === 'mainView') {
      const { width, height } = view.size;
      const { centerX, centerY, scale } = view?.camera || { centerX: 0, centerY: 0 };
      snapshotRect = { x: centerX - width / 2 / scale, y: centerY - height / 2 / scale, width: width / scale, height: height / scale };
      offsetRect = { x: (rect.x - snapshotRect.x) * scale, y: (rect.y - snapshotRect.y) * scale, width: rect.width * scale, height: rect.height * scale };
    } else {
      const app = this.windowManager.queryOne(viewId);
      if (!app) {
        return;
      }
      const kind = app.kind;
      switch (kind) {
        case 'DocsViewer':
        case 'Presentation': {
          const appResult = this.windowManager.queryOne(viewId)?.appResult as unknown as PresentationController;
          if (!appResult) {
            return;
          }
          const { width, height } = appResult.getPageSize();
          snapshotRect = { x: 0 - width * 0.5, y: 0 - height * 0.5, width, height };
          offsetRect = { x: rect.x - snapshotRect.x, y: rect.y - snapshotRect.y, width: rect.width, height: rect.height };
          break;
        }
        case 'Slide': {
          const appResult = this.windowManager.queryOne(viewId)?.appResult as unknown as SlideAppResult;
          if (!appResult) {
            return;
          }
          const slide = appResult?.slide();
          const slideView = appResult?.viewer();
          if (!slide || !slideView) {
            return;
          }
          const { width, height } = slide;
          snapshotRect = { x: 0 - width * 0.5, y: 0 - height * 0.5, width, height };
          offsetRect = { x: rect.x - snapshotRect.x, y: rect.y - snapshotRect.y, width: rect.width, height: rect.height };
          break;
        }
      }
    }
    if (offsetRect) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return;
      }
      await this.snapshot(viewId, canvas, ctx);
      // 截取指定区域图像数据,然后放置到一个新的canvas中,最终转成file文件
      // 确保坐标和尺寸是整数，并且在canvas范围内
      const x = Math.max(0, Math.floor(offsetRect.x));
      const y = Math.max(0, Math.floor(offsetRect.y));
      const width = Math.max(1, Math.min(Math.floor(offsetRect.width), canvas.width - x));
      const height = Math.max(1, Math.min(Math.floor(offsetRect.height), canvas.height - y));
      
      if (width <= 0 || height <= 0 || x >= canvas.width || y >= canvas.height) {
        console.error('Invalid crop region:', { x, y, width, height, canvasWidth: canvas.width, canvasHeight: canvas.height });
        return;
      }
      const imageData = ctx.getImageData(x, y, width, height);
      const snapshotCanvas = document.createElement('canvas');
      snapshotCanvas.width = imageData.width;
      snapshotCanvas.height = imageData.height;
      const snapshotCtx = snapshotCanvas.getContext('2d');
      if (!snapshotCtx) {
        return ;
      }
      snapshotCtx.putImageData(imageData, 0, 0);
      try {
        const blob = await new Promise<Blob>((resolve, reject) => {
          snapshotCanvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to convert canvas to blob'));
            }
          }, mimeType, quality);
        });
        const file = new File([blob], fileName, { type: mimeType });
        return file;
      } catch (err) {
        console.error(err);
        return;
      }
    }
    return;
  }
  activeCaptureView() {
    if (!this.focusedView) {
      return;
    }
    const divElement = this.focusedView.divElement;
    if (!divElement) {
      return;
    }
    if (this.isCliping) {
      return;
    }
    const eventCaptureDiv = document.createElement('div');
    eventCaptureDiv.style.position = 'absolute';
    eventCaptureDiv.style.top = '0';
    eventCaptureDiv.style.left = '0';
    eventCaptureDiv.style.width = '100%';
    eventCaptureDiv.style.height = '100%';
    eventCaptureDiv.style.zIndex = '1000';
    eventCaptureDiv.style.pointerEvents = 'auto';
    eventCaptureDiv.style.cursor = 'crosshair';
    eventCaptureDiv.style.overflow = 'hidden';
    this.activeCaptureDiv = eventCaptureDiv;
    divElement.appendChild(this.activeCaptureDiv);
    this.activeCaptureDiv.addEventListener('pointerdown', this.pointerdownHandler);
  }
  destroy() {
    this.cancalCaptureView();
  }
  cancalCaptureView() {
    if (this.activeCaptureDiv) {
      this.activeCaptureDiv.removeEventListener('pointerdown', this.pointerdownHandler);
      this.activeCaptureDiv.remove();
      this.activeCaptureDiv = undefined;
      this.clipRectDiv = undefined;
      this.capturePoint.end = undefined;
      this.capturePoint.start = undefined;
      this.isCliping = false;
      this.callbacks.onClipStateChange?.(false);
    }
  }
  private pointerdownHandler = (e:PointerEvent) => {
    e.stopPropagation();
    if (this.isCliping) {
      return;
    }
    if (!this.activeCaptureDiv) {
      return;
    }
    this.isCliping = true;
    this.callbacks.onClipStateChange?.(true);
    this.capturePoint.start = { x: e.offsetX, y: e.offsetY };
    this.capturePoint.end = undefined;
    this.clipRectDiv = document.createElement('div');
    this.clipRectDiv.style.position='absolute';
    this.clipRectDiv.style.left = `${e.offsetX}px`;
    this.clipRectDiv.style.top = `${e.offsetY}px`;
    this.clipRectDiv.style.width = '0px';
    this.clipRectDiv.style.height = '0px';
    this.activeCaptureDiv?.append(this.clipRectDiv);
    document.addEventListener('pointermove', this.pointerMoveHandler);
    document.addEventListener('pointerup', this.pointerUpHandler);
    document.addEventListener('pointercancel', this.pointerUpHandler);
  };
  private pointerMoveHandler = (e:PointerEvent) =>{
    e.stopPropagation();
    if (e.cancelable) {
      e.preventDefault();
    }
    if (!this.capturePoint.start || !this.clipRectDiv) {
      return;
    }
    if (e.target !== this.activeCaptureDiv) {
      return;
    }
    this.capturePoint.end = { x: e.offsetX, y: e.offsetY };
    const rect = this.getRectFromPoints([this.capturePoint.start, this.capturePoint.end]);
    const { width, height } = rect;
    if (width > 4 && height > 4) {
      this.clipRectDiv.style.boxShadow = '0 0 0 9999px rgba(0, 0, 0, 0.1)';
    }
    this.clipRectDiv.style.width = `${width}px`;
    this.clipRectDiv.style.height = `${height}px`;
  };
  private pointerUpHandler = async (e:PointerEvent) => {
    e.stopPropagation();
    if (e.cancelable) {
      e.preventDefault();
    }
    const focusedView = this.focusedView;
    if (!focusedView) {
      return;
    }
    if (e.target !== this.activeCaptureDiv) {
      return;
    }
    this.capturePoint.end = { x: e.offsetX, y: e.offsetY };
    if (this.capturePoint.start && this.capturePoint.end) {
      const start = focusedView.convertToPointInWorld(this.capturePoint.start);
      const end = focusedView.convertToPointInWorld(this.capturePoint.end);
      const rect = this.getRectFromPoints([start, end]);
      if (rect.width < 5 || rect.height < 5) {
        return;
      }
      const uuid = this.windowManager.room.uuid;
      const uid = this.windowManager.room.uid;
      const fileName = `${uuid}_${uid}_${Date.now()}.png`;
      const snapshotFile = await this.snapshotByRect(this.focusedId, rect, fileName);
      if (snapshotFile) {
        try {
          await this.callbacks.onGenerateSnapshots(snapshotFile);
        } catch (error) {
          console.error(error);
        }
      }
    }
    this.cancalCaptureView();
  };
  private getRectFromPoints = (
    points: Array<{x:number, y:number}>,
  ) => {
    const rect = { x: 0, y: 0, width: 0, height: 0 };
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    points.forEach((p) => {
      const { x,y } = p;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    });
    rect.x = minX;
    rect.y = minY;
    rect.width = maxX - minX;
    rect.height = maxY - minY;
    return rect;
  };
}