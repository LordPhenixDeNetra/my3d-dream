# My3D_Dream

[![CI](https://github.com/LordPhenixDeNetra/my3d-dream/actions/workflows/ci.yml/badge.svg)](https://github.com/LordPhenixDeNetra/my3d-dream/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/my3d-dream.svg)](https://www.npmjs.com/package/my3d-dream)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Plugin DeepSeek Harness pour construire des scènes 3D **fondées sur des décisions vérifiables** —
pas seulement du code qui compile.

## Installation

```sh
npm install -g my3d-dream     # installe la commande `my3d`
```

Sans installation globale :

```sh
npx my3d search "village au crépuscule"
```

Comme plugin DSH :

```sh
dsh plugin --profile desktop add my3d-dream
```

## Démarrage

```sh
my3d search "village au crépuscule"
my3d resolve kb.lighting.golden-hour-village
my3d scaffold ./scene --delivery web-desktop
my3d budget ./scene/scene.json
my3d capture http://127.0.0.1:5173 --views overview,closeup
```

## Outils exposés au modèle

| Outil | Rôle |
|---|---|
| `my3d_search` | classe les fiches de connaissance, renvoie ids + résumés |
| `my3d_resolve` | renvoie une fiche complète (valeurs, contrôles, limites) |
| `my3d_budget` | valide les coûts **déclarés** d'une scène |
| `my3d_scaffold` | écrit un projet Vite + Three.js prêt à lancer |

## Corpus

`knowledge/` contient les fiches, rédigées ici : une décision par fichier, six domaines
(`lighting`, `material`, `composition`, `motion`, `budget`, `verification`). Chaque fiche porte
`values` (nombres de départ), `checks` (ce qu'on regarde sur la frame) et `limits` (ce qu'elle ne
couvre pas).

## Mesures

Chiffres relevés sur le corpus actuel : **7 fiches, 465 termes**.

| Axe | Valeur | Source |
|---|---|---|
| Contexte par tâche | ~1 380 o (≈345 tokens) contre 8 484 o (≈2 121) pour tout lire — **−34 %** | [`docs/tokens.json`](docs/tokens.json) |
| Skill au chargement | 4 244 o | [`docs/metrics.json`](docs/metrics.json) |
| Démarrage de l'index | 15 ms à chaud contre 90 ms à froid | [`docs/baseline.json`](docs/baseline.json) |
| Requête p50 / p95 | 0,019 ms / 0,030 ms | [`index/benchmark.json`](index/benchmark.json) |
| Frame réelle | **2 draw calls · 14 144 triangles · 1 texture**, 0 erreur JS | [`docs/runtime.json`](docs/runtime.json) |

L'écart de contexte diminue logiquement avec un corpus de 7 fiches : l'indexation paie surtout quand
la base grossit. Ces valeurs seront relevées à nouveau à chaque ajout.

## Limites assumées

- Le temps de frame de [`docs/runtime.json`](docs/runtime.json) vient d'un rastériseur **logiciel**
  (SwiftShader) : il ne représente pas une GPU. Draw calls et triangles sont indépendants du matériel.
- `my3d_budget` vérifie des nombres **déclarés** ; des tests confirment qu'ils correspondent au coût
  analytique puis au coût réel mesuré dans le navigateur pour le scaffold.
- La capture sort en code 3 avec un message clair quand Playwright est absent.
- Le plugin est couvert par des tests de contrat, pas par un chargement dans un profil DSH réel :
  `dsh plugin add` reste bloqué dans cet environnement (lecteur `N:`).

## Licence

MIT — voir [LICENSE](LICENSE). Copyright (c) 2026 LordPhenixDeNetra and NetraDevLPDN.

## Contribuer, signaler, publier

- Règles de code et de release : [CONTRIBUTING.md](CONTRIBUTING.md)
- Modèle de menace et signalement : [SECURITY.md](SECURITY.md)
- Runbook de publication : [PUBLISHING.md](PUBLISHING.md)
- Historique des versions : [CHANGELOG.md](CHANGELOG.md)
