/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo, useRef } from 'react'
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
import fullWorkerString from '@netless/appliance-plugin/dist/fullWorker.js?raw';
import subWorkerString from '@netless/appliance-plugin/dist/subWorker.js?raw';
import { createFastboard, createUI, apps, register } from '@netless/fastboard';
import { Fastboard, useFastboard } from '@netless/fastboard-react';
import { ExtendPastePlugin } from '@netless/window-manager-paste-extend'
import { install } from "@netless/app-presentation"
import { useEffect } from 'react';
import { uploadFile } from './server-api/uploadfile';
import { getImageSize } from './utils';
import { Region } from './region';
const fullWorkerBlob = new Blob([fullWorkerString], { type: 'text/javascript' });
const fullWorkerUrl = URL.createObjectURL(fullWorkerBlob);
const subWorkerBlob = new Blob([subWorkerString], { type: 'text/javascript' });
const subWorkerUrl = URL.createObjectURL(subWorkerBlob);

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

// quill
register({
  kind: 'Quill',
  src: () => import("@netless/app-quill")
})

apps.delete(app => app.kind === "Monaco");
apps.delete(app => app.kind === "GeoGebra");

apps.push({
  icon: "https://api.iconify.design/hugeicons:quill-write-02.svg?color=%237f7f7f",
  kind: 'Quill',
  label: 'Quill',
  async onClick(app) {
    app.manager.addApp({
      kind: 'Quill',
    })
  },
});

apps.push({
  icon: "https://api.iconify.design/mdi:file-powerpoint-box.svg?color=%237f7f7f",
  kind: "Slide",
  label: "Slide",
  onClick: (app) => {
    let taskId: string;
    let url: string | undefined;
    if (app.room.region === "cn-hz") {
      taskId = "82d16c40b15745f0b5fad096ac721773";
    } else {
      taskId = "1bd92aa00e28413c8668cffdbc97116f";
      url = "https://convertcdn-sg.netless.link/dynamicConvert";
    }
    app.insertDocs({
      fileType: "pptx",
      scenePath: `/pptx/${taskId}`,
      taskId,
      title: "a.pptx",
      url,
    });
  },
});

const appIdentifier = '123456789/987654321';
const region = 'cn-hz';

async function createFastboardUI(params: {
  elm: HTMLDivElement;
  uuid: string;
  roomToken: string;
  appIdentifier: string;
  uid: string;
  isWritable: boolean;
}) {
  const { elm, uuid, roomToken, appIdentifier, uid, isWritable } = params;
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
      // hotKeys:{
      //   'paste': {
      //     key: 'v',
      //     ctrlKey: true,
      //     shiftKey: false,
      //     altKey: false,
      //   }
      // },
      useNativeClipboard: true,
    },
    managerConfig: {
      cursor: true,
      supportAppliancePlugin: true,
      // prefersColorScheme: 'dark'
    },
    enableAppliancePlugin: {
      cdn: {
        fullWorkerUrl,
        subWorkerUrl,
      },
      syncOpt: {
        interval: 200,
      },
      bezier: {
        combineUnitTime: 200,
        maxDrawCount: 200
      }
    }
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
  page: "window-manager" | "fastboard" | "fastboard-react";
}) {
  const { uuid, roomToken, appIdentifier, page } = params;
  const sUid = sessionStorage.getItem('uid');
  // 默认"1234"是可写的
  const isWritable = !!(sUid && sUid.indexOf('1234') > 0);
  const uid = sUid || 'uid-' + Math.floor(Math.random() * 10000);
  if (!sUid) {
      sessionStorage.setItem('uid', uid); 
  }
  return { uuid, roomToken, appIdentifier, uid, isWritable, page };
}

const FastboardReact = (props: { data: any }) => {
  const { data } = props;
  const { uuid, roomToken, appIdentifier, uid, isWritable } = data;
  const fastboard = useFastboard(() => ({
    sdkConfig: {
      appIdentifier,
      region, 
    },
    managerConfig: {
      cursor: true,
      // enableAppliancePlugin: true,
    },
    joinRoom: {
      uid,
      uuid,
      roomToken,
      isWritable,
      floatBar: true,
      useNativeClipboard: true,
      userPayload: {
        nickName: `nick-${uid}`,
      },
      // hotKeys:{
      //   ...DefaultHotKeys,
      //   paste: undefined
      // }
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
  }));
  if (!fastboard) {
    return null;
  }
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
  // ui.update({ theme: 'dark' });
  window.fastboard = fastboard;
  return <Fastboard app={fastboard} />  
}

const Container = () => {
  const data = useLoaderData() as any;
  const ref = useRef<HTMLDivElement>(null);
  const { uuid, roomToken, uid, isWritable, page } = data;
  console.log(uuid, roomToken, uid, isWritable, page);
  const whiteboard = useMemo(() => {
    if (page === "fastboard-react") {
      return <FastboardReact data={data}/>
    }
    return null
  }, [data, page])

  useEffect(() => {
    if (ref.current) {
      console.log('ref.current', ref.current);
      createFastboardUI({
        elm: ref.current,
        uuid,
        roomToken,
        appIdentifier,
        uid,
        isWritable
      })
    }
  }, [isWritable, roomToken, uid, uuid, whiteboard])
  
  return <div className='whiteboard-container' ref={ref}>
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
    <Route path="/fastboard-react" loader={({ request }) => {
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
          return createUid({ uuid, roomToken, appIdentifier, page: "fastboard-react" });
        }
        return {};
    }} element={<Container/>} />
  </Route> as any
))

ReactDOM.render(
  <RouterProvider router={routerData} />, 
  document.getElementById('root') as HTMLElement
);