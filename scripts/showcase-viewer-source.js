import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// The viewer renders original delivery assets; it does not generate new geometry.
export async function mountViewer(host, { asset, kind = 'scene', signal }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = kind === 'scene' ? 1.05 : 1.25;
  renderer.domElement.setAttribute('aria-label', '来自游戏数据样例的三维素材，可拖动或用方向键旋转');
  renderer.domElement.tabIndex = 0;
  host.append(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, .04);
  scene.environment = environment.texture;
  scene.environmentIntensity = .85;
  room.dispose();
  pmrem.dispose();
  const camera = new THREE.PerspectiveCamera(37, 1, 0.01, 4000);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.minPolarAngle = Math.PI * .14;
  controls.maxPolarAngle = Math.PI * .62;
  controls.autoRotate = false;
  renderer.domElement.style.touchAction = 'pan-y';
  scene.add(new THREE.HemisphereLight(0xd8efff, 0x342743, 1.2));
  const key = new THREE.DirectionalLight(0xffe4bf, 2);
  key.position.set(30, 60, 45);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x84c5ff, 1.6);
  rim.position.set(-30, 12, -35);
  scene.add(rim);

  let stopped = false;
  let frame;
  let model;
  let visible = true;
  const resources = new Set();
  const resize = new ResizeObserver(() => {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height || stopped) return;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    if (kind === 'scene') camera.zoom = Math.min(1, Math.max(.55, camera.aspect / 1.45));
    camera.updateProjectionMatrix();
  });
  resize.observe(host);
  const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
  observer.observe(host);
  function rotateFromKey(event) {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    const offset = camera.position.clone().sub(controls.target);
    const spherical = new THREE.Spherical().setFromVector3(offset);
    if (event.key === 'ArrowLeft') spherical.theta -= .12;
    if (event.key === 'ArrowRight') spherical.theta += .12;
    if (event.key === 'ArrowUp') spherical.phi -= .08;
    if (event.key === 'ArrowDown') spherical.phi += .08;
    spherical.phi = THREE.MathUtils.clamp(spherical.phi, controls.minPolarAngle, controls.maxPolarAngle);
    camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));
    controls.update();
  }
  renderer.domElement.addEventListener('keydown', rotateFromKey);
  function disposeModel(object) {
    object.traverse(node => {
      if (node.geometry) resources.add(node.geometry);
      for (const material of [].concat(node.material || [])) {
        resources.add(material);
        for (const value of Object.values(material)) if (value?.isTexture) resources.add(value);
      }
    });
    resources.forEach(resource => resource.dispose());
    resources.clear();
  }
  function dispose() {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(frame);
    resize.disconnect();
    observer.disconnect();
    controls.dispose();
    renderer.domElement.removeEventListener('keydown', rotateFromKey);
    if (model) disposeModel(model);
    environment.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  }
  signal?.addEventListener('abort', dispose, { once: true });
  if (signal?.aborted) { dispose(); return dispose; }
  try {
    const gltf = await new GLTFLoader().loadAsync(asset);
    model = gltf.scene;
    if (stopped) { disposeModel(model); return dispose; }
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    model.position.sub(center);
    scene.add(model);
    const radius = Math.max(size.x, size.y, size.z);
    if (kind === 'scene') {
      // Show the floating island and its original textures, not just the floor.
      camera.position.set(radius * .76, radius * .57, radius * .88);
      controls.target.set(0, radius * .04, 0);
    } else {
      camera.position.set(radius * .95, radius * .18, radius * 1.8);
      controls.target.set(0, 0, 0);
    }
    controls.update();
    host.dataset.ready = 'true';
    function draw() {
      if (stopped) return;
      frame = requestAnimationFrame(draw);
      if (!visible || document.hidden) return;
      controls.update();
      renderer.render(scene, camera);
    }
    draw();
    return dispose;
  } catch (error) {
    dispose();
    throw error;
  }
}

// Tessellated source STEP surfaces. Exploded regions explain geometric structure;
// the source is one continuously bonded machined solid, not an assembly BOM.
export async function mountIndustrial(host, { asset, signal, onPhase = () => {} }) {
  const response = await fetch(asset, { signal });
  if (!response.ok) throw new Error('Cannot load source CAD geometry');
  const source = await response.json();
  if (signal.aborted) return;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  const canvas = renderer.domElement;
  canvas.tabIndex = 0;
  canvas.setAttribute('aria-label', '工业三维工件，拖动或方向键旋转，滚轮缩放');
  host.append(canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, .1, 3000);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 120;
  controls.maxDistance = 650;
  controls.minPolarAngle = .2;
  controls.maxPolarAngle = Math.PI * .84;
  controls.autoRotate = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  controls.autoRotateSpeed = .45;
  canvas.style.touchAction = 'pan-y';
  const environmentMaker = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = environmentMaker.fromScene(room, .04);
  scene.environment = environment.texture;
  scene.environmentIntensity = 1.1;
  room.dispose();
  environmentMaker.dispose();
  scene.add(new THREE.HemisphereLight(0xd4edf8, 0x26313d, 2));
  const key = new THREE.DirectionalLight(0xdff3ff, 3.4);
  key.position.set(80, 160, 140); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffb78d, 2.3);
  rim.position.set(-130, 40, -100); scene.add(rim);
  const root = new THREE.Group(); scene.add(root);
  const regions = source.groups.map(definition => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(definition.positions, 3));
    if (definition.normals.length) geometry.setAttribute('normal', new THREE.Float32BufferAttribute(definition.normals, 3));
    else geometry.computeVertexNormals();
    const material = new THREE.MeshStandardMaterial({ color: definition.color, metalness: .6, roughness: .34, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = definition.name;
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 18), new THREE.LineBasicMaterial({color: '#d9eff0', transparent: true, opacity: .21}));
    mesh.add(edges); root.add(mesh);
    return {mesh, offset: new THREE.Vector3(...definition.offset)};
  });
  const grid = new THREE.GridHelper(280, 20, 0x385663, 0x1d333f);
  grid.position.y = -80;
  grid.material.transparent = true; grid.material.opacity = .34;
  scene.add(grid);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let mode = reduced ? 'assembled' : 'cycle';
  let paused = reduced;
  let stopped = false;
  let visible = true;
  let time = 0;
  let last = performance.now();
  let frame;
  let lastPhase;
  let factors = regions.map(() => 0);
  function resetView() {
    camera.position.set(177, 133, 201);
    controls.target.set(0, 0, 0);
    controls.update();
  }
  resetView();
  controls.addEventListener('start', () => { controls.autoRotate = false; });
  const resize = new ResizeObserver(() => {
    if (stopped) return;
    const {width, height} = host.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  });
  resize.observe(host);
  const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
  intersection.observe(host);
  const ease = value => { const t = THREE.MathUtils.clamp(value, 0, 1); return t*t*(3-2*t); };
  function setMode(next) {
    mode = next;
    paused = next !== 'cycle';
    controls.autoRotate = next === 'cycle' && !reduced;
    if (next === 'cycle') { time = 0; controls.autoRotate = !reduced; }
    if (next === 'exploded') factors.fill(1);
    if (next === 'assembled') factors.fill(0);
    host.dataset.mode = mode;
  }
  function setPaused(next) { paused = next; controls.autoRotate = !next && !reduced; }
  function keyRotate(event) {
    if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) return;
    event.preventDefault(); controls.autoRotate = false;
    const spherical = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
    spherical.theta += event.key === 'ArrowLeft' ? -.14 : event.key === 'ArrowRight' ? .14 : 0;
    spherical.phi = THREE.MathUtils.clamp(spherical.phi+(event.key === 'ArrowUp' ? -.1 : event.key === 'ArrowDown' ? .1 : 0), .2, Math.PI*.84);
    camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));
    controls.update();
  }
  canvas.addEventListener('keydown', keyRotate);
  function dispose() {
    if (stopped) return;
    stopped = true; cancelAnimationFrame(frame);
    resize.disconnect(); intersection.disconnect(); controls.dispose();
    canvas.removeEventListener('keydown', keyRotate);
    const resources = new Set();
    scene.traverse(node => {
      if (node.geometry) resources.add(node.geometry);
      for (const material of [].concat(node.material || [])) resources.add(material);
    });
    resources.forEach(resource=>resource.dispose());
    environment.dispose(); renderer.dispose(); canvas.remove();
  }
  signal.addEventListener('abort', dispose, {once:true});
  if (signal.aborted) { dispose(); return; }
  host.dataset.ready = 'true'; host.dataset.mode = mode;
  function draw(now) {
    if (stopped) return;
    frame = requestAnimationFrame(draw);
    const dt = Math.min((now-last)/1000, .05); last = now;
    if (!visible || document.hidden) return;
    if (!paused && mode === 'cycle') time = (time+dt)%12;
    let phase = mode;
    if (mode === 'cycle') {
      if (time < 1.8) { factors.fill(0); phase = 'assembled'; }
      else if (time < 4.1) { factors = regions.map((_,i)=>ease((time-1.8-i*.09)/1.4)); phase = 'exploding'; }
      else if (time < 5.6) { factors.fill(1); phase = 'exploded'; }
      else if (time < 9.8) { factors = regions.map((_,i)=>1-ease((time-5.6-i*.5)/1.2)); phase = 'assembling'; }
      else { factors.fill(0); phase = 'assembled'; }
    }
    regions.forEach((region, i)=>region.mesh.position.copy(region.offset).multiplyScalar(factors[i]));
    const amount = Math.max(...factors);
    camera.zoom = (1.2-amount*.46) * Math.min(1, Math.max(.65, camera.aspect/1.15));
    camera.updateProjectionMatrix();
    if (phase !== lastPhase) { host.dataset.phase = phase; onPhase(phase); lastPhase = phase; }
    host.dataset.explosion = amount.toFixed(2);
    controls.update(); renderer.render(scene, camera);
  }
  frame = requestAnimationFrame(draw);
  return {setMode, setPaused, resetView, dispose};
}
