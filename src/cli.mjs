import { readFile } from 'node:fs/promises';

import { checkBudget } from './budget.mjs';
import { loadOrBuildIndex, rank, readRecord } from './store.mjs';

const HELP = `my3d — grounded 3D scene authoring for DSH

  search <query> [--limit N] [--json]     rank recipes and knowledge records
  resolve <record-id> [--json]            full record for one id
  budget <scene.json> [--delivery NAME]   check declared render costs
  scaffold <dir> [--delivery NAME]        write a Vite + Three.js project
  capture <url> [--views a,b] [--out DIR] capture views (needs Playwright)
  stats                                   corpus and index metadata

Delivery targets: web-desktop, web-mobile, web-vr.
`;

function truncate(text, max = 150) {
  const value = String(text ?? '').replace(/\s+/g, ' ').trim();
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}

function parseArgs(args) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--json') flags.json = true;
    else if (arg === '--force') flags.force = true;
    else if (arg === '--limit' || arg === '--delivery' || arg === '--name' || arg === '--out' || arg === '--views') {
      flags[arg.slice(2)] = args[i + 1];
      i += 1;
    } else if (arg.startsWith('--')) {
      throw new Error(`unknown option "${arg}"`);
    } else positional.push(arg);
  }
  return { positional, flags };
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
  'sources',
];

function pick(record) {
  const out = {};
  for (const key of RESOLVE_KEYS) {
    if (record[key] !== undefined) out[key] = record[key];
  }
  return out;
}

/**
 * CLI entry point. Returns a process exit code.
 * @param {string[]} argv
 * @param {{ out: (text: string) => void }} [io]
 */
export async function run(argv, io = { out: (text) => process.stdout.write(text) }) {
  const [command, ...args] = argv;

  if (!command || command === 'help' || command === '--help') {
    io.out(HELP);
    return 0;
  }

  const { positional, flags } = parseArgs(args);

  if (command === 'search') {
    const query = positional.join(' ').trim();
    if (!query) {
      io.out('usage: my3d search <query>\n');
      return 2;
    }
    const index = await loadOrBuildIndex();
    const limit = Number(flags.limit ?? 8);
    const hits = rank(index, query, { limit });

    if (flags.json) {
      io.out(`${JSON.stringify(hits, null, 2)}\n`);
      return 0;
    }
    if (hits.length === 0) {
      io.out(`no match for "${query}"\n`);
      return 1;
    }
    const lines = hits.map(
      (hit) => `${hit.id}  (${hit.score})\n  ${hit.title} — ${truncate(hit.summary)}`,
    );
    io.out(`${lines.join('\n')}\n`);
    return 0;
  }

  if (command === 'resolve') {
    const id = positional[0];
    if (!id) {
      io.out('usage: my3d resolve <record-id>\n');
      return 2;
    }
    const index = await loadOrBuildIndex();
    const record = await readRecord(index, id);
    if (!record) {
      io.out(`unknown record "${id}"\n`);
      return 1;
    }
    io.out(`${JSON.stringify(flags.json ? record : pick(record), null, 2)}\n`);
    return 0;
  }

  if (command === 'budget') {
    const file = positional[0];
    if (!file) {
      io.out('usage: my3d budget <scene.json> [--delivery web-desktop]\n');
      return 2;
    }
    const spec = JSON.parse(await readFile(file, 'utf8'));
    const result = checkBudget(spec, flags.delivery ?? spec.delivery ?? 'web-desktop');

    if (flags.json) {
      io.out(`${JSON.stringify(result, null, 2)}\n`);
    } else {
      const { totals, budget } = result;
      const row = (label, actual, limit) => {
        const mark = actual > limit ? 'FAIL' : 'ok  ';
        io.out(`${mark} ${label.padEnd(12)} ${actual} / ${limit}\n`);
      };
      io.out(`budget ${result.delivery}: ${result.ok ? 'PASS' : 'FAIL'}\n`);
      row('draw calls', totals.drawCalls, budget.drawCalls);
      row('triangles', totals.triangles, budget.triangles);
      row('textures', totals.textures, budget.textures);
      row('texture MB', Math.round(totals.textureBytes / 1e6), Math.round(budget.textureBytes / 1e6));
      row('lights', totals.lights, budget.lights);
      io.out(`(${result.note})\n`);
    }
    return result.ok ? 0 : 1;
  }

  if (command === 'scaffold') {
    const targetDir = positional[0];
    if (!targetDir) {
      io.out('usage: my3d scaffold <dir> [--delivery web-desktop]\n');
      return 2;
    }
    const { scaffold } = await import('./scaffold.mjs');
    const result = await scaffold(targetDir, {
      name: flags.name,
      delivery: flags.delivery ?? 'web-desktop',
      force: Boolean(flags.force),
    });
    io.out(`scaffold ${result.name} (${result.delivery}) → ${result.targetDir}\n`);
    for (const file of result.files) io.out(`  + ${file}\n`);
    for (const file of result.skipped) io.out(`  = ${file} (exists, --force to overwrite)\n`);
    io.out(`next: cd ${result.targetDir} && npm install && npm run dev\n`);
    return 0;
  }

  if (command === 'capture') {
    const url = positional[0];
    if (!url) {
      io.out('usage: my3d capture <url> [--out captures] [--views overview,closeup]\n');
      return 2;
    }
    const { capture, CaptureUnavailableError } = await import('./capture.mjs');
    try {
      const report = await capture({
        url,
        out: flags.out ?? 'captures',
        views: (flags.views ?? 'overview').split(',').map((view) => view.trim()).filter(Boolean),
      });
      io.out(`captured ${report.shots.length} view(s) → ${flags.out ?? 'captures'}\n`);
      for (const shot of report.shots) io.out(`  ${shot.view}: ${shot.file}\n`);
      if (report.measured) io.out(`measured ${JSON.stringify(report.measured)}\n`);
      return 0;
    } catch (error) {
      if (error instanceof CaptureUnavailableError) {
        io.out(`capture unavailable: ${error.message}\n`);
        io.out('install: npm i -D playwright && npx playwright install chromium\n');
        return 3;
      }
      throw error;
    }
  }

  if (command === 'stats') {
    const index = await loadOrBuildIndex();
    if (flags.json) {
      io.out(`${JSON.stringify({ ...index.stats, builtAt: index.builtAt, upstream: index.upstream }, null, 2)}\n`);
      return 0;
    }
    const kinds = Object.entries(index.stats.kinds ?? {})
      .map(([kind, count]) => `${kind} ${count}`)
      .join(' · ');
    io.out(
      `documents ${index.stats.documents} · terms ${index.stats.terms} · avg length ${index.stats.avgLen.toFixed(1)}\n` +
        `${kinds}\n` +
        `built ${index.builtAt}\n`,
    );
    return 0;
  }

  io.out(`unknown command "${command}"\n\n${HELP}`);
  return 2;
}
