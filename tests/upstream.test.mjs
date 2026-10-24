import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';

import { fetchUpstream } from '../scripts/fetch-upstream.mjs';

test('vendored upstream data is present and attributable', { timeout: 180000 }, async () => {
  const report = await fetchUpstream({ sections: ['data', 'references'] });

  assert.deepEqual(
    report.failures ?? [],
    [],
    `some upstream files failed: ${JSON.stringify(report.failures?.slice(0, 3))}`,
  );
  assert.ok(report.files > 0, 'no upstream file was fetched');
  assert.match(report.commit, /^[0-9a-f]{40}$/);
  assert.match(report.license, /MIT/);

  const manifest = JSON.parse(await readFile('upstream/data/manifest.json', 'utf8'));
  assert.ok(manifest && typeof manifest === 'object', 'manifest.json is not an object');
});

test('every reference named by the skill is vendored', { timeout: 60000 }, async () => {
  const skill = await readFile('skill/SKILL.md', 'utf8');
  const referenced = skill.match(/upstream\/references\/[a-z-]+\.md/g) ?? [];
  for (const file of referenced) await stat(file);
});
