import test from 'node:test';
import assert from 'node:assert/strict';

test('the runtime can reach the upstream repository over HTTPS', async () => {
  const url =
    'https://raw.githubusercontent.com/viettranx/3dviz-pro-max/main/skills/3dviz-pro-max/SKILL.md';
  const res = await fetch(url);
  assert.equal(res.status, 200);
  const text = await res.text();
  assert.ok(text.length > 1000, `unexpected body length: ${text.length}`);
});
