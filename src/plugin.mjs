import { checkBudget } from './budget.mjs';
import { scaffold } from './scaffold.mjs';
import { loadOrBuildIndex, rank, readRecord } from './store.mjs';

export const name = 'my3d-dream';
export const inject = ['tools'];

/**
 * `defineTool` from the host is a typing helper; outside a DSH host a plain
 * descriptor object is equivalent, which keeps this module testable in Node.
 */
let defineTool = (spec) => spec;
try {
  const hostTools = await import('@deepseek-ai/dsh-tools');
  if (typeof hostTools.defineTool === 'function') defineTool = hostTools.defineTool;
} catch {
  // Not running inside a DSH composition.
}

const renderText = (_args, value) => [{ type: 'text', text: value.text }];

function searchText(query, hits) {
  if (hits.length === 0) return `no match for "${query}"`;
  return hits
    .map((hit) => `${hit.id} (${hit.score})\n  ${hit.title} — ${hit.summary}`)
    .join('\n');
}

const RESOLVE_KEYS = [
  'id',
  'title',
  'summary',
  'objective',
  'tags',
  'subject_terms',
  'applies_when',
  'entities',
  'state_contract',
  'invariants',
  'motion_guidance',
  'known_limits',
  'defaults',
];

function pick(record) {
  const out = {};
  for (const key of RESOLVE_KEYS) {
    if (record[key] !== undefined) out[key] = record[key];
  }
  return out;
}

/**
 * @param {{ indexPath?: string, dataDir?: string }} [config]
 */
export function buildTools(config = {}) {
  const indexPath = config.indexPath ?? 'index';
  const dataDir = config.dataDir ?? 'knowledge';

  return [
    defineTool({
      name: 'my3d_search',
      description:
        'Search the 3D scene knowledge base (663 records) for a subject and return ranked ids with one-line summaries. Call before deciding construction.',
      parameters: {
        query: { type: 'string', required: true, description: 'Subject plus the decision still open' },
        limit: { type: 'number', description: 'How many ids to return (default 5)' },
      },
      output: { schema: { type: 'object' }, render: renderText },
      async execute(args) {
        const index = await loadOrBuildIndex(indexPath);
        const hits = rank(index, args.query, { limit: Math.min(Number(args.limit ?? 5), 12) });
        return { text: searchText(args.query, hits), hits };
      },
    }),

    defineTool({
      name: 'my3d_resolve',
      description:
        'Return one full knowledge record (guidance, invariants, defaults, limits) by id. Use after my3d_search to avoid reading raw files.',
      parameters: {
        id: { type: 'string', required: true, description: 'Record id, e.g. knowledge.blueprint-stone-bridge' },
      },
      output: { schema: { type: 'object' }, render: renderText },
      async execute(args) {
        const index = await loadOrBuildIndex(indexPath);
        const record = await readRecord(index, args.id, dataDir);
        if (!record) return { text: `unknown record "${args.id}"`, found: false };
        return { text: JSON.stringify(pick(record), null, 2), found: true, record: pick(record) };
      },
    }),

    defineTool({
      name: 'my3d_budget',
      description:
        'Check declared render costs of a scene.json against a delivery budget. Validates declared numbers; it does not measure frame time.',
      parameters: {
        file: { type: 'string', required: true, description: 'Path to scene.json' },
        delivery: { type: 'string', description: 'web-desktop | web-mobile | web-vr' },
      },
      output: { schema: { type: 'object' }, render: renderText },
      async execute(args) {
        const { readFile } = await import('node:fs/promises');
        const spec = JSON.parse(await readFile(args.file, 'utf8'));
        const result = checkBudget(spec, args.delivery ?? spec.delivery ?? 'web-desktop');
        const lines = [`budget ${result.delivery}: ${result.ok ? 'PASS' : 'FAIL'}`];
        for (const [metric, limit] of Object.entries(result.budget)) {
          if (metric === 'frameMs') continue;
          const actual = result.totals[metric] ?? 0;
          lines.push(`${actual > limit ? 'FAIL' : 'ok  '} ${metric} ${actual} / ${limit}`);
        }
        lines.push(`(${result.note})`);
        return { text: lines.join('\n'), result };
      },
    }),

    defineTool({
      name: 'my3d_scaffold',
      description:
        'Write a runnable Vite + Three.js project (tone mapping, colour space, orbit camera, fps/measure hook, scene.json) into a directory.',
      parameters: {
        dir: { type: 'string', required: true, description: 'Target directory' },
        delivery: { type: 'string', description: 'web-desktop | web-mobile | web-vr' },
        force: { type: 'boolean', description: 'Overwrite existing files' },
      },
      output: { schema: { type: 'object' }, render: renderText },
      async execute(args) {
        const result = await scaffold(args.dir, {
          delivery: args.delivery ?? 'web-desktop',
          force: Boolean(args.force),
        });
        return {
          text: `scaffold ${result.name} → ${result.targetDir} (${result.files.length} files)\nnext: cd ${result.targetDir} && npm install && npm run dev`,
          files: result.files,
        };
      },
    }),
  ];
}

/**
 * Cordis plugin entry.
 * @param {{ tools: { register: (tool: unknown) => void } }} ctx
 * @param {{ indexPath?: string, dataDir?: string }} [config]
 */
export function apply(ctx, config = {}) {
  for (const tool of buildTools(config)) ctx.tools.register(tool);
}
