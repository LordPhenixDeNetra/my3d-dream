import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { readFile, stat } from 'node:fs/promises';
import { promisify } from 'node:util';

import { checkBudget } from '../src/budget.mjs';

const run = promisify(execFile);
const DIR = 'examples/golden-village';

test('the example parses as valid JavaScript', { timeout: 30000 }, async () => {
  const { stderr } = await run(process.execPath, ['--check', `${DIR}/src/main.js`]);
  assert.equal(stderr.trim(), '', stderr);
});

test('the example declares a budget inside the desktop target', async () => {
  const spec = JSON.parse(await readFile(`${DIR}/scene.json`, 'utf8'));
  const result = checkBudget(spec, spec.delivery);
  assert.equal(result.ok, true, JSON.stringify(result.violations));
  assert.ok(result.totals.drawCalls <= 10, `draw calls ${result.totals.drawCalls}`);
  assert.ok(result.totals.triangles <= 5000, `triangles ${result.totals.triangles}`);
});

test('the example documents which records it applies', async () => {
  const text = await readFile(`${DIR}/README.md`, 'utf8');
  for (const id of [
    'kb.lighting.golden-hour-village',
    'kb.material.stone-and-timber',
    'kb.motion.patrol-loop',
    'kb.budget.desktop-village',
  ]) {
    assert.ok(text.includes(id), `README does not mention ${id}`);
  }
  await stat(`${DIR}/package.json`);
  await stat(`${DIR}/index.html`);
});
