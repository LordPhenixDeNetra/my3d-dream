# My3D_Dream — plan and status

An original DSH plugin for building verifiable 3D scenes. The code and the corpus are written here;
the `3dviz-pro-max` repository served only as reading material, and the imported corpus is being
removed.

## Status

| Component | State | Evidence |
|---|---|---|
| Naming | `my3d-dream`, CLI `my3d`, tools `my3d_*` | `package.json`, `cordis.patch.yml` |
| Indexed search | 7 documents, 465 terms | `index/benchmark.json` |
| Latency | p50 0.019 ms · p95 0.030 ms · 15 ms warm | `docs/baseline.json` |
| Context | ~1,380 B per task (−34 % against reading everything) | `docs/tokens.json` |
| Skill | ~4.2 KB, progressive disclosure | `docs/metrics.json` |
| Scaffold | Vite + Three.js, geometry verified | `tests/geometry-real.test.mjs` |
| Real render | 2 draw calls, 14,144 triangles, 0 errors | `docs/runtime.json` |
| Original corpus | **7 records written**, 6 domains | `knowledge/` |
| Tests | full suite via `node --test` | CI |

## Direction

1. **Write the corpus** in `knowledge/`: `lighting`, `material`, `composition`, `motion`, `budget`,
   `verification`. Every record carries starting values, visual checks and its limits.
2. **Grow it** only when a decision repeats; volume is not a goal.
3. **Keep the tools thin**: search, resolve, budget, scaffold, capture — nothing else.

## Constraints

- No file deletion possible without a shell; legacy paths remain as explicit shims.
- The `N:` drive refuses security-descriptor writes: no `dsh plugin add` and no Playwright install
  from the agent here.
- The measured frame time comes from a software rasterizer, not a GPU.
