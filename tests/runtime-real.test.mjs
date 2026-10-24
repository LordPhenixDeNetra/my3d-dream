import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createReadStream } from 'node:fs';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import path from 'node:path';

import { scaffold } from '../src/scaffold.mjs';

const APP_DIR = 'tests/.tmp/runtime';

function run(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, shell: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', reject);
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.glb': 'model/gltf-binary',
};

function serve(root) {
  const absolute = path.resolve(root);
  return new Promise((resolve) => {
    const server = createServer(async (request, response) => {
      try {
        const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
        const file = path.join(absolute, pathname === '/' ? 'index.html' : pathname);
        if (!file.startsWith(absolute)) {
          response.writeHead(403).end();
          return;
        }
        const info = await stat(file);
        if (!info.isFile()) {
          response.writeHead(404).end('not found');
          return;
        }
        response.writeHead(200, { 'content-type': MIME[path.extname(file)] ?? 'application/octet-stream' });
        createReadStream(file).pipe(response);
      } catch {
        if (!response.headersSent) response.writeHead(404).end('not found');
        else response.destroy();
      }
    });
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

test('a real browser renders the scaffold and reports measured draw calls', { timeout: 300000 }, async (t) => {
  await scaffold(APP_DIR, { name: 'runtime-check', delivery: 'web-desktop', force: true });

  const install = await run('npm', ['install', '--no-audit', '--no-fund'], APP_DIR);
  if (install.code !== 0) {
    t.skip(`npm install failed: ${install.stderr.trim().split('\n').slice(-2).join(' ')}`);
    return;
  }
  const extra = await run('npm', ['install', '--no-save', '--no-audit', '--no-fund', 'playwright-core'], APP_DIR);
  if (extra.code !== 0) {
    t.skip(`playwright-core unavailable: ${extra.stderr.trim().split('\n').slice(-2).join(' ')}`);
    return;
  }

  const build = await run('npm', ['run', 'build'], APP_DIR);
  assert.equal(build.code, 0, `vite build failed: ${build.stderr.slice(-600)}`);

  const requireFromApp = createRequire(path.resolve(APP_DIR, 'package.json'));
  let chromium;
  try {
    ({ chromium } = requireFromApp('playwright-core'));
  } catch (error) {
    t.skip(`playwright-core did not load: ${error.message}`);
    return;
  }

  let browser;
  try {
    browser = await chromium.launch({
      channel: 'msedge',
      headless: true,
      args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
    });
  } catch (error) {
    t.skip(`no Chromium-family browser available: ${String(error.message).split('\n')[0]}`);
    return;
  }

  const { server, port } = await serve(path.join(APP_DIR, 'dist'));
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(String(error)));
    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'load', timeout: 60000 });
    await page.waitForFunction(() => Boolean(globalThis.__3DVIZ__), null, { timeout: 30000 });

    const measured = await page.evaluate(async () => {
      const api = globalThis.__3DVIZ__;
      const frames = [];
      let last = performance.now();
      await new Promise((resolve) => {
        let count = 0;
        const tick = (now) => {
          frames.push(now - last);
          last = now;
          count += 1;
          if (count < 40) requestAnimationFrame(tick);
          else resolve();
        };
        requestAnimationFrame(tick);
      });
      const sample = frames.slice(5).sort((a, b) => a - b);
      return {
        ...api.measure(),
        medianFrameMs: Math.round(sample[Math.floor(sample.length / 2)] * 100) / 100,
        frames: sample.length,
      };
    });

    const report = {
      measuredAt: new Date().toISOString(),
      browser: 'msedge headless (angle/swiftshader)',
      viewport: '1280x720',
      ...measured,
      errors,
      note: 'frame time comes from a software rasterizer; draw calls and triangles are hardware independent',
    };
    await mkdir('docs', { recursive: true });
    await writeFile('docs/runtime.json', `${JSON.stringify(report, null, 2)}\n`, 'utf8');

    assert.deepEqual(errors, [], `page errors: ${errors.join(' | ')}`);
    assert.equal(measured.drawCalls, 2, `draw calls ${measured.drawCalls}`);
    assert.ok(measured.triangles > 14_000 && measured.triangles < 14_500, `triangles ${measured.triangles}`);
    // SwiftShader rasterizes on the CPU, so an absolute frame budget would be meaningless here.
    assert.ok(measured.medianFrameMs > 0 && measured.medianFrameMs < 500, `median frame ${measured.medianFrameMs} ms`);
  } finally {
    await browser.close();
    server.close();
  }
});
