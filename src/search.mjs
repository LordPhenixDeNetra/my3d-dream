import { tokenize } from './tokenize.mjs';

/**
 * @typedef {{ id: string, text: string, [key: string]: unknown }} Doc
 */

/**
 * Build an in-memory inverted index over documents.
 * @param {Doc[]} docs
 */
export function buildIndex(docs) {
  const postings = new Map();
  const docFreq = new Map();
  const docLens = [];

  docs.forEach((doc, docId) => {
    const tokens = tokenize(doc.text);
    docLens.push(tokens.length);
    const termFreq = new Map();
    for (const term of tokens) {
      termFreq.set(term, (termFreq.get(term) ?? 0) + 1);
    }
    for (const [term, count] of termFreq) {
      let list = postings.get(term);
      if (!list) {
        list = new Map();
        postings.set(term, list);
      }
      list.set(docId, count);
      docFreq.set(term, (docFreq.get(term) ?? 0) + 1);
    }
  });

  const totalLen = docLens.reduce((sum, len) => sum + len, 0);
  return {
    docs,
    postings,
    docFreq,
    docLens,
    avgLen: docs.length > 0 ? totalLen / docs.length : 0,
    size: docs.length,
  };
}

/**
 * Rank documents against a query with BM25.
 * @param {ReturnType<typeof buildIndex>} index
 * @param {string} query
 * @param {{ limit?: number, k1?: number, b?: number }} [options]
 * @returns {{ id: string, score: number }[]}
 */
export function search(index, query, options = {}) {
  const { limit = 10, k1 = 1.2, b = 0.75 } = options;
  const terms = tokenize(query);
  if (terms.length === 0 || index.size === 0) return [];

  const scores = new Map();
  for (const term of terms) {
    const list = index.postings.get(term);
    if (!list) continue;
    const freq = index.docFreq.get(term) ?? 0;
    const idf = Math.log(1 + (index.size - freq + 0.5) / (freq + 0.5));
    for (const [docId, count] of list) {
      const len = index.docLens[docId] || 1;
      const norm = 1 - b + b * (len / (index.avgLen || 1));
      const score = idf * ((count * (k1 + 1)) / (count + k1 * norm));
      scores.set(docId, (scores.get(docId) ?? 0) + score);
    }
  }

  return [...scores.entries()]
    .sort((x, y) => y[1] - x[1] || x[0] - y[0])
    .slice(0, limit)
    .map(([docId, score]) => ({ id: index.docs[docId].id, score }));
}
