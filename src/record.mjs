/** Field weights declared by the upstream search contract (manifest.json). */
export const FIELD_WEIGHTS = {
  title: 3,
  aliases: 3,
  summary: 1.5,
  objective: 1.5,
  tags: 2,
  intent_signals: 1,
  example_prompts: 0.5,
  subject_terms: 1.5,
  applies_when: 1,
  feeling: 1,
};

function asArray(value) {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

/**
 * Pick the English string (or first available locale) from a localized value.
 * @param {unknown} value
 * @returns {unknown}
 */
export function localize(value) {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const record = /** @type {Record<string, unknown>} */ (value);
    return record.en ?? Object.values(record)[0] ?? '';
  }
  return value;
}

/**
 * Flatten a record into weighted text blocks for indexing.
 * @param {Record<string, any>} record
 * @returns {{ weight: number, text: string }[]}
 */
export function extractFields(record) {
  const fields = [];
  const push = (weight, value) => {
    for (const item of asArray(localize(value))) {
      if (typeof item === 'string' && item.trim() !== '') fields.push({ weight, text: item });
    }
  };

  push(FIELD_WEIGHTS.title, record.title);
  push(FIELD_WEIGHTS.aliases, record.aliases);
  push(FIELD_WEIGHTS.summary, record.summary);
  push(FIELD_WEIGHTS.objective, record.objective);
  push(FIELD_WEIGHTS.tags, record.tags);
  push(FIELD_WEIGHTS.intent_signals, record.intent_signals);
  push(FIELD_WEIGHTS.example_prompts, record.example_prompts);
  push(FIELD_WEIGHTS.subject_terms, record.subject_terms);
  push(FIELD_WEIGHTS.applies_when, record.applies_when);
  push(FIELD_WEIGHTS.feeling, record.defaults?.values?.feeling);

  return fields;
}

/**
 * Compact, model-readable projection of a record.
 * @param {Record<string, any>} record
 * @param {'recipe' | 'knowledge'} kind
 */
export function summarize(record, kind) {
  return {
    id: record.id,
    kind,
    title: localize(record.title) ?? '',
    summary: typeof record.summary === 'string' ? record.summary : '',
    tags: asArray(record.tags).slice(0, 12),
    directions: asArray(record.direction_ids),
    status: record.status ?? 'active',
    ...(record.knowledge_kind ? { knowledgeKind: record.knowledge_kind } : {}),
  };
}
