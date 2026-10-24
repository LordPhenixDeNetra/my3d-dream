import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const SCENE_JS = 'templates/scaffold/src/scene.js';
const SCENE_JSON = 'templates/scaffold/scene.json.tmpl';

function triangleCounts(source) {
  const knot = source.match(/new THREE\.TorusKnotGeometry\(([\d.]+),\s*([\d.]+),\s*(\d+),\s*(\d+)\)/);
  const circle = source.match(/new THREE\.CircleGeometry\(([\d.]+),\s*(\d+)\)/);
  assert.ok(knot, 'TorusKnotGeometry call not found');
  assert.ok(circle, 'CircleGeometry call not found');

  return {
    // three.js builds two triangles per tubular x radial quad; a circle fan is one per segment.
    hero: Number(knot[3]) * Number(knot[4]) * 2,
    ground: Number(circle[2]),
  };
}

test('the declared budget matches the analytic cost of the scaffold geometry', async () => {
  const source = await readFile(SCENE_JS, 'utf8');
  const counts = triangleCounts(source);

  const spec = JSON.parse(await readFile(SCENE_JSON, 'utf8'));
  const byId = Object.fromEntries(spec.objects.map((object) => [object.id, object]));

  assert.equal(byId.hero.triangles, counts.hero, `hero: declared ${byId.hero.triangles}, geometry ${counts.hero}`);
  assert.equal(byId.ground.triangles, counts.ground, `ground: declared ${byId.ground.triangles}, geometry ${counts.ground}`);
  assert.equal(byId.hero.drawCalls, 1);
  assert.equal(byId.ground.drawCalls, 1);
});

test('the scaffold default stays inside the desktop and mobile budgets', async () => {
  const spec = JSON.parse(await readFile(SCENE_JSON, 'utf8'));
  const total = spec.objects.reduce((sum, object) => sum + object.triangles, 0);
  assert.ok(total < 150_000, `scaffold total ${total} triangles`);
  assert.ok(spec.objects.length <= 60, `${spec.objects.length} draw calls`);
});
