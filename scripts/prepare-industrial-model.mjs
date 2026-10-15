import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import occtimportjs from 'occt-import-js';

const file = process.argv[2];
if (!file) throw new Error('Usage: node scripts/prepare-industrial-model.mjs <original export_17.step>');
const bytes = readFileSync(file);
const occt = await occtimportjs();
const result = occt.ReadStepFile(bytes, {
  linearUnit: 'millimeter', linearDeflectionType: 'absolute_value',
  linearDeflection: .18, angularDeflection: .35,
});
if (!result.success || !result.meshes.length) throw new Error('Cannot tessellate original STEP');
const definitions = [
  ['base', '底座', '#718c9a', [0, -34, 0]],
  ['wall', '背板', '#9bb4be', [-36, 8, 0]],
  ['gusset-left', '加强筋 A', '#608994', [0, 15, -40]],
  ['gusset-right', '加强筋 B', '#81a5ac', [0, 15, 40]],
  ['platform', '承载平台', '#b8cccf', [22, 38, 0]],
  ['interface', '服务接口', '#df9d78', [43, 65, 0]],
];
const groups = definitions.map(([id, name, color, offset]) => ({id, name, color, offset, positions: [], normals: [], face_count: 0}));
let triangleCount = 0;
for (const mesh of result.meshes) {
  const positions = mesh.attributes.position.array;
  const normals = mesh.attributes.normal?.array;
  const indices = mesh.index.array;
  for (const face of mesh.brep_faces) {
    const vertices = indices.slice(face.first * 3, (face.last + 1) * 3);
    const center = [0, 0, 0];
    for (const vertex of vertices) for (let axis=0; axis<3; axis++) center[axis] += positions[vertex*3+axis] / vertices.length;
    const [x, y, z] = center;
    let index;
    if (z > 60.1 && x > 20) index = 5;
    else if (z <= 8.1) index = 0;
    else if (x < 12 || y < 1 || y > 63) index = 1;
    else if (z >= 49.4) index = 4;
    else index = y < 32 ? 2 : 3;
    const group = groups[index];
    group.face_count++;
    for (const vertex of vertices) {
      const p = positions.slice(vertex*3, vertex*3+3);
      // Original STEP is Z-up. Display it Y-up, centered; do not change its shape.
      group.positions.push(...[p[0]-50, p[2]-39, 32-p[1]].map(v=>Number(v.toFixed(5))));
      if (normals) {
        const n = normals.slice(vertex*3, vertex*3+3);
        group.normals.push(...[n[0],n[2],-n[1]].map(v=>Number(v.toFixed(5))));
      }
    }
    triangleCount += vertices.length / 3;
  }
}
const nonempty = groups.filter(g=>g.positions.length);
if (nonempty.length !== 6) throw new Error('Expected six non-empty geometry display regions');
const model = {
  source: 'export_17.step', source_sha256: createHash('sha256').update(bytes).digest('hex'),
  units: 'mm', triangles: triangleCount,
  representation: 'Original single machined solid, tessellated and partitioned by source BREP face geometry for an exploded-view illustration. Display regions are not separately manufactured source components.',
  groups: nonempty,
};
const output = 'dist/assets/products/industrial-model.json';
writeFileSync(output, JSON.stringify(model));
const provenancePath = 'dist/products-provenance.json';
const provenance = JSON.parse(readFileSync(provenancePath, 'utf8'));
provenance.industrial_model = {
  path: 'assets/products/industrial-model.json',
  source_path: '工业/harbor-industrial-software-20261013-r2/tasks/industrial/interface_release_r5/environment/workspace/incoming/export_17.step',
  source_sha256: model.source_sha256,
  sha256: createHash('sha256').update(readFileSync(output)).digest('hex'),
  transformation: model.representation,
  converter: 'occt-import-js 0.0.23; local build only, no WASM shipped to browser',
};
writeFileSync(provenancePath, JSON.stringify(provenance, null, 2)+'\n');
console.log(`Prepared ${triangleCount} source triangles in ${nonempty.length} display regions.`);
