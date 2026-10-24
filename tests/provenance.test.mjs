import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const SKIP_DIRS = new Set(['node_modules', '.git', 'index', 'captures', 'upstream']);

async function walk(root) {
  const files = [];
  const visit = async (dir) => {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      const relative = path.relative(root, full).split(path.sep).join('/');
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue;
        if (relative === 'tests/.tmp') continue;
        await visit(full);
      } else if (entry.isFile()) {
        files.push(full);
      }
    }
  };
  await visit(root);
  return files;
}

const digest = (buffer) => createHash('sha256').update(buffer).digest('hex');

test('no file outside upstream/ is a byte-for-byte copy of a vendored upstream file', async () => {
  const vendored = new Map();
  for (const file of await walk('upstream')) {
    vendored.set(digest(await readFile(file)), path.relative('.', file));
  }
  assert.ok(vendored.size >= 600, `only ${vendored.size} vendored files`);

  const collisions = [];
  for (const file of await walk('.')) {
    const hash = digest(await readFile(file));
    if (vendored.has(hash)) collisions.push(`${path.relative('.', file)} == ${vendored.get(hash)}`);
  }

  assert.deepEqual(collisions, [], `verbatim copies outside upstream/: ${collisions.join(' | ')}`);
});

test('the authored skill is not the upstream skill', async () => {
  const ours = await readFile('skill/SKILL.md');
  const hash = digest(ours);
  for (const file of await walk('upstream')) {
    if (!file.endsWith('SKILL.md')) continue;
    assert.notEqual(digest(await readFile(file)), hash, `skill/SKILL.md matches ${file}`);
  }
});
