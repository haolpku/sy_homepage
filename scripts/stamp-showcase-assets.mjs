import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const fingerprint = path => createHash('sha256').update(readFileSync(path)).digest('hex').slice(0, 12);
const viewerVersion = fingerprint('dist/showcase-viewer.js');
for (const file of ['products.js', 'product-records.js']) {
  const path = `dist/${file}`;
  const source = readFileSync(path, 'utf8');
  writeFileSync(path, source.replace(/import\('\.\/showcase-viewer\.js(?:\?v=[^']*)?'\)/g, `import('./showcase-viewer.js?v=${viewerVersion}')`));
}

// Updating HTML must also update the URLs of its dependent scripts and styles.
const path = 'dist/index.html';
const html = readFileSync(path, 'utf8');
writeFileSync(path, html.replace(/(src|href)="([^"?#]+\.(?:js|css))(?:\?v=[^"#]*)?"/g, (match, attribute, asset) => {
  if (/^(?:https?:)?\/\//.test(asset)) return match;
  return `${attribute}="${asset}?v=${fingerprint(`dist/${asset}`)}"`;
}));
console.log('Stamped showcase scripts and styles with content versions.');
