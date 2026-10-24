import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { tokenize } from './tokenize.mjs';

/** Bumped whenever the on-disk index shape changes; stale artifacts are rebuilt. */
export const INDEX_VERSION = 2;

/**
 * Load a precomputed index produced by scripts/build-index.mjs.
 * @param {string} [dir]
 */
export async function loadIndex(dir = 'index') {
  const file = path.join(dir, 'bm25.json');
  let lastError = null;

  // Another process may be writing the index in place; retry briefly before failing.
  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      const raw = await readFile(file, 'utf8');
      return JSON.parse(raw);
    } catch (error) {
      if (error?.code === 'ENOENT') throw error;
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  throw lastError;
}

/**
 * Load the index, building it once if the artifact is missing.
 * @param {string} [dir]
 */
export async function loadOrBuildIndex(dir = 'index') {
  try {
    const loaded = await loadIndex(dir);
    if (loaded.version === INDEX_VERSION) return loaded;
  } catch {
    // Missing, stale or half-written index: rebuild below.
  }

  const { buildIndex } = await import('../scripts/build-index.mjs');
  await buildIndex({ outDir: dir });
  return loadIndex(dir);
}

/**
 * Locate a document row by its record id.
 * @param {Awaited<ReturnType<typeof loadIndex>>} index
 * @param {string} id
 */
export function findDoc(index, id) {
  const docId = index.docs.findIndex((doc) => doc.id === id);
  return docId === -1 ? null : { docId, doc: index.docs[docId] };
}

/**
 * Read the full upstream record behind an index row.
 * @param {Awaited<ReturnType<typeof loadIndex>>} index
 * @param {string} id
 * @param {string} [dataDir]
 */
export async function readRecord(index, id, dataDir = 'knowledge') {
  const found = findDoc(index, id);
  if (!found) return null;
  const file = path.join(dataDir, index.paths[found.docId]);
  return JSON.parse(await readFile(file, 'utf8'));
}

function expandTerms(terms, aliases) {
  const expanded = new Set(terms);
  for (const term of terms) {
    const extra = aliases?.[term];
    if (!extra) continue;
    for (const alias of extra) {
      for (const token of tokenize(alias)) expanded.add(token);
    }
  }
  return [...expanded];
}

/**
 * Rank documents with weighted-field BM25.
 * @param {Awaited<ReturnType<typeof loadIndex>>} index
 * @param {string} query
 * @param {{ limit?: number }} [options]
 */
export function rank(index, query, options = {}) {
  const { limit = 8 } = options;
  const base = tokenize(query);
  if (base.length === 0) return [];

  const terms = expandTerms(base, index.aliases);
  const { k1, b } = index.params;
  const n = index.stats.documents;
  const avgLen = index.stats.avgLen || 1;
  const scores = new Map();

  for (const term of terms) {
    const flat = index.postings[term];
    if (!flat) continue;
    const df = flat.length / 2;
    const idf = Math.log(1 + (n - df + 0.5) / (df + 0.5));
    for (let i = 0; i < flat.length; i += 2) {
      const docId = flat[i];
      const tf = flat[i + 1];
      const len = index.lengths[docId] || 1;
      const score = idf * ((tf * (k1 + 1)) / (tf + k1 * (1 - b + (b * len) / avgLen)));
      scores.set(docId, (scores.get(docId) ?? 0) + score);
    }
  }

  return [...scores.entries()]
    .sort((a, b2) => b2[1] - a[1] || a[0] - b2[0])
    .slice(0, limit)
    .map(([docId, score]) => ({
      score: Math.round(score * 1000) / 1000,
      ...index.docs[docId],
    }));
}
