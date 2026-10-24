# My3D_Dream — plan et état

Plugin DSH original pour construire des scènes 3D vérifiables. Le code et le corpus sont écrits ici ;
le dépôt `3dviz-pro-max` n'a servi que de lecture, et le corpus importé est en cours de retrait.

## État

| Brique | État | Preuve |
|---|---|---|
| Nommage | `my3d-dream`, CLI `my3d`, outils `my3d_*` | `package.json`, `cordis.patch.yml` |
| Recherche indexée | 663 documents, 6 746 termes | `index/benchmark.json` |
| Latence | p50 0,044 ms · p95 0,14 ms · 23 ms à chaud | `docs/baseline.json` |
| Contexte | ~1 600 tokens par tâche (−74 %) | `docs/tokens.json` |
| Skill | ~4,2 Ko, divulgation progressive | `docs/metrics.json` |
| Scaffold | Vite + Three.js, géométrie vérifiée | `tests/geometry-real.test.mjs` |
| Rendu réel | 2 draw calls, 14 144 triangles, 0 erreur | `docs/runtime.json` |
| Corpus original | **7 fiches rédigées**, 6 domaines | `knowledge/` |
| Tests | 61 | `node --test` |

## Direction

1. **Écrire le corpus** dans `knowledge/` : `lighting`, `material`, `composition`, `motion`,
   `budget`, `verification`. Chaque fiche porte des valeurs de départ, des contrôles visuels et
   ses limites.
2. **Basculer l'index** de `upstream/data` vers `knowledge/`.
3. **Retirer `upstream/`** et l'attribution qui va avec.
4. **Réécrire `SKILL.md`** autour du corpus propre.

## Contraintes

- Aucune suppression de fichier possible sans shell ; les anciens chemins restent en shim explicite
  (`bin/3dviz.mjs`, `docs/3dviz-dsh/`).
- Le lecteur `N:` refuse les écritures de descripteurs de sécurité : pas de `dsh plugin add` ni de
  Playwright install ici.
