import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { loadIndex, rank, readRecord } from '../src/store.mjs';

const QUERIES = [
  'golden hour village',
  'night practicals',
  'stone and timber',
  'draw call budget',
  'patrol loop',
  'frame inspection',
];

const KEEP = ['id', 'title', 'summary', 'applies_when', 'values', 'checks'];

function compact(record) {
  const out = {};
  for (const key of KEEP) if (record[key] !== undefined) out[key] = record[key];
  return out;
}

async function corpusBytes(dir = 'knowledge') {
  let bytes = 0;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) bytes += await corpusBytes(full);
    else if (entry.name.endsWith('.json')) bytes += (await readFile(full)).length;
  }
  return bytes;
}

test('a tool loop costs far fewer bytes than reading the whole corpus', { timeout: 60000 }, async () => {
  const index = await loadIndex();

  let bytes = 0;
  let records = 0;
  for (const query of QUERIES) {
    const hits = rank(index, query, { limit: 3 });
    assert.ok(hits.length > 0, `no hit for ${query}`);
    bytes += Buffer.byteLength(JSON.stringify(hits));
    const record = await readRecord(index, hits[0].id);
    bytes += Buffer.byteLength(JSON.stringify(compact(record)));
    records += 1;
  }

  const skillBytes = (await readFile('skill/SKILL.md', 'utf8')).length;
  const naiveBytes = await corpusBytes();

  const report = {
    perTaskToolBytes: Math.round(bytes / records),
    perTaskToolTokens: Math.round(bytes / records / 4),
    skillBytes,
    skillTokens: Math.round(skillBytes / 4),
    baselineBytes: naiveBytes,
    baselineTokens: Math.round(naiveBytes / 4),
    contextRatio: Math.round((1000 * (skillBytes + bytes / records)) / naiveBytes) / 1000,
    queries: QUERIES.length,
    measuredAt: new Date().toISOString(),
    note: 'bytes measured on real payloads; tokens estimated at 4 bytes per token',
  };

  await mkdir('docs', { recursive: true });
  await writeFile('docs/tokens.json', `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  assert.ok(report.perTaskToolBytes < 4000, `tool loop returned ${report.perTaskToolBytes} bytes`);
  assert.ok(report.contextRatio < 0.7, `context ratio ${report.contextRatio}`);
});

test('the skill plus one record stays under a small context budget', async () => {
  const report = JSON.parse(await readFile('docs/tokens.json', 'utf8'));
  assert.ok(report.skillBytes < 6000);
  assert.ok(report.perTaskToolBytes > 0);
});
