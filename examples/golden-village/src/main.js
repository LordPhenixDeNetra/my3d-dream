import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * Demonstration scene for the knowledge records:
 * - kb.lighting.golden-hour-village  (sun 8 degrees, 3200 K, cool sky fill)
 * - kb.material.stone-and-timber     (roughness and colour separate the two)
 * - kb.motion.patrol-loop            (position derived from elapsed time)
 * - kb.budget.desktop-village        (draw calls counted, not estimated)
 */

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
scene.background = new THREE.Color(0x1d1913);
scene.fog = new THREE.Fog(0x2a2118, 45, 130);

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 500);
camera.position.set(16, 7, 20);

const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 1.2, 0);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI * 0.49;

// --- ground -----------------------------------------------------------------
const ground = new THREE.Mesh(
  new THREE.CircleGeometry(40, 96),
  new THREE.MeshStandardMaterial({ color: 0x4a4636, roughness: 0.95 }),
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// --- cottages: one merged mesh for walls, one for roofs ----------------------
const COTTAGES = 5;
const RADIUS = 9;
const wallParts = [];
const roofParts = [];

for (let i = 0; i < COTTAGES; i += 1) {
  const angle = (i / COTTAGES) * Math.PI * 2;
  const x = Math.cos(angle) * RADIUS;
  const z = Math.sin(angle) * RADIUS;

  wallParts.push(
    new THREE.BoxGeometry(2.4, 1.9, 1.8).rotateY(-angle).translate(x, 0.95, z),
  );
  roofParts.push(
    new THREE.ConeGeometry(2.0, 1.3, 4)
      .rotateY(Math.PI / 4 - angle)
      .translate(x, 2.55, z),
  );
}

const walls = new THREE.Mesh(
  mergeGeometries(wallParts, false),
  new THREE.MeshStandardMaterial({ color: 0x8a8577, roughness: 0.92 }),
);
walls.castShadow = true;
walls.receiveShadow = true;
scene.add(walls);

const roofs = new THREE.Mesh(
  mergeGeometries(roofParts, false),
  new THREE.MeshStandardMaterial({ color: 0x6b4a32, roughness: 0.78 }),
);
roofs.castShadow = true;
scene.add(roofs);

// --- one wandering creature --------------------------------------------------
const agent = new THREE.Mesh(
  new THREE.CapsuleGeometry(0.22, 0.6, 6, 12),
  new THREE.MeshStandardMaterial({ color: 0xd8a657, roughness: 0.5 }),
);
agent.castShadow = true;
scene.add(agent);

const PATH_RADIUS = 5.2;
const SPEED = 0.35; // radians per second

function placeAgent(elapsed) {
  const angle = elapsed * SPEED;
  const x = Math.cos(angle) * PATH_RADIUS;
  const z = Math.sin(angle) * PATH_RADIUS;
  const nextAngle = angle + 0.05;
  agent.position.set(x, 0.55 + Math.sin(elapsed * 6) * 0.03, z);
  agent.lookAt(Math.cos(nextAngle) * PATH_RADIUS, 0.55, Math.sin(nextAngle) * PATH_RADIUS);
}

// --- golden hour rig ---------------------------------------------------------
const elevation = THREE.MathUtils.degToRad(8);
const azimuth = THREE.MathUtils.degToRad(40);
const sunDistance = 60;

const sun = new THREE.DirectionalLight(0xffc98a, 2.5);
sun.position.set(
  Math.cos(elevation) * Math.sin(azimuth) * sunDistance,
  Math.sin(elevation) * sunDistance,
  Math.cos(elevation) * Math.cos(azimuth) * sunDistance,
);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -35;
sun.shadow.camera.right = 35;
sun.shadow.camera.top = 35;
sun.shadow.camera.bottom = -35;
sun.shadow.bias = -0.0005;
scene.add(sun);

const sky = new THREE.HemisphereLight(0x9fc4ff, 0x2a2118, 0.35);
scene.add(sky);

// --- loop --------------------------------------------------------------------
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
let elapsedHud = 0;

renderer.setAnimationLoop(() => {
  const delta = clock.getDelta();
  const elapsed = clock.getElapsedTime();

  controls.update();
  placeAgent(elapsed);
  renderer.render(scene, camera);

  frames += 1;
  elapsedHud += delta;
  if (elapsedHud >= 0.5) {
    hud.textContent = `${Math.round(frames / elapsedHud)} fps · ${renderer.info.render.calls} calls · ${renderer.info.render.triangles} tris`;
    frames = 0;
    elapsedHud = 0;
  }
});

window.__3DVIZ__ = {
  scene,
  camera,
  renderer,
  placeAgent,
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
