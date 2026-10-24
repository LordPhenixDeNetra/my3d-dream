import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const TEMPLATE_ROOT = 'templates/scaffold';

function render(text, vars) {
  return text.replace(/\{\{(\w+)\}\}/g, (_match, key) => vars[key] ?? '');
}

async function exists(target) {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

/**
 * Write a runnable Vite + Three.js project from the bundled template.
 * @param {string} targetDir
 * @param {{ name?: string, delivery?: string, force?: boolean }} [options]
 */
export async function scaffold(targetDir, options = {}) {
  const name = options.name ?? path.basename(path.resolve(targetDir));
  const delivery = options.delivery ?? 'web-desktop';
  const vars = { name, delivery };

  await mkdir(targetDir, { recursive: true });

  const files = [];
  const skipped = [];

  const walk = async (relative) => {
    const source = path.join(TEMPLATE_ROOT, relative);
    const entries = await readdir(source, { withFileTypes: true });
    for (const entry of entries) {
      const child = path.join(relative, entry.name);
      if (entry.isDirectory()) {
        await walk(child);
        continue;
      }
      const outName = entry.name.endsWith('.tmpl') ? entry.name.slice(0, -5) : entry.name;
      const destination = path.join(targetDir, path.dirname(child), outName);

      if (!options.force && (await exists(destination))) {
        skipped.push(destination);
        continue;
      }

      const body = render(await readFile(path.join(TEMPLATE_ROOT, child), 'utf8'), vars);
      await mkdir(path.dirname(destination), { recursive: true });
      await writeFile(destination, body, 'utf8');
      files.push(destination);
    }
  };

  await walk('.');

  return { targetDir, name, delivery, files, skipped };
}
