import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { buildScene } from './scene.js';

const canvas = document.querySelector('#view');
const hud = document.querySelector('#hud');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 2000);
camera.position.set(9, 6, 12);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.target.set(0, 1, 0);

buildScene(scene, camera);

function resize() {
  const { clientWidth, clientHeight } = canvas;
  if (clientWidth === 0 || clientHeight === 0) return;
  camera.aspect = clientWidth / clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(clientWidth, clientHeight, false);
}
window.addEventListener('resize', resize);
resize();

const clock = new THREE.Clock();
let frames = 0;
let elapsed = 0;

renderer.setAnimationLoop(() => {
  const delta = clock.getDelta();
  controls.update();
  renderer.render(scene, camera);

  frames += 1;
  elapsed += delta;
  if (elapsed >= 0.5) {
    hud.textContent = `${Math.round(frames / elapsed)} fps · ${renderer.info.render.calls} calls · ${renderer.info.render.triangles} tris`;
    frames = 0;
    elapsed = 0;
  }
});

// Runtime evidence for the budget gate: measured, not declared.
window.__3DVIZ__ = {
  scene,
  camera,
  renderer,
  measure() {
    let lights = 0;
    scene.traverse((node) => {
      if (node.isLight) lights += 1;
    });
    return {
      drawCalls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
      textures: renderer.info.memory.textures,
      lights,
      frameIndex: renderer.info.render.frame,
    };
  },
};
