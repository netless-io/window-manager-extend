import {resolve} from "path";
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// import path from "path";

// https://vitejs.dev/config/
export default defineConfig(()=>{
  // const _path = path.resolve(__dirname, "../");
  // console.log(_path);
  return {
    plugins: [react()],
    css: {
      modules:{
        generateScopedName:'[name]__[local]__[hash:base64:5]',
        hashPrefix:'prefix',
      },
      preprocessorOptions:{
        less:{}
      },
    },
    build: {
      outDir: "dist",
      sourcemap: false,
      rollupOptions:{
        input: resolve(__dirname,'index.html'),
      }
    },
    server: {},
  }
})