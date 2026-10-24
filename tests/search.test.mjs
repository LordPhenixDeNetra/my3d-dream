import test from 'node:test';
import assert from 'node:assert/strict';

import { buildIndex, search } from '../src/search.mjs';

const docs = [
  { id: 'village', text: 'fantasy village dusk lantern river' },
  { id: 'bridge', text: 'stone bridge over the running water' },
  { id: 'gears', text: 'coupled gears spur pair ratio' },
];

const index = buildIndex(docs);

test('finds the document that contains the query term', () => {
  const hits = search(index, 'lantern');
  assert.equal(hits.length, 1);
  assert.equal(hits[0].id, 'village');
});

test('is accent insensitive', () => {
  const idx = buildIndex([
    { id: 'a', text: 'réseau électrique' },
    { id: 'b', text: 'pont de pierre' },
  ]);
  assert.equal(search(idx, 'reseau')[0].id, 'a');
});

test('ranks the more specific document first', () => {
  const hits = search(index, 'stone bridge water');
  assert.equal(hits[0].id, 'bridge');
});

test('returns nothing for unknown terms', () => {
  assert.deepEqual(search(index, 'zzz'), []);
});

test('returns nothing for an empty query', () => {
  assert.deepEqual(search(index, ''), []);
});

test('respects the limit', () => {
  const hits = search(index, 'water bridge stone', { limit: 1 });
  assert.equal(hits.length, 1);
  assert.equal(hits[0].id, 'bridge');
});

test('an empty corpus yields no hits', () => {
  assert.deepEqual(search(buildIndex([]), 'anything'), []);
});
