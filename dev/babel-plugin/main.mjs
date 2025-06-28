import fs from 'fs';
import babel from '@babel/core';

export const babelPlugin = {
  name: 'babel',
  setup(build) {
    build.onLoad({ filter: /\.ts$/ }, async (args) => {
      // 读取文件内容
      const source = await fs.promises.readFile(args.path, 'utf8');

      // 使用 Babel 转译代码
      const result = await babel.transformAsync(source, {
        filename: args.path,
        presets: [
          ['@babel/preset-env', {
            'targets': '> 0.25%, not dead',
            'useBuiltIns': 'usage',
            'corejs': 3,
            'modules': false,
          }],
          '@babel/preset-flow',
          ['@babel/preset-typescript', { 'modules': false }],
        ],
        plugins: [
          '@babel/plugin-transform-class-properties',
        ],
      });

      // 返回转译后的代码
      return {
        contents: result.code,
        loader: 'js', // 指定文件类型为 JavaScript
      };
    });
  },
};