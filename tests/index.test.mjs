import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';

import { buildIndex } from '../scripts/build-index.mjs';
import { loadIndex, rank } from '../src/store.mjs';

const QUERIES = [
  'golden hour village',
  'night practicals lantern',
  'stone and timber material',
  'draw call budget',
  'patrol loop motion',
  'frame inspection',
];

test('index builds from the authored corpus', { timeout: 60000 }, async () => {
  const stats = await buildIndex();
  assert.ok(stats.documents >= 7, `only ${stats.documents} documents`);
  assert.ok(stats.terms >= 100, `only ${stats.terms} terms`);
  assert.ok(stats.avgLen > 0);
  assert.equal(Object.values(stats.kinds).reduce((a, b) => a + b, 0), stats.documents);
});

test('search finds the golden hour record', { timeout: 30000 }, async () => {
  const index = await loadIndex();
  const hits = rank(index, 'golden hour', { limit: 3 });
  assert.ok(hits.length > 0, 'no hit at all');
  assert.equal(hits[0].id, 'kb.lighting.golden-hour-village', hits.map((h) => h.id).join(', '));
});

test('search separates lighting from budget', { timeout: 30000 }, async () => {
  const index = await loadIndex();
  assert.equal(rank(index, 'draw calls budget', { limit: 3 })[0].id, 'kb.budget.desktop-village');
  assert.equal(rank(index, 'shadows', { limit: 3 })[0].kind, 'lighting');
});

test('latency stays inside the budget', { timeout: 60000 }, async () => {
  const started = performance.now();
  const index = await loadIndex();
  const loadMs = performance.now() - started;

  for (let i = 0; i < 40; i += 1) rank(index, QUERIES[i % QUERIES.length]);

  const times = [];
  for (let i = 0; i < 200; i += 1) {
    const t0 = performance.now();
    rank(index, QUERIES[i % QUERIES.length]);
    times.push(performance.now() - t0);
  }
  times.sort((a, b) => a - b);
  const p50 = times[Math.floor(times.length * 0.5)];
  const p95 = times[Math.floor(times.length * 0.95)];

  await writeFile(
    'index/benchmark.json',
    JSON.stringify(
      {
        documents: index.stats.documents,
        terms: index.stats.terms,
        loadMs: Math.round(loadMs * 100) / 100,
        p50Ms: Math.round(p50 * 1000) / 1000,
        p95Ms: Math.round(p95 * 1000) / 1000,
        queries: times.length,
      },
      null,
      2,
    ) + '\n',
    'utf8',
  );

  assert.ok(p95 < 25, `p95 query latency was ${p95.toFixed(3)} ms`);
});
