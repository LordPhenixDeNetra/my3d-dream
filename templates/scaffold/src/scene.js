import * as THREE from 'three';

/**
 * Scene contents. Replace the placeholder with the subject you are modelling.
 * Keep one authoritative state object per interactive subject and derive geometry from it.
 */
export function buildScene(scene, camera) {
  scene.background = new THREE.Color(0x0b0d10);
  scene.fog = new THREE.Fog(0x0b0d10, 30, 90);

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(30, 64),
    new THREE.MeshStandardMaterial({ color: 0x2a2f38, roughness: 0.95 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const hero = new THREE.Mesh(
    new THREE.TorusKnotGeometry(1.1, 0.35, 220, 32),
    new THREE.MeshStandardMaterial({ color: 0xd8a657, roughness: 0.35, metalness: 0.1 }),
  );
  hero.position.y = 1.6;
  hero.castShadow = true;
  scene.add(hero);

  const key = new THREE.DirectionalLight(0xfff1dd, 2.4);
  key.position.set(6, 9, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0x88aaff, 0.8);
  rim.position.set(-5, 3, -6);
  scene.add(rim);

  scene.add(new THREE.HemisphereLight(0x334466, 0x111111, 0.6));

  camera.lookAt(0, 1.6, 0);
  return {
    hero,
    state: { spin: 0 },
  };
}
