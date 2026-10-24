import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

import { scaffold } from '../src/scaffold.mjs';

const APP_DIR = 'tests/.tmp/village';

function run(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, shell: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', reject);
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

async function exists(target) {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

test('the scaffold installs three.js and its geometry matches the declared budget', { timeout: 240000 }, async (t) => {
  await scaffold(APP_DIR, { name: 'lantern-village', delivery: 'web-desktop', force: true });

  const installed = await exists(path.join(APP_DIR, 'node_modules', 'three', 'package.json'));
  if (!installed) {
    const result = await run('npm', ['install', '--omit=dev', '--no-audit', '--no-fund'], APP_DIR);
    if (result.code !== 0) {
      t.skip(`npm install failed (offline?): ${result.stderr.trim().split('\n').slice(-3).join(' ')}`);
      return;
    }
  }

  const requireFromApp = createRequire(path.resolve(APP_DIR, 'package.json'));
  const THREE = requireFromApp('three');

  const knot = new THREE.TorusKnotGeometry(1.1, 0.35, 220, 32);
  const circle = new THREE.CircleGeometry(30, 64);
  const triangles = (geometry) =>
    (geometry.index ? geometry.index.count : geometry.attributes.position.count) / 3;

  const measured = { hero: triangles(knot), ground: triangles(circle) };
  const spec = JSON.parse(await readFile(path.join(APP_DIR, 'scene.json'), 'utf8'));
  const declared = Object.fromEntries(spec.objects.map((object) => [object.id, object.triangles]));

  assert.equal(measured.hero, declared.hero, `hero geometry ${measured.hero} vs declared ${declared.hero}`);
  assert.equal(measured.ground, declared.ground, `ground geometry ${measured.ground} vs declared ${declared.ground}`);
  assert.ok(Number(THREE.REVISION) >= 170, `three revision ${THREE.REVISION}`);
  assert.ok(measured.hero + measured.ground < 150_000);
});
