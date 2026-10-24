import { mkdir, open, readFile, readdir, stat, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { INDEX_VERSION } from '../src/store.mjs';
import { tokenize } from '../src/tokenize.mjs';

/** Fields of the My3D_Dream record schema, with their retrieval weight. */
export const FIELD_WEIGHTS = {
  title: 3,
  summary: 2,
  applies_when: 1.5,
  checks: 1,
  limits: 1,
  values: 1,
};

async function listJsonFiles(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await listJsonFiles(full)));
    else if (entry.isFile() && entry.name.endsWith('.json')) files.push(full);
  }
  return files.sort();
}

/** Weighted text blocks for one record. */
function recordFields(record) {
  const fields = [];
  const push = (weight, value) => {
    if (typeof value === 'string' && value.trim() !== '') fields.push({ weight, text: value });
  };

  push(FIELD_WEIGHTS.title, record.title);
  push(FIELD_WEIGHTS.summary, record.summary);
  for (const item of record.applies_when ?? []) push(FIELD_WEIGHTS.applies_when, item);
  for (const item of record.checks ?? []) push(FIELD_WEIGHTS.checks, item);
  for (const item of record.limits ?? []) push(FIELD_WEIGHTS.limits, item);
  for (const [key, value] of Object.entries(record.values ?? {})) {
    push(FIELD_WEIGHTS.values, `${key} ${String(value)}`);
  }
  return fields;
}

/**
 * Serialize writers across processes. Windows network drives reject
 * rename-over-existing, so the index is written in place under this lock.
 * @param {string} dir
 */
async function acquireLock(dir) {
  const lockPath = path.join(dir, '.build.lock');
  const deadline = Date.now() + 60000;

  for (;;) {
    try {
      const handle = await open(lockPath, 'wx');
      return async () => {
        await handle.close();
        await unlink(lockPath).catch(() => {});
      };
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      try {
        const info = await stat(lockPath);
        if (Date.now() - info.mtimeMs > 60000) {
          await unlink(lockPath).catch(() => {});
          continue;
        }
      } catch {
        continue;
      }
      if (Date.now() > deadline) throw new Error('timed out waiting for the index build lock');
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
}

/**
 * Build the precomputed BM25 index from the records in `knowledge/`.
 * @param {{ knowledgeDir?: string, outDir?: string }} [options]
 */
export async function buildIndex(options = {}) {
  const { knowledgeDir = 'knowledge', outDir = 'index' } = options;

  const files = await listJsonFiles(knowledgeDir);
  const docs = [];
  const paths = [];
  const postings = new Map();
  const lengths = [];
  const kinds = {};

  for (const file of files) {
    const record = JSON.parse(await readFile(file, 'utf8'));
    if (!record?.id) continue;

    const docId = docs.length;
    const weighted = new Map();
    let length = 0;

    for (const field of recordFields(record)) {
      for (const term of tokenize(field.text)) {
        weighted.set(term, (weighted.get(term) ?? 0) + field.weight);
        length += field.weight;
      }
    }

    docs.push({
      id: record.id,
      kind: record.kind ?? 'unknown',
      title: record.title ?? '',
      summary: record.summary ?? '',
    });
    paths.push(path.relative(knowledgeDir, file).split(path.sep).join('/'));
    lengths.push(length);
    kinds[record.kind ?? 'unknown'] = (kinds[record.kind ?? 'unknown'] ?? 0) + 1;

    for (const [term, weight] of weighted) {
      let list = postings.get(term);
      if (!list) {
        list = [];
        postings.set(term, list);
      }
      list.push(docId, Math.round(weight * 100) / 100);
    }
  }

  const totalLen = lengths.reduce((sum, len) => sum + len, 0);
  const avgLen = docs.length > 0 ? totalLen / docs.length : 0;

  const payload = {
    version: INDEX_VERSION,
    builtAt: new Date().toISOString(),
    params: { k1: 1.2, b: 0.75 },
    stats: { documents: docs.length, terms: postings.size, avgLen, kinds },
    aliases: {},
    lengths,
    paths,
    docs,
    postings: Object.fromEntries(postings),
  };

  await mkdir(outDir, { recursive: true });
  const release = await acquireLock(outDir);
  try {
    await writeFile(path.join(outDir, 'bm25.json'), JSON.stringify(payload), 'utf8');
  } finally {
    await release();
  }

  return payload.stats;
}

const entry = process.argv[1];
if (entry && import.meta.url === pathToFileURL(entry).href) {
  const stats = await buildIndex();
  console.log(JSON.stringify(stats, null, 2));
}
