import { babelPlugin } from '../../dev/babel-plugin/main.mjs';
import esbuild from 'esbuild';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf-8'));

console.log('Build directory:', __dirname);
console.log('Output directory:', join(__dirname, 'dist'));

const external = Object.keys({
  ...pkg.peerDependencies,
  ...pkg.dependencies,
  ...pkg.optionalDependencies,
});
const settings = {
  entryPoints: [join(__dirname, 'src/index.ts')],
  bundle: true,
  sourcemap: true,
  loader: {
    '.svg': 'dataurl',
  },
  plugins: [
    babelPlugin,
  ],
  external,
};

const outDir = join(__dirname, 'dist');

esbuild.build({
  ...settings,
  outfile: join(outDir, 'extend-wheel.js'),
  platform: 'browser',
  format: 'cjs',
}).then(console.log).catch(console.log);

esbuild.build({
  ...settings,
  outfile: join(outDir, 'extend-wheel.esm.js'),
  platform: 'browser',
  format: 'esm',
}).then(console.log).catch(console.log);
