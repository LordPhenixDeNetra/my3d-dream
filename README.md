# My3D_Dream

[![CI](https://github.com/LordPhenixDeNetra/my3d-dream/actions/workflows/ci.yml/badge.svg)](https://github.com/LordPhenixDeNetra/my3d-dream/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/my3d-dream.svg)](https://www.npmjs.com/package/my3d-dream)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A DeepSeek Harness plugin for building 3D scenes **grounded in verifiable decisions** — not just code
that compiles.

## Installation

```sh
npm install -g my3d-dream     # installs the `my3d` command
```

Without a global install:

```sh
npx my3d search "village at dusk"
```

As a DSH plugin:

```sh
dsh plugin --profile desktop add my3d-dream
```

## Getting started

```sh
my3d search "village at dusk"
my3d resolve kb.lighting.golden-hour-village
my3d scaffold ./scene --delivery web-desktop
my3d budget ./scene/scene.json
my3d capture http://127.0.0.1:5173 --views overview,closeup
```

### See it on screen

`examples/golden-village` is a small scene that applies four records, with the expected result
described cue by cue:

```sh
cd examples/golden-village
npm install
npm run dev
```

## Tools exposed to the model

| Tool | Purpose |
|---|---|
| `my3d_search` | ranks knowledge records, returns ids and one-line summaries |
| `my3d_resolve` | returns one full record (values, checks, limits) |
| `my3d_budget` | validates the **declared** render costs of a scene |
| `my3d_scaffold` | writes a runnable Vite + Three.js project |

## Corpus

`knowledge/` holds the records, written for this project: one decision per file, six domains
(`lighting`, `material`, `composition`, `motion`, `budget`, `verification`). Each record carries
`values` (starting numbers), `checks` (what to look at on the frame) and `limits` (what it does not
cover).

## Measurements

Numbers measured on the current corpus: **7 records, 465 terms**.

| Axis | Value | Source |
|---|---|---|
| Context per task | ~1,380 B (≈345 tokens) against 8,484 B (≈2,121) to read everything — **−34 %** | [`docs/tokens.json`](docs/tokens.json) |
| Skill at load | 4,244 B | [`docs/metrics.json`](docs/metrics.json) |
| Index startup | 15 ms warm against 90 ms cold | [`docs/baseline.json`](docs/baseline.json) |
| Query p50 / p95 | 0.019 ms / 0.030 ms | [`index/benchmark.json`](index/benchmark.json) |
| Real frame | **2 draw calls · 14,144 triangles · 1 texture**, 0 JS errors | [`docs/runtime.json`](docs/runtime.json) |

The context gap shrinks with a corpus of only 7 records: indexing pays off as the base grows. These
values are re-measured on every test run.

## Assumed limits

- The frame time in [`docs/runtime.json`](docs/runtime.json) comes from a **software** rasterizer
  (SwiftShader): it does not represent a GPU. Draw calls and triangles are hardware independent.
- `my3d_budget` validates **declared** numbers; separate tests confirm they match the analytic cost
  and then the real cost measured in the browser for the scaffold.
- `capture` exits with code 3 and a clear message when Playwright is absent.
- The plugin is covered by contract tests, not by loading it into a real DSH profile: `dsh plugin add`
  remains blocked in this environment (`N:` drive).

## License

MIT — see [LICENSE](LICENSE). Copyright (c) 2026 LordPhenixDeNetra and NetraDevLPDN.

## Contributing, reporting, publishing

- Code and release rules: [CONTRIBUTING.md](CONTRIBUTING.md)
- Threat model and reporting: [SECURITY.md](SECURITY.md)
- Release runbook: [PUBLISHING.md](PUBLISHING.md)
- Version history: [CHANGELOG.md](CHANGELOG.md)

<!-- uuu -->
