---
name: my3d-dream
description: Build grounded, expressive 3D scenes with Three.js. Use for 3D creation and edits, scientific and technical visualization, spatial puzzles, product, architecture and environment studies — anything that must look right on screen rather than merely compile.
---

# My3D_Dream

Curated subject knowledge, starting values and scaffolds. Your judgment still decides the art.

## Tools

```sh
node bin/my3d.mjs search "<subject and the decision you have not made>"
node bin/my3d.mjs resolve <record-id>
node bin/my3d.mjs budget <scene.json> --delivery web-desktop
node bin/my3d.mjs scaffold <dir> --delivery web-desktop
node bin/my3d.mjs capture <url> --views overview,closeup
```

- `search` returns record ids with one-line summaries; `resolve` returns one full record.
- Two tool calls beat a directory scan: read the corpus only through the tools.
- `budget` validates **declared** render costs. It does not measure frame time, and a passing
  budget never proves the scene looks right.
- `capture` exits 3 when Playwright is absent: then say plainly that no frame was observed.

## Workflow

1. **Intent.** Decide what the viewer must see, feel, understand or do. Pick a distinctive visual
   idea and the viewing distance that matters.
2. **Shape before template.** Name the silhouette, proportions, parts, joins and surface identity of
   each important object. Solve the hardest object first; kits accelerate, they do not decide.
3. **Ground the claim.** For scientific, anatomical, historical or mathematical subjects, establish
   the authoritative state and check claim → model → rendered result. A textured mesh certifies nothing.
4. **Route construction.** Reuse a kit when shape and behaviour already fit; adapt or compose parts
   when identity differs; author custom geometry for one-off heroes; import an asset only after
   checking provenance, scale and registration.
5. **Build one first view.** Keep the project's stack. Build, then look at the artifact in a browser
   at overview, inspection and close-up distances.
6. **Make motion belong to state.** Transforms, joints, contacts and readouts derive from one
   authoritative model. An illustration may simplify physics; it must not imply a simulation it
   does not run.
7. **Measure, then look.** Run the budget check, then inspect real frames. Numbers and pictures
   answer different questions.
8. **Refine the weakest thing.** A failed shape needs a different construction, not more texture.
9. **Report honestly.** Separate what you built, what you observed, what you declared and what
   remains unverified. Never describe a frame you did not see.

## Budget

Declare the cost of every object in `scene.json` before claiming a target is met:

```json
{
  "name": "lantern-village",
  "delivery": "web-desktop",
  "lights": 3,
  "textures": 6,
  "textureBytes": 8000000,
  "objects": [
    { "id": "terrain", "drawCalls": 1, "triangles": 120000 },
    { "id": "cottages", "drawCalls": 8, "triangles": 90000 }
  ]
}
```

| delivery | draw calls | triangles | textures | lights | frame |
| --- | ---: | ---: | ---: | ---: | ---: |
| `web-desktop` | 150 | 750 000 | 24 | 6 | 16.7 ms |
| `web-mobile` | 60 | 150 000 | 12 | 4 | 33.3 ms |
| `web-vr` | 80 | 300 000 | 16 | 4 | 11.1 ms |

Prefer instancing and merged geometry when object count grows; reserve unique meshes for things the
camera inspects closely.

## Where the knowledge lives

Records sit in `knowledge/`, one decision per file, six kinds: `lighting`, `material`,
`composition`, `motion`, `budget`, `verification`. Each record carries:

- `values` — starting numbers with units, to adapt rather than obey;
- `checks` — what to look at on the rendered frame;
- `limits` — what the record does not cover.

Search first, resolve second, open the raw file only when the whole record is needed:

```sh
node bin/my3d.mjs search "<the decision you have not made>"
node bin/my3d.mjs resolve <record-id>
```

Add a record whenever a decision recurs. A record without `limits` is a claim without a boundary.
