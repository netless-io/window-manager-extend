/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo, useRef } from 'react'
import ReactDOM from 'react-dom'
import './index.css';
import '@netless/appliance-plugin/dist/style.css'
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
import { createFastboard, createUI, apps, register, replayFastboard } from '@netless/fastboard';
import { Fastboard, useFastboard } from '@netless/fastboard-react';
// import { ExtendPastePlugin } from '@netless/window-manager-paste-extend';
import CombinePlayerFactory from '@netless/combine-player';
// import { ExtendBackgroundPlugin } from '@netless/window-manager-background-extend';
// import { ExtendScrollbarPlugin } from '@netless/window-manager-scrollbar-extend';
import { ExtendAIPlugin } from '@netless/window-manager-ai-extend';
// import { ExtendMarkmapPlugin } from '@netless/window-manager-markmap-extend';
// import { ExtendWheelPlugin } from '@netless/window-manager-wheel-extend';
import { install } from "@netless/app-presentation"
import { useEffect } from 'react';
// import { ExtendMathsKitPlugin } from '@netless/window-manager-maths-kit-extend';
import { uploadImage } from './server-api/uploadfile';
// import { getImageSize } from './utils';
// import { Region } from './region';
import { View } from 'white-web-sdk';
const fullWorkerBlob = new Blob([fullWorkerString], { type: 'text/javascript' });
const fullWorkerUrl = URL.createObjectURL(fullWorkerBlob);
const subWorkerBlob = new Blob([subWorkerString], { type: 'text/javascript' });
const subWorkerUrl = URL.createObjectURL(subWorkerBlob);

install(register, { as: 'DocsViewer', appOptions: {
  useScrollbar: true,
  debounceSync: true,
  maxCameraScale: 5,
  useClipView: true,
}});

apps.push({
  icon: "https://api.iconify.design/mdi:file-word-box.svg?color=%237f7f7f",
  kind: "DocsViewer",
  label: "Docs",
  onClick: (app) => {
    app.insertDocs({
      fileType: "pdf",
      scenePath: `/pdf/18140800fe8a11eb8cb787b1c376634e`,
      title: "a.pdf",
      scenes: [
        {
          name: "a.pdf - 第 1 页",
          ppt: {
            height: 1010,
            src: "https://convertcdn.netless.link/staticConvert/18140800fe8a11eb8cb787b1c376634e/1.png",
            width: 714,
          },
        },
        {
          name: "a.pdf - 第 2 页",
          ppt: {
            height: 1010,
            src: "https://convertcdn.netless.link/staticConvert/18140800fe8a11eb8cb787b1c376634e/2.png",
            width: 714,
          },
        },
      ],
    });
  },
});

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

register({
  kind: 'Slide',
  src: () => import("@netless/app-slide"),
  appOptions: {
    minFPS:10,
    maxFPS:20,
    resolution: 1,
    maxResolutionLevel: 2,
    skipActionWhenFrozen: true,
    antialias: false,
    enableScale: true,
  }
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
      extras: {
        useSimple: true,
        useBackgroundThread: true,
        textEditor: {
          showFloatBar: false,
          canSelectorSwitch: false,
          rightBoundBreak: true,
          extendFontFaces: [
            {
              fontFamily: "Noto Sans SC",
              src: "https://fonts.gstatic.com/s/opensans/v44/memvYaGs126MiZpBA-UvWbX2vVnXBbObj2OVTS-mu0SC55I.woff2",
            },
          ],
          loadFontFacesTimeout: 20000,
        },
        markmap: {
          enable: false,
          timeout: 20000,
          options: {
            autoFit: true,
            duration: 0,
            zoom: false,
            pan: false,
            maxInitialScale: 10
          },
        },
      }
    }
  })
  const ui = createUI(fastboard, elm);
  if (fastboard.manager) {
    console.log('fastboard.room.isWritable', fastboard.room.isWritable, fastboard.room.disableCameraTransform);
    // const { width, height } = fastboard.manager.mainView.size;
    // const { scale } = fastboard.manager.mainView.camera;
    // const mathsKitPlugin = new ExtendMathsKitPlugin({
    //   readonly: true,
    //   bindMainView: true,
    //   bindAppViews: true,
    // });
    // fastboard.manager.useExtendPlugin(mathsKitPlugin);
    // mathsKitPlugin.setReadonly(false);
    // window.mathsKitPlugin = mathsKitPlugin;
    // 初始化滚动条插件
    // const scrollbarPlugin = new ExtendScrollbarPlugin({
    //   readonly: true,
    //   scrollbarEventCallback: {
    //     onScrollCameraUpdated: (originScale, scale) => {
    //       console.log('onScrollCameraUpdated=====>', originScale, scale);
    //     }
    //   },
    // })
    // fastboard.manager.useExtendPlugin(scrollbarPlugin);
    // 初始化滚轮插件
    // const wheelPlugin = new ExtendWheelPlugin({
    //   readonly: true,
    //   activeKinds: ['Presentation', 'DocsViewer', 'Slide'],
    //   container: document.body,
    // });
    // fastboard.manager.useExtendPlugin(wheelPlugin);
    

    //如果是老师(初始化)
    // fastboard.manager.mainView.setCameraBound({
    //   centerX: 0,
    //   centerY: 0,
    //   width,
    //   height,
    //   damping:1
    // })
    // scrollbarPlugin.setOriginBound({
    //   width,
    //   height,
    //   scale,
    // });
    // wheelPlugin.setOriginMainViewBound({
    //   width,
    //   height,
    //   scale,
    // });
    // 如果有操作权限
    // scrollbarPlugin.setReadonly(false);
    // wheelPlugin.setReadonly(false);
    // end

    // const pastePlugin = new ExtendPastePlugin({
    //   useDrop: true,
    //   maxConvertFiles: 3,
    //   container: document.body,
    //   convertFile: async (file) => {
    //     const fileType = getFileType(file);
    //     if (fileType.type !== 'image') {
    //       return null;
    //     }
    //     const result = await uploadFile(file, fastboard.room.region as Region);
    //     if (!result) {
    //       return null;
    //     }
    //     switch (result.kind) {
    //       case 'Image': {
    //         const { width, height } = await getImageSize(file);
    //         if (result.url) {
    //           return {
    //             kind: 'Image',
    //             url: result.url,
    //             width,
    //             height,
    //             crossOrigin: true,
    //             centerX: -100,
    //             centerY: -100,
    //             uuid: fastboard.room?.calibrationTimestamp?.toString() || Date.now().toString()
    //           };
    //         }
    //         return null;
    //       }
    //       case 'Error':
    //         console.error(`🔄 文件转换失败, error: ${result.error}`);
    //         return null;
    //       default:
    //         return null;
    //     }
    //   },
    //   interrupter: (hasConvert) => {
    //     // console.log('interrupter=====>', hasConvert);
    //     alert('是否存在正在转换文件: ' + hasConvert);
    //     return hasConvert;
    //   }
    // })
    // fastboard.manager.useExtendPlugin(pastePlugin);
    // const backgroundPlugin = new ExtendBackgroundPlugin()
    // fastboard.manager.useExtendPlugin(backgroundPlugin)
    // window.backgroundPlugin = backgroundPlugin;

    // const scrollbarPlugin = new ExtendScrollbarPlugin({
    //   readonly: true,
    //   scrollbarEventCallback: {
    //     onScrollCameraUpdated: (originScale, scale) => {
    //       console.log('onScrollCameraUpdated', originScale, scale);
    //     }
    //   }
    // })
    // fastboard.manager.useExtendPlugin(scrollbarPlugin)
    // window.scrollbarPlugin = scrollbarPlugin;

    const aiPlugin = new ExtendAIPlugin({
      uploadFile: uploadImage,
      models: ['nvidia/nemotron-nano-12b-v2-vl:free'],
      apiKey: "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",
      callbacks: {
        onShow: () => {
          console.log('onShow');
        },
        onHide: () => {
          console.log('onHide');
        }
      }
    })
    fastboard.manager.useExtendPlugin(aiPlugin)
    window.aiPlugin = aiPlugin;

    // const markmapPlugin = new ExtendMarkmapPlugin({
    //   readonly: !isWritable,
    //   bindMainView: true,
    //   bindAppViews: false,
    // })
    // fastboard.manager.useExtendPlugin(markmapPlugin)
    // window.markmapPlugin = markmapPlugin;
    const setOriginBound = (view: View) => {
      let originBound = null;
      if (sessionStorage.getItem('originBound')) {
        originBound = JSON.parse(sessionStorage.getItem('originBound') || '{}');
      } else {
        const { width, height } = fastboard.manager.mainView.size;
        originBound = {
          width,
          height,
          scale: 1
        }
        sessionStorage.setItem('originBound', JSON.stringify(originBound));
      }
      console.log('onMainViewMounted', view.size, originBound, fastboard.manager.mainView.size);
      // backgroundPlugin.setOriginBound(originBound);
      // scrollbarPlugin.setOriginBound({
      //   width: originBound.width,
      //   height: originBound.height,
      //   scale: 1
      // });
      // fastboard.manager.setCameraBound({
      //   centerX: 0,
      //   centerY: 0,
      //   width: originBound.width,
      //   height: originBound.height,
      //   minContentMode: () => {
      //     return 1;
      //   },
      //   maxContentMode: () => {
      //     return 5;
      //   }
      // });
      // 如果需要设置背景图
      // backgroundPlugin.setBackgroundImage({
      //   url: "https://h5-static.talk-cloud.net/static/wukong_4.6.2.1/asset/18e47f9235ba112c3f02.png",
      //   crossOrigin: 'anonymous'
      // })
    }

    // fastboard.manager.emitter.on('onMainViewRebind', (view) => {

    //   // 模拟是老师初始化 则设置背景图片
    //   if (fastboard.room.uid.indexOf('1234') > 0) {
    //     setOriginBound(view)
    //     // scrollbarPlugin.setReadonly(false);
    //     // 判断是非是老师第一次进入房间
    //     if (!fastboard.manager.attributes.mainViewSize && !fastboard.manager.attributes.mainViewCamera) {
    //       fastboard.manager.moveCamera({scale: 1, centerX: 0, centerY: 0})
    //     } else {
    //       // fastboard.manager.moveCamera({scale: backgroundPlugin.originScale})
    //     }
    //   }
    //   // window.backgroundPlugin = backgroundPlugin;
    // })
    
    fastboard.manager.emitter.on('onMainViewMounted', (view) => {
      // 模拟是老师初始化 则设置背景图片
      if (fastboard.room.uid.indexOf('1234') > 0) {
        setOriginBound(view)
        // scrollbarPlugin.setReadonly(false);
        // 判断是非是老师第一次进入房间
        if (!fastboard.manager.attributes.mainViewSize && !fastboard.manager.attributes.mainViewCamera) {
          fastboard.manager.moveCamera({scale: 1, centerX: 0, centerY: 0})
        } else {
          // fastboard.manager.moveCamera({scale: backgroundPlugin.originScale})
        }
      }
      // window.backgroundPlugin = backgroundPlugin;
      // window.scrollbarPlugin = scrollbarPlugin;
    });

    const mainView = fastboard.manager.mainView;
    if (mainView) {
      setOriginBound(mainView)
      // scrollbarPlugin.setReadonly(false);
    }
    // window.scrollbarPlugin = scrollbarPlugin;
    // window.wheelPlugin = wheelPlugin;
    // fastboard.appliancePlugin.disableCameraTransform = true;
    // fastboard.room.disableCameraTransform = true;
  }
  if (fastboard.room) {
    // fastboard.room.callbacks.on('onRoomStateChanged', (state: RoomState) => {
    //   const roomMembers = state.roomMembers;
    //   const member = roomMembers.find((member: any) => member.memberState.strokeColor == [255,255,255]);
    //   if (member) {
    //     const uid = member.payload.uid;
    //     // cssText style 设置 uid 的样式
    //     const style = document.createElement('style');
    //     style.textContent = `.netless-window-manager-cursor-name[data-cursor-uid="${uid}"] .netless-window-manager-cursor-inner  {
    //       color: #000 !important;
    //     }`;
    //     document.head.appendChild(style);
    //   }
    // })
  }
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
  page: "window-manager" | "fastboard" | "fastboard-react" | "combinePlayer";
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
  const manager = fastboard.manager;
  if (manager) {
    // const wheelPlugin = new ExtendWheelPlugin({
    //   activeKinds: ['Presentation', 'DocsViewer', 'Slide']
    // });
    // manager.useExtendPlugin(wheelPlugin);
    // window.wheelPlugin = wheelPlugin;
    // const pastePlugin = new ExtendPastePlugin({
    //   useDrop: true,
    //   maxConvertFiles: 3,
    //   // language: 'zh-CN',
    //   convertFile: async (file) => {
    //     const result = await uploadFile(file, fastboard.room.region as Region);
    //     switch (result.kind) {
    //       case 'Image': {
    //         const { width, height } = await getImageSize(file);
    //         if (result.url) {
    //           return {
    //             kind: 'Image',
    //             url: result.url,
    //             width,
    //             height,
    //             crossOrigin: true
    //           };
    //         }
    //         return null;
    //       }
    //       case 'MediaPlayer': {
    //         if (result.url) {
    //           return {
    //             kind: 'MediaPlayer',
    //             title: file.name,
    //             url: result.url,
    //           };
    //         }
    //         return null;
    //       }
    //       case 'Slide': {
    //         if (result.convertedUrl && result.taskId) {
    //           return {
    //             kind: 'Slide',
    //             title: file.name,
    //             url: result.convertedUrl,
    //             taskId: result.taskId,
    //             scenePath: `/pptx/${result.taskId}`
    //           };
    //         }
    //         return null;
    //       }
    //       case 'DocsViewer': {
    //         if (result.convertedUrl && result.taskId && result.images) {
    //           const scenes = Object.entries(result.images).map(([name, value]) => ({
    //             name: name,
    //             ppt: {
    //               src: value.url,
    //               width: value.width,
    //               height: value.height
    //             }
    //           }));
    //           return {
    //             kind: 'DocsViewer',
    //             title: file.name,
    //             taskId: result.taskId,
    //             scenePath: `/docs/${result.taskId}`,
    //             scenes
    //           };
    //         }
    //         return null;
    //       }
    //       case 'PDFjs': {
    //         if (result.convertedUrl && result.taskId) {
    //           return {
    //             kind: 'PDFjs',
    //             title: file.name,
    //             prefix: result.convertedUrl,
    //             taskId: result.taskId,
    //             scenePath: `/pdf/${result.taskId}`
    //           };
    //         }
    //         return null;
    //       }
    //       case 'Error':
    //         console.error(`🔄 文件转换失败, error: ${result.error}`);
    //         return null;
    //       default:
    //         return null;
    //     }
    //   }
    // });
    // fastboard.manager.useExtendPlugin(pastePlugin);
  }
  // ui.update({ theme: 'dark' });
  window.fastboard = fastboard;
  return <Fastboard app={fastboard} />
}

async function createReplay(params: {
  uuid: string;
  roomToken: string;
  appIdentifier: string;
  page: "combinePlayer";
  beginTimestamp: number;
  duration: number;
}) {
  const { uuid, roomToken, appIdentifier, page, beginTimestamp, duration } = params;
  return { uuid, roomToken, appIdentifier, page, beginTimestamp, duration };
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
    if (ref.current && page === "fastboard") {
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
  }, [isWritable, roomToken, uid, uuid, page])
  
  return <div className='whiteboard-container' ref={ref}>
    { whiteboard }
  </div>
};

const ReplayContainer = () => {
  const data = useLoaderData() as any;
  const ref = useRef<HTMLDivElement>(null);
  const { uuid, roomToken, uid, page, beginTimestamp, duration } = data;
  console.log(uuid, roomToken, uid, page, beginTimestamp, duration);

  useEffect(() => {
    if (ref.current && page === "combinePlayer") {
      console.log('ref.current', ref.current);
      createReplayUI({
        elm: ref.current,
        uuid,
        roomToken,
        appIdentifier,
        uid,
        beginTimestamp,
        duration,
      })
    }
  }, [roomToken, uid, uuid, page])

  return <div className='whiteboard-container' ref={ref}>
  </div>
}

async function createReplayUI(params: {
  elm: HTMLDivElement;
  uuid: string;
  roomToken: string;
  appIdentifier: string;
  uid: string;
  beginTimestamp: number;
  duration: number;
}) {
  const { elm, uuid, roomToken, appIdentifier, beginTimestamp, duration } = params;  
  replayFastboard({
    sdkConfig: {
      appIdentifier,
      region: "cn-hz",
    },
    replayRoom: {
      room: uuid,
      beginTimestamp,
      duration,
      roomToken,
    },
    managerConfig: {
      cursor: true,
    },
    enableAppliancePlugin: {
      cdn: {
        fullWorkerUrl,
        subWorkerUrl,
      },
      extras: {
        useSimple: true,
        strokeWidth: {
          min: 1,
          max: 32
        },
        syncOpt: {
          interval: 200
        },
        cursor: {
          enable: true,
          expirationTime: 10000,
        },
        bezier: {
          enable: false,
          combineUnitTime: 200,
          maxDrawCount: 180,
        },
        textEditor: {
          showFloatBar: false,
          canSelectorSwitch: true,
          rightBoundBreak: true,
          extendFontFaces: [
            {
              fontFamily: "Noto Sans SC",
              src: "https://fonts.gstatic.com/s/opensans/v44/memvYaGs126MiZpBA-UvWbX2vVnXBbObj2OVTS-mu0SC55I.woff2",
            },
          ],
          loadFontFacesTimeout: 20000,
        }
      },
    },
  }).then(player => {
    (window as any).player = player;
    const whiteboard = document.getElementById("whiteboard") as HTMLDivElement;
    player.bindContainer(whiteboard);
    const factoryParams = {
      url: "https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-576p.mp4",
      videoDOM: document.getElementById('videoDom') as HTMLVideoElement, // 用于存放视频播放器的 div 节点
    };
    const combinePlayer = new CombinePlayerFactory(player.player, factoryParams).create(false); 
    (window as any).combinePlayer = combinePlayer;
  });
}

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
    <Route path="/combinePlayer" loader={({ request }) => {
        const url = new URL(request.url);
        const uuid = url.searchParams.get("uuid");
        const roomToken = url.searchParams.get("roomToken");
        const beginTimestamp = url.searchParams.get("beginTimestamp");
        const duration = url.searchParams.get("duration");
        if (uuid && roomToken && beginTimestamp && duration) {
          if (window.fastboardReplayUI) {
            window.fastboardReplayUI.destroy();
          }
          if (window.manager) {
            window.manager.destroy();
          }
          return createReplay({ uuid, roomToken, appIdentifier, beginTimestamp: Number(beginTimestamp), duration: Number(duration), page: "combinePlayer" });
        }
        return {};
    }} element={<ReplayContainer/>} />
  </Route> as any
))

ReactDOM.render(
  <RouterProvider router={routerData} />, 
  document.getElementById('root') as HTMLElement
);