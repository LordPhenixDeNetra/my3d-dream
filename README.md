# My3D_Dream

Plugin DeepSeek Harness pour construire des scènes 3D **fondées sur des décisions vérifiables** —
pas seulement du code qui compile.

## Démarrage

```sh
node bin/my3d.mjs search "village au crépuscule"
node bin/my3d.mjs resolve <record-id>
node bin/my3d.mjs scaffold ./scene --delivery web-desktop
node bin/my3d.mjs budget ./scene/scene.json
node bin/my3d.mjs capture http://127.0.0.1:5173 --views overview,closeup
```

Comme plugin :

```sh
dsh plugin --profile desktop add .
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

Le code et les fiches de `knowledge/` sont sous MIT, écrits pour ce projet.
