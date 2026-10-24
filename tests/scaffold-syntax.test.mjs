import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);

test('generated project files parse as valid JavaScript', { timeout: 60000 }, async () => {
  for (const file of ['tests/.tmp/village/src/main.js', 'tests/.tmp/village/src/scene.js']) {
    const { stderr } = await run(process.execPath, ['--check', file]);
    assert.equal(stderr.trim(), '', `${file}: ${stderr}`);
  }
});
