import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export class CaptureUnavailableError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CaptureUnavailableError';
    this.code = 'CAPTURE_UNAVAILABLE';
  }
}

/**
 * Detect a usable Playwright install without failing the process.
 */
export async function detectPlaywright() {
  try {
    const mod = await import('playwright');
    const chromium = mod.chromium ?? mod.default?.chromium;
    if (!chromium?.launch) {
      return { available: false, reason: 'playwright resolved but exposes no chromium launcher' };
    }
    return { available: true, version: mod.version ?? null };
  } catch (error) {
    return { available: false, reason: String(error?.message ?? error).split('\n')[0] };
  }
}

/**
 * Capture named views of a running scene and read back measured costs.
 * Throws CaptureUnavailableError when no browser automation is installed:
 * an unobserved frame must never be reported as seen.
 * @param {{ url: string, out?: string, views?: string[], width?: number, height?: number, timeoutMs?: number }} options
 */
export async function capture(options) {
  const {
    url,
    out = 'captures',
    views = ['overview'],
    width = 1600,
    height = 900,
    timeoutMs = 30000,
  } = options;

  const state = await detectPlaywright();
  if (!state.available) {
    throw new CaptureUnavailableError(
      `no browser automation available (${state.reason}). Install Playwright, or inspect the scene in a visible browser and report only what you saw.`,
    );
  }

  const { chromium } = await import('playwright');
  const browser = await chromium.launch();
  const shots = [];
  let measured = null;

  try {
    const page = await browser.newPage({ viewport: { width, height } });
    await page.goto(url, { waitUntil: 'networkidle', timeout: timeoutMs });
    await page.waitForTimeout(1200);

    await mkdir(out, { recursive: true });
    for (const view of views) {
      await page.evaluate((viewName) => {
        const apply = globalThis.__3DVIZ_VIEW__;
        if (typeof apply === 'function') apply(viewName);
      }, view);

      await page.waitForTimeout(350);
      const file = path.join(out, `${view}.png`);
      await page.screenshot({ path: file });
      shots.push({ view, file });
    }

    measured = await page.evaluate(() => {
      const api = globalThis.__3DVIZ__;
      return api && typeof api.measure === 'function' ? api.measure() : null;
    });
  } finally {
    await browser.close();
  }

  const report = {
    url,
    capturedAt: new Date().toISOString(),
    viewport: { width, height },
    shots,
    measured,
    note: 'images are observations; measured costs come from window.__3DVIZ__.measure()',
  };
  await mkdir(out, { recursive: true });
  await writeFile(path.join(out, 'report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return report;
}
