import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';

test('the package declares a resolvable DSH bundle', async () => {
  const pkg = JSON.parse(await readFile('package.json', 'utf8'));

  assert.equal(pkg.name, 'my3d-dream');
  assert.equal(pkg.type, 'module');
  assert.equal(pkg.dsh.bundle.patch, './cordis.patch.yml');
  assert.equal(pkg.main, 'src/plugin.mjs');
  await stat(pkg.dsh.bundle.patch);
  await stat(pkg.main);
});

test('the bundle layer inserts the plugin row', async () => {
  const patch = await readFile('cordis.patch.yml', 'utf8');
  assert.match(patch, /^-\s*insert:/m);
  assert.match(patch, /name:\s*my3d-dream/);
  assert.match(patch, /id:\s*my3d/);
});

test('every export points at an existing file', async () => {
  const pkg = JSON.parse(await readFile('package.json', 'utf8'));
  for (const [subpath, target] of Object.entries(pkg.exports)) {
    const file = typeof target === 'string' ? target : target.default;
    await stat(file);
    assert.ok(file, `${subpath} has no target`);
  }
  for (const file of pkg.files) await stat(file);
});
