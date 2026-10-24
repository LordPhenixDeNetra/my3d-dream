import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';

import { scaffold } from '../src/scaffold.mjs';
import { checkBudget } from '../src/budget.mjs';

const TARGET = 'tests/.tmp/village';

test('scaffold writes a runnable project', { timeout: 60000 }, async () => {
  await mkdir('tests/.tmp', { recursive: true });
  const result = await scaffold(TARGET, { name: 'lantern-village', delivery: 'web-desktop', force: true });

  const written = result.files.map((file) => file.split(/[\\/]/).slice(-2).join('/'));
  assert.ok(written.some((file) => file.endsWith('package.json')), written.join(', '));
  assert.ok(written.some((file) => file.endsWith('src/main.js')), written.join(', '));
  assert.ok(written.some((file) => file.endsWith('scene.json')), written.join(', '));

  const pkg = JSON.parse(await readFile(`${TARGET}/package.json`, 'utf8'));
  assert.equal(pkg.name, 'lantern-village');
  assert.ok(pkg.dependencies.three);
  assert.equal(pkg.scripts.dev, 'vite');

  const main = await readFile(`${TARGET}/src/main.js`, 'utf8');
  assert.match(main, /__3DVIZ__/);
  assert.match(main, /ACESFilmicToneMapping/);
  assert.match(main, /SRGBColorSpace/);

  const html = await readFile(`${TARGET}/index.html`, 'utf8');
  assert.match(html, /lantern-village/);

  const spec = JSON.parse(await readFile(`${TARGET}/scene.json`, 'utf8'));
  assert.equal(spec.name, 'lantern-village');
  const budget = checkBudget(spec, spec.delivery);
  assert.equal(budget.ok, true, JSON.stringify(budget.violations));
});

test('scaffold refuses to overwrite without force', async () => {
  const result = await scaffold(TARGET, { name: 'lantern-village', delivery: 'web-desktop' });
  assert.equal(result.files.length, 0);
  assert.ok(result.skipped.length >= 3, `skipped ${result.skipped.length}`);
});

test('scaffold honours the delivery target', async () => {
  const result = await scaffold('tests/.tmp/mobile', {
    name: 'mobile-study',
    delivery: 'web-mobile',
    force: true,
  });
  assert.ok(result.files.length > 0);
  const spec = JSON.parse(await readFile('tests/.tmp/mobile/scene.json', 'utf8'));
  assert.equal(spec.delivery, 'web-mobile');
  assert.equal(checkBudget(spec, 'web-mobile').ok, true);
});
