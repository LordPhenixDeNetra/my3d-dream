import test from 'node:test';
import assert from 'node:assert/strict';

import { CaptureUnavailableError, capture, detectPlaywright } from '../src/capture.mjs';
import { run } from '../src/cli.mjs';

const detection = await detectPlaywright();

test('Playwright detection reports a status instead of throwing', () => {
  assert.equal(typeof detection.available, 'boolean');
  if (!detection.available) assert.equal(typeof detection.reason, 'string');
});

test('capture refuses to invent frames without a browser', { skip: detection.available }, async () => {
  await assert.rejects(
    () => capture({ url: 'http://127.0.0.1:9/' }),
    (error) => error instanceof CaptureUnavailableError && error.code === 'CAPTURE_UNAVAILABLE',
  );
});

test('the CLI exits with code 3 and an install hint', { skip: detection.available }, async () => {
  const chunks = [];
  const code = await run(['capture', 'http://127.0.0.1:9/'], { out: (text) => chunks.push(text) });
  const output = chunks.join('');
  assert.equal(code, 3);
  assert.match(output, /capture unavailable/);
  assert.match(output, /playwright/);
});

test('capture requires a url', async () => {
  const chunks = [];
  const code = await run(['capture'], { out: (text) => chunks.push(text) });
  assert.equal(code, 2);
  assert.match(chunks.join(''), /usage: my3d capture/);
});
