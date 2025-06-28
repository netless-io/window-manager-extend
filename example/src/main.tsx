/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo } from 'react'
import ReactDOM from 'react-dom'
import './index.css';
import {
  createHashRouter,
  createRoutesFromElements,
  RouterProvider,
  Route,
  useLoaderData
} from "react-router-dom";
import IndexPage from '.';
// import fullWorkerString from '@netless/appliance-plugin/dist/fullWorker.js?raw';
// import subWorkerString from '@netless/appliance-plugin/dist/subWorker.js?raw';
import { createFastboard, createUI, apps, register } from '@netless/fastboard';
import { ExtendPastePlugin } from '@netless/window-manager-paste-extend'
import { install } from "@netless/app-presentation"
import { useEffect } from 'react';
import { uploadFile } from './server-api/uploadfile';
import { getImageSize } from './utils';
import { Region } from './region';

apps.delete(app => app.kind === "Monaco");
apps.delete(app => app.kind === "GeoGebra");


const appIdentifier = '123456789/987654321';
const region = 'cn-hz';

install(register, { as: 'DocsViewer' });
register({
  kind: "PDFjs",
  src: "https://cdn.jsdelivr.net/npm/@netless/app-pdfjs@0.1.6",
  name: "NetlessAppPDFjs",
  appOptions: {
    pdfjsLib: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@latest/build/pdf.min.mjs',
    workerSrc: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@latest/build/pdf.worker.min.mjs'
  }
});

async function createFastboardUI(params: {
  elm: HTMLDivElement;
  uuid: string;
  roomToken: string;
  appIdentifier: string;
  uid: string;
  isWritable: boolean;
}) {
  const { elm, uuid, roomToken, appIdentifier, uid, isWritable } = params;
  // const fullWorkerBlob = new Blob([fullWorkerString], { type: 'text/javascript' });
  // const fullWorkerUrl = URL.createObjectURL(fullWorkerBlob);
  // const subWorkerBlob = new Blob([subWorkerString], { type: 'text/javascript' });
  // const subWorkerUrl = URL.createObjectURL(subWorkerBlob);
  const fastboard = await createFastboard({
    sdkConfig: {
      appIdentifier,
      region,
    },
    joinRoom: {
      uid,
      uuid,
      roomToken,
      isWritable,
      userPayload: {
        nickName: `nick-${uid}`,
      },
      useNativeClipboard: true,
    },
    managerConfig: {
      cursor: true,
      // supportAppliancePlugin: true,
      // prefersColorScheme: 'dark'
    },
    // enableAppliancePlugin: {
    //   cdn: {
    //     fullWorkerUrl,
    //     subWorkerUrl,
    //   },
    //   syncOpt: {
    //     interval: 200,
    //   },
    //   bezier: {
    //     combineUnitTime: 200,
    //     maxDrawCount: 200
    //   }
    // }
  })

  if (fastboard.manager) {
    const pastePlugin = new ExtendPastePlugin({
      useDrop: true,
      maxConvertFiles: 3,
      // language: 'zh-CN',
      convertFile: async (file) => {
        const result = await uploadFile(file, fastboard.room.region as Region);
        switch (result.kind) {
          case 'Image': {
            const { width, height } = await getImageSize(file);
            if (result.url) {
              return {
                kind: 'Image',
                url: result.url,
                width,
                height,
                crossOrigin: true
              };
            }
            return null;
          }
          case 'MediaPlayer': {
            if (result.url) {
              return {
                kind: 'MediaPlayer',
                title: file.name,
                url: result.url,
              };
            }
            return null;
          }
          case 'Slide': {
            if (result.convertedUrl && result.taskId) {
              return {
                kind: 'Slide',
                title: file.name,
                url: result.convertedUrl,
                taskId: result.taskId,
                scenePath: `/pptx/${result.taskId}`
              };
            }
            return null;
          }
          case 'DocsViewer': {
            if (result.convertedUrl && result.taskId && result.images) {
              const scenes = Object.entries(result.images).map(([name, value]) => ({
                name: name,
                ppt: {
                  src: value.url,
                  width: value.width,
                  height: value.height
                }
              }));
              return {
                kind: 'DocsViewer',
                title: file.name,
                taskId: result.taskId,
                scenePath: `/docs/${result.taskId}`,
                scenes
              };
            }
            return null;
          }
          case 'PDFjs': {
            if (result.convertedUrl && result.taskId) {
              return {
                kind: 'PDFjs',
                title: file.name,
                prefix: result.convertedUrl,
                taskId: result.taskId,
                scenePath: `/pdf/${result.taskId}`
              };
            }
            return null;
          }
          case 'Error':
            console.error(`🔄 文件转换失败, error: ${result.error}`);
            return null;
          default:
            return null;
        }
      }
    });
    fastboard.manager.useExtendPlugin(pastePlugin);
  }
  const ui = createUI(fastboard, elm);
  // ui.update({ theme: 'dark' });
  window.fastboard = fastboard;
  window.fastboardUI = ui;
  return {
    fastboard,
    ui
  }
}

async function createUid(params: {
  uuid: string;
  roomToken: string;
  appIdentifier: string;
  page: "window-manager" | "fastboard";
}) {
  const { uuid, roomToken, appIdentifier, page } = params;
  const sUid = sessionStorage.getItem('uid');
  // 默认"1234"是可写的
  const isWritable = !!(sUid && sUid.indexOf('1234') > 0);
  const uid = sUid || 'uid-' + Math.floor(Math.random() * 10000);
  if (!sUid) {
      sessionStorage.setItem('uid', uid); 
  }
  let ui;
  if (page === "fastboard") {
    const result = await createFastboardUI({
      elm: document.getElementById('whiteboard') as HTMLDivElement,
      uuid,
      roomToken,
      appIdentifier,
      uid,
      isWritable
    });
    ui = result.ui;
  }
  return { uuid, roomToken, appIdentifier, uid, isWritable, page, ui };
}

const Container = () => {
  const { uuid, roomToken, uid, isWritable, page, ui } = useLoaderData() as any;
  console.log(uuid, roomToken, uid, isWritable, page);
  const whiteboard = useMemo(() => {
    if (page === "fastboard") {
      return <div>fastboard...</div>
    }
    return null
  }, [page])

  useEffect(() => {
    return () => {
      if (ui) {
        ui.destroy();
      }
    }
  }, [ui])
  
  return <div className='whiteboard-container'>
    { whiteboard }
  </div>
};

const routerData = createHashRouter(createRoutesFromElements(
  <Route>
    <Route path="/" element={<IndexPage/>} />
    <Route path="/fastboard" loader={({ request }) => {
        const url = new URL(request.url);
        const uuid = url.searchParams.get("uuid");
        const roomToken = url.searchParams.get("roomToken");
        if (uuid && roomToken) {
          if (window.fastboardUI) {
            window.fastboardUI.destroy();
          }
          if (window.manager) {
            window.manager.destroy();
          }
          return createUid({ uuid, roomToken, appIdentifier, page: "fastboard" });
        }
        return {};
    }} element={<Container/>} />
  </Route> as any
))

ReactDOM.render(
  <RouterProvider router={routerData} />, 
  document.getElementById('root') as HTMLElement
);