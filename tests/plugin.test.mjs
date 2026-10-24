import test from 'node:test';
import assert from 'node:assert/strict';

import { apply, buildTools, inject, name } from '../src/plugin.mjs';

function fakeContext() {
  const registered = [];
  return {
    registered,
    tools: { register: (tool) => registered.push(tool) },
  };
}

test('the plugin declares its identity and tool dependency', () => {
  assert.equal(name, 'my3d-dream');
  assert.deepEqual(inject, ['tools']);
});

test('apply registers the four advertised tools', () => {
  const ctx = fakeContext();
  apply(ctx);
  assert.deepEqual(
    ctx.registered.map((tool) => tool.name),
    ['my3d_search', 'my3d_resolve', 'my3d_budget', 'my3d_scaffold'],
  );
});

test('my3d_search returns ranked ids', async () => {
  const [search] = buildTools();
  const result = await search.execute({ query: 'golden hour', limit: 3 });
  assert.match(result.text, /kb\.lighting\.golden-hour-village/);
  assert.ok(result.hits.length > 0);
});

test('my3d_resolve returns a full record', async () => {
  const [, resolve] = buildTools();
  const result = await resolve.execute({ id: 'kb.lighting.golden-hour-village' });
  assert.equal(result.found, true);
  assert.match(result.text, /Golden hour/);
});

test('my3d_resolve reports an unknown id without throwing', async () => {
  const [, resolve] = buildTools();
  const result = await resolve.execute({ id: 'missing.record' });
  assert.equal(result.found, false);
  assert.match(result.text, /unknown record/);
});

test('my3d_budget fails an oversized scene', async () => {
  const [, , budgetTool] = buildTools();
  const result = await budgetTool.execute({ file: 'tests/fixtures/scene-over.json' });
  assert.equal(result.result.ok, false);
  assert.match(result.text, /FAIL/);
});

test('my3d_scaffold writes a project', async () => {
  const [, , , scaffoldTool] = buildTools();
  const result = await scaffoldTool.execute({
    dir: 'tests/.tmp/plugin-scaffold',
    delivery: 'web-mobile',
    force: true,
  });
  assert.ok(result.files.length > 0);
  assert.match(result.text, /web-mobile|scaffold/);
});

test('every tool renders text for the model', () => {
  for (const tool of buildTools()) {
    assert.equal(typeof tool.name, 'string');
    assert.ok(tool.description.length > 20, `${tool.name} description too short`);
    const rendered = tool.output.render({}, { text: 'ok' });
    assert.deepEqual(rendered, [{ type: 'text', text: 'ok' }]);
    assert.equal(typeof tool.execute, 'function');
  }
});
