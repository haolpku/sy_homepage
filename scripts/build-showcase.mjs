import { build } from 'esbuild';
import { copyFileSync } from 'node:fs';

await build({
  entryPoints: ['scripts/showcase-viewer-source.js'],
  outfile: 'dist/showcase-viewer.js',
  bundle: true,
  minify: true,
  format: 'esm',
  target: ['es2020'],
  legalComments: 'eof',
});
copyFileSync('node_modules/three/LICENSE', 'dist/assets/products/THREE-LICENSE.txt');
await import('./stamp-showcase-assets.mjs');
console.log('Built the local 3D viewer. No CDN or runtime dependencies required.');
