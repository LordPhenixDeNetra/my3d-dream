import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

import { buildIndex } from '../scripts/build-index.mjs';
import { loadIndex, rank } from '../src/store.mjs';

test('a precomputed index beats rebuilding it per call', { timeout: 60000 }, async () => {
  const coldStart = performance.now();
  const stats = await buildIndex();
  const coldMs = performance.now() - coldStart;

  const warmStart = performance.now();
  const index = await loadIndex();
  const loadMs = performance.now() - warmStart;

  const queries = ['golden hour', 'stone timber', 'patrol loop', 'draw calls'];
  for (let i = 0; i < 200; i += 1) rank(index, queries[i % queries.length]);
  const queryStart = performance.now();
  for (let i = 0; i < 200; i += 1) rank(index, queries[i % queries.length]);
  const perQueryMs = (performance.now() - queryStart) / 200;

  const report = {
    documents: stats.documents,
    coldBuildMs: Math.round(coldMs * 10) / 10,
    warmLoadMs: Math.round(loadMs * 10) / 10,
    perQueryMs: Math.round(perQueryMs * 1000) / 1000,
    speedup: Math.round((coldMs / loadMs) * 10) / 10,
    measuredAt: new Date().toISOString(),
  };
  await mkdir('docs', { recursive: true });
  await writeFile('docs/baseline.json', `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  assert.ok(loadMs > 0 && coldMs > loadMs, `cold ${coldMs} ms vs warm ${loadMs} ms`);
  assert.ok(perQueryMs < 1, `per query ${perQueryMs} ms`);
});
