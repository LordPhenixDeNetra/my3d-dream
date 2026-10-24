const STOPWORDS = new Set([
  // English
  'the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'with', 'by',
  'is', 'are', 'was', 'were', 'be', 'as', 'at', 'it', 'its', 'this', 'that',
  // French
  'le', 'la', 'les', 'de', 'des', 'du', 'un', 'une', 'et', 'ou', 'a', 'en',
  'sur', 'pour', 'par', 'dans', 'ce', 'cette', 'ces', 'il', 'elle', 'est',
  'sont', 'au', 'aux', 'se', 'sa', 'son', 'ses',
]);

/**
 * Lowercase and strip diacritics so « Réseau » and « reseau » match.
 * @param {string} text
 * @returns {string}
 */
export function normalize(text) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

/**
 * Tokenize free text into searchable terms.
 * Non-strings yield an empty array so callers never need a guard.
 * @param {string} text
 * @returns {string[]}
 */
export function tokenize(text) {
  if (typeof text !== 'string') return [];
  return normalize(text)
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length > 1 && !STOPWORDS.has(term));
}
