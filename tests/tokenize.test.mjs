import test from 'node:test';
import assert from 'node:assert/strict';

import { normalize, tokenize } from '../src/tokenize.mjs';

test('normalize strips diacritics and lowercases', () => {
  assert.equal(normalize('Réseau Éclair'), 'reseau eclair');
});

test('tokenize drops stopwords but keeps content words', () => {
  assert.deepEqual(tokenize('the bridge over the water'), ['bridge', 'over', 'water']);
});

test('tokenize keeps numeric terms and short units', () => {
  assert.deepEqual(tokenize('module 10 mm'), ['module', '10', 'mm']);
});

test('tokenize tolerates non-string input', () => {
  assert.deepEqual(tokenize(null), []);
  assert.deepEqual(tokenize(undefined), []);
  assert.deepEqual(tokenize(42), []);
});

test('tokenize collapses punctuation and repeats', () => {
  assert.deepEqual(tokenize('gears, gears; gears!'), ['gears', 'gears', 'gears']);
});
