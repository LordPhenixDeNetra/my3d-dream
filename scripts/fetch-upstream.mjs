import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const OWNER = 'viettranx';
const REPO = '3dviz-pro-max';
const REF = 'main';
const SKILL_PREFIX = 'skills/3dviz-pro-max/';
const USER_AGENT = 'dsh-3dviz (data sync)';

/** Sections of the upstream skill that carry no media and are safe to vendor. */
export const SECTIONS = {
  data: 'data/',
  references: 'references/',
  templates: 'templates/',
};

async function getJson(url) {
  const res = await fetch(url, { headers: { 'user-agent': USER_AGENT } });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  const remaining = res.headers.get('x-ratelimit-remaining');
  if (remaining !== null && Number(remaining) < 2) {
    throw new Error(`GitHub rate limit nearly exhausted (remaining=${remaining})`);
  }
  return res.json();
}

async function getText(url) {
  const res = await fetch(url, { headers: { 'user-agent': USER_AGENT } });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.text();
}

/** Blob list for the whole repository, filtered to the vendored sections. */
export async function listUpstreamFiles(sections = Object.keys(SECTIONS)) {
  const treeUrl = `https://api.github.com/repos/${OWNER}/${REPO}/git/trees/${REF}?recursive=1`;
  const tree = await getJson(treeUrl);
  if (tree.truncated) throw new Error('GitHub tree response was truncated');

  const prefixes = sections.map((name) => SKILL_PREFIX + SECTIONS[name]);
  return tree.tree
    .filter((entry) => entry.type === 'blob')
    .filter((entry) => prefixes.some((prefix) => entry.path.startsWith(prefix)))
    .map((entry) => ({ path: entry.path, size: entry.size, sha: entry.sha }));
}

async function pool(items, limit, worker) {
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      await worker(items[index], index);
    }
  });
  await Promise.all(runners);
}

/**
 * Download the vendored sections into `upstream/`.
 * Returns a report; a matching existing report is reused unless `force` is set.
 * @param {{ sections?: string[], outDir?: string, force?: boolean, concurrency?: number }} [options]
 */
export async function fetchUpstream(options = {}) {
  const {
    sections = ['data'],
    outDir = 'upstream',
    force = false,
    concurrency = 8,
  } = options;

  const reportPath = path.join(outDir, '.fetch.json');
  if (!force) {
    try {
      const cached = JSON.parse(await readFile(reportPath, 'utf8'));
      if (sections.every((s) => cached.sections?.includes(s))) return { ...cached, cached: true };
    } catch {
      // no usable cache; fall through to a network fetch
    }
  }

  const headUrl = `https://api.github.com/repos/${OWNER}/${REPO}/commits/${REF}`;
  const head = await getJson(headUrl);
  const files = await listUpstreamFiles(sections);

  let bytes = 0;
  let done = 0;
  const failures = [];

  await pool(files, concurrency, async (file) => {
    const relative = file.path.slice(SKILL_PREFIX.length);
    const target = path.join(outDir, relative);
    try {
      const body = await getText(
        `https://raw.githubusercontent.com/${OWNER}/${REPO}/${head.sha}/${file.path}`,
      );
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, body, 'utf8');
      bytes += Buffer.byteLength(body);
      done += 1;
    } catch (error) {
      failures.push({ path: file.path, error: String(error.message ?? error) });
    }
  });

  const report = {
    repository: `${OWNER}/${REPO}`,
    commit: head.sha,
    fetchedAt: new Date().toISOString(),
    sections,
    files: done,
    bytes,
    failures,
    license: 'MIT (code and authored data); third-party assets keep their own terms',
  };
  await mkdir(outDir, { recursive: true });
  await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n', 'utf8');
  return { ...report, cached: false };
}
