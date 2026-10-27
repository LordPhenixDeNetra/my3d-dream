# Golden village — visual check

A small scene that applies four knowledge records, so you can see the plugin's guidance on screen.

```sh
cd examples/golden-village
npm install
npm run dev
```

Open the URL Vite prints (usually <http://localhost:5173>).

## What you should see

| Cue | Record applied |
|---|---|
| Low, warm sunlight from the left; shadows longer than the objects are tall | `kb.lighting.golden-hour-village` |
| Cool, dim fill on the shadow sides — no crushed blacks | same record (`sky_ambient_k` 7500, intensity 0.35) |
| Stone walls matte and grey, timber roofs warmer and slightly glossier | `kb.material.stone-and-timber` |
| A small creature circling the village and bobbing, always at the same place for the same elapsed time | `kb.motion.patrol-loop` |
| HUD bottom-left with fps, draw calls and triangle count | `kb.budget.desktop-village` |

Expected draw calls: **4** (ground, walls, roofs, creature). The HUD prints the measured numbers
from the renderer; `scene.json` holds the *declared* numbers used by the budget gate.

## Verify with the plugin

```sh
node ../../bin/my3d.mjs budget scene.json
node ../../bin/my3d.mjs capture http://127.0.0.1:5173 --views overview
```

`budget` should print `PASS`. `capture` writes `captures/overview.png` plus a `report.json` holding
`drawCalls`, `triangles` and `textures` read from the live renderer — that is the visual evidence.

## What to look for if it looks wrong

- **Flat, colorless scene**: the sun is too high or the tone mapping is off — check `sun.position`
  against an 8° elevation.
- **Cottages floating**: the merged geometries are translated before merging; a wrong `translate`
  lifts every cottage at once.
- **Creature skidding**: rotation comes from `lookAt` on the next point of the path, not from the
  current one.
- **HUD stuck at 0 calls**: `renderer.info` resets per frame; reading it outside the animation loop
  gives zero.

## Limits

- This is a demonstration, not a benchmark: 4 draw calls prove nothing about a real production scene.
- The declared `triangles` in `scene.json` are estimates; the HUD and `capture` report are the truth.
