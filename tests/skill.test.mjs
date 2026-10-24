import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';

const SKILL_PATH = 'skill/SKILL.md';
const UPSTREAM_SKILL_BYTES = 11025; // skill/SKILL.md at upstream commit d077e0e6

test('the skill stays small enough to load in full', async () => {
  const info = await stat(SKILL_PATH);
  assert.ok(info.size < 6000, `SKILL.md is ${info.size} bytes; budget is 6000`);
});

test('the skill declares a name and a description', async () => {
  const text = await readFile(SKILL_PATH, 'utf8');
  assert.match(text, /^---\n/);
  assert.match(text, /\nname: my3d-dream\n/);
  assert.match(text, /\ndescription: .{40,}/);
});

test('the skill documents only commands that exist', async () => {
  const text = await readFile(SKILL_PATH, 'utf8');
  assert.match(text, /bin\/my3d\.mjs search/);
  assert.match(text, /bin\/my3d\.mjs resolve/);
  assert.match(text, /bin\/my3d\.mjs budget/);
  await stat('bin/my3d.mjs');
});

test('the skill is materially smaller than the upstream one', async () => {
  const info = await stat(SKILL_PATH);
  const reduction = 1 - info.size / UPSTREAM_SKILL_BYTES;
  await mkdir('docs', { recursive: true });
  await writeFile(
    'docs/metrics.json',
    JSON.stringify(
      {
        skillBytes: info.size,
        upstreamSkillBytes: UPSTREAM_SKILL_BYTES,
        reduction: Math.round(reduction * 1000) / 1000,
        measuredAt: new Date().toISOString(),
      },
      null,
      2,
    ) + '\n',
    'utf8',
  );
  assert.ok(reduction >= 0.3, `expected >=30% fewer bytes, got ${(reduction * 100).toFixed(1)}%`);
});

test('the skill points at the authored corpus', async () => {
  const text = await readFile(SKILL_PATH, 'utf8');
  assert.match(text, /knowledge\//);
  assert.doesNotMatch(text, /upstream\//);
});
