import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const context = {window:{}};
for (const file of ['content.js','datasets-copy.js','datasets-data.js','products-data.js','product-excerpts.js','product-examples.js','product-chartvqa-data.js']) runInNewContext(readFileSync(`dist/${file}`,'utf8'),context);
const content=context.window.siteContent, library=context.window.datasetLibrary;
const htmlFiles=['index.html','datasets.html'];
const ids=new Set(library.items.map(x=>x.id));
assert.equal(ids.size,library.items.length,'Duplicate sample IDs');
for (const file of htmlFiles) {
 const html=readFileSync(`dist/${file}`,'utf8');
 for(const locale of ['zh','en']) for(const match of html.matchAll(/data-i18n(?:-html|-aria|-alt)?="([^"]+)"/g)) assert.equal(typeof content[locale][match[1]],'string',`${locale}: missing ${match[1]}`);
 for(const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
  const target=match[1];if(target.startsWith('http'))continue;
  const [urlPath,anchor]=target.split('#');const path=urlPath.split('?')[0];const dest=path||file;
  assert.ok(existsSync(`dist/${dest}`),`Missing asset: ${target}`);
  if(anchor) {
   const staticAnchor=readFileSync(`dist/${dest}`,'utf8').includes(`id="${anchor}"`);
   assert.ok(staticAnchor || (dest==='datasets.html'&&ids.has(anchor)),`Missing anchor: ${target}`);
  }
 }
}
for(const match of readFileSync('dist/datasets.js','utf8').matchAll(/\bt\('([^']+)'\)/g)) for(const locale of ['zh','en']) assert.equal(typeof content[locale][match[1]],'string',`${locale}: missing dynamic label ${match[1]}`);
for(const file of ['app.js','content.js','datasets.js','datasets-data.js','datasets-copy.js','products.js','products-data.js','product-excerpts.js','product-examples.js','product-records.js','product-chartvqa-data.js','product-chartvqa.js','showcase-viewer.js']) assert.equal(spawnSync(process.execPath,['--check',`dist/${file}`]).status,0,`Invalid JS: ${file}`);
const provenance=JSON.parse(readFileSync('dist/datasets-provenance.json','utf8'));
assert.equal(provenance.selection.length,library.items.length);
for(const asset of provenance.assets) assert.equal(createHash('sha256').update(readFileSync(`dist/${asset.path}`)).digest('hex'),asset.sha256,`Changed source image: ${asset.path}`);
for(const item of library.items) {
 assert.ok(library.categories[item.category]);
 assert.equal(typeof item.title.zh,'string');assert.equal(typeof item.title.en,'string');
 if(item.category==='single') for(const key of ['before','after']) assert.ok(existsSync(`dist/${item.record[key]}`));
 if(item.category==='multi') {
  assert.equal(item.record.rounds.length,item.record.num_rounds);
  assert.ok(existsSync(`dist/${item.record.reference}`));
  item.record.rounds.forEach((r,i)=>{assert.equal(r.idx,i+1);assert.ok(existsSync(`dist/${r.image}`));for(const ref of r.source_ref.split('+')) if(ref.startsWith('round_')) assert.ok(Number(ref.slice(6))<=i,`Future image reference in ${item.id}`);});
 }
}
const products = context.window.dataProducts;
assert.equal(products.length, 9, 'The homepage must present all nine delivery lines');
assert.equal(new Set(products.map(p => p.id)).size, 9, 'Duplicate data product IDs');
const home = readFileSync('dist/index.html','utf8');
for (const match of home.matchAll(/(?:src|href)="([^"?#]+\.(?:js|css))\?v=([a-f0-9]+)"/g)) {
 assert.equal(createHash('sha256').update(readFileSync(`dist/${match[1]}`)).digest('hex').slice(0,12), match[2], `Outdated asset URL: ${match[1]}`);
}
for (const file of ['products.js','products-data.js','product-records.js','product-records.css','product-examples.js','product-chartvqa.js','product-chartvqa-data.js','product-chartvqa.css']) assert.ok(home.includes(`${file}?v=`), `Unversioned showcase dependency: ${file}`);
for (const product of products) {
 assert.ok(home.includes(`id="product-tab-${product.id}"`), `Missing product control: ${product.id}`);
 for (const field of ['name','label','title','description','count','example','use','caption','type']) assert.equal(typeof product[field], 'string');
 assert.ok(product.contents.length && product.formats.length, `Missing delivery information: ${product.id}`);
}
const productProvenance = JSON.parse(readFileSync('dist/products-provenance.json','utf8'));
for (const asset of productProvenance.assets) assert.equal(createHash('sha256').update(readFileSync(`dist/${asset.path}`)).digest('hex'), asset.sha256, `Changed product source asset: ${asset.path}`);
for (const asset of [productProvenance.example_asset, productProvenance.industrial_model, productProvenance.chartvqa_example]) {
 assert.equal(createHash('sha256').update(readFileSync(`dist/${asset.path}`)).digest('hex'), asset.sha256, `Changed extracted example: ${asset.path}`);
}
assert.match(home, /href="#contact"[^>]*aria-label="More/);
const examples = context.window.productExamples;
assert.equal(examples.research.length, 5);
assert.equal(examples.legal.record.task_id, 'pr13-menu-replan');
assert.ok(examples.legal.evidence.paragraphs.length);
assert.equal(examples.rsi.find(row=>row.iteration===7).feedback.reward, .6);
const cad = JSON.parse(readFileSync('dist/assets/products/industrial-model.json','utf8'));
assert.equal(cad.groups.length, 6);
assert.equal(cad.groups.reduce((sum,group)=>sum+group.positions.length/9,0), cad.triangles);
for (const group of cad.groups) {
 assert.ok(group.positions.length > 0 && group.positions.length % 9 === 0);
 assert.equal(group.normals.length, group.positions.length);
 assert.ok([...group.positions, ...group.normals, ...group.offset].every(Number.isFinite));
}
const excerpts = context.window.productExcerpts;
assert.equal(excerpts.rsi.length, 10);
assert.equal(Math.max(...excerpts.rsi.map(x=>x.reward)), .6);
assert.ok(excerpts.lean.includes('theorem reverse_chernoff_binomial'));
assert.ok(excerpts.industrial_vertices.length > 0 && excerpts.industrial_edges.length > 0);
assert.ok(existsSync('dist/assets/products/THREE-LICENSE.txt'));
const chart = context.window.chartVqaExample;
assert.equal(chart.readings.length, 7);
const chartOrder = [...chart.readings].sort((a,b)=>(a[1]-a[3]/a[2])-(b[1]-b[3]/b[2])).map(r=>r[0]);
assert.equal(JSON.stringify(chartOrder), JSON.stringify(JSON.parse(chart.oracle)), 'ChartVQA displayed calculation must match source Oracle');
await import('./check-research-replay.mjs');
console.log(`Passed: bilingual copy, local links, JavaScript, ${library.items.length} public samples, ${provenance.assets.length} existing images, ${products.length} product lines, and ${productProvenance.assets.length} unchanged delivery assets.`);
