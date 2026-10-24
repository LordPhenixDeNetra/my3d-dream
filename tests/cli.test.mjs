import test from 'node:test';
import assert from 'node:assert/strict';

import { run } from '../src/cli.mjs';

function capture() {
  const chunks = [];
  return {
    io: { out: (text) => chunks.push(text) },
    text: () => chunks.join(''),
  };
}

test('stats reports the authored corpus', async () => {
  const { io, text } = capture();
  assert.equal(await run(['stats'], io), 0);
  assert.match(text(), /documents 7/);
  assert.match(text(), /lighting 2/);
});

test('search prints ranked ids', async () => {
  const { io, text } = capture();
  assert.equal(await run(['search', 'golden hour'], io), 0);
  const output = text();
  assert.match(output, /kb\.lighting\.golden-hour-village/);
  assert.ok(output.split('\n').length >= 2);
});

test('search accepts a limit and json output', async () => {
  const { io, text } = capture();
  assert.equal(await run(['search', 'lighting', '--limit', '2', '--json'], io), 0);
  const hits = JSON.parse(text());
  assert.ok(hits.length >= 1 && hits.length <= 2, `got ${hits.length}`);
  assert.ok(hits[0].id);
});

test('resolve returns the record body', async () => {
  const { io, text } = capture();
  assert.equal(await run(['resolve', 'kb.lighting.golden-hour-village'], io), 0);
  const record = JSON.parse(text());
  assert.equal(record.id, 'kb.lighting.golden-hour-village');
  assert.match(record.title, /Golden hour/);
  assert.ok(record.summary.length > 20);
});

test('resolve fails cleanly on an unknown id', async () => {
  const { io, text } = capture();
  assert.equal(await run(['resolve', 'nope.nope'], io), 1);
  assert.match(text(), /unknown record/);
});

test('budget passes a scene inside its delivery budget', async () => {
  const { io, text } = capture();
  assert.equal(await run(['budget', 'tests/fixtures/scene-ok.json'], io), 0);
  assert.match(text(), /PASS/);
  assert.match(text(), /draw calls\s+10 \/ 150/);
});

test('budget fails an oversized scene and lists violations', async () => {
  const { io, text } = capture();
  assert.equal(await run(['budget', 'tests/fixtures/scene-over.json'], io), 1);
  const output = text();
  assert.match(output, /FAIL/);
  assert.match(output, /triangles/);
  assert.match(output, /lights/);
});

test('unknown command exits with usage', async () => {
  const { io, text } = capture();
  assert.equal(await run(['frobnicate'], io), 2);
  assert.match(text(), /unknown command/);
});
