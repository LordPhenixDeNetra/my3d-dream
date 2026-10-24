/** Declared render budgets per delivery target. Values are ceilings, not targets. */
export const BUDGETS = {
  'web-desktop': {
    drawCalls: 150,
    triangles: 750_000,
    textures: 24,
    textureBytes: 64 * 1024 * 1024,
    lights: 6,
    frameMs: 16.7,
  },
  'web-mobile': {
    drawCalls: 60,
    triangles: 150_000,
    textures: 12,
    textureBytes: 16 * 1024 * 1024,
    lights: 4,
    frameMs: 33.3,
  },
  'web-vr': {
    drawCalls: 80,
    triangles: 300_000,
    textures: 16,
    textureBytes: 32 * 1024 * 1024,
    lights: 4,
    frameMs: 11.1,
  },
};

const METRICS = ['drawCalls', 'triangles', 'textures', 'textureBytes', 'lights'];

/**
 * Sum the declared costs of a scene specification.
 * @param {{ objects?: any[], lights?: number, textures?: number, textureBytes?: number }} spec
 */
export function measureScene(spec) {
  const objects = Array.isArray(spec?.objects) ? spec.objects : [];
  const totals = { drawCalls: 0, triangles: 0, textures: spec?.textures ?? 0, textureBytes: spec?.textureBytes ?? 0, lights: spec?.lights ?? 0 };

  for (const object of objects) {
    totals.drawCalls += object.drawCalls ?? 1;
    totals.triangles += object.triangles ?? 0;
  }
  return totals;
}

/**
 * Compare a declared scene against a delivery budget.
 * This checks declared numbers; it does not measure a running renderer.
 * @param {object} spec
 * @param {string} [delivery]
 */
export function checkBudget(spec, delivery = 'web-desktop') {
  const budget = BUDGETS[delivery];
  if (!budget) {
    throw new Error(`unknown delivery "${delivery}"; expected one of ${Object.keys(BUDGETS).join(', ')}`);
  }

  const totals = measureScene(spec);
  const violations = [];
  for (const metric of METRICS) {
    if (totals[metric] > budget[metric]) {
      violations.push({
        metric,
        actual: totals[metric],
        limit: budget[metric],
        overBy: totals[metric] - budget[metric],
      });
    }
  }

  return {
    ok: violations.length === 0,
    delivery,
    totals,
    budget,
    violations,
    note: 'declared costs, not measured frame time',
  };
}
