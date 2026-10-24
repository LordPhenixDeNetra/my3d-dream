# Changelog

Toutes les évolutions notables de ce projet.
Format [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/), versionnage
[SemVer](https://semver.org/lang/fr/).

## [Unreleased]

## [0.1.0] - 2026-10-24

Première version publiable.

### Ajouté

- **Plugin DSH** `my3d-dream` : quatre outils exposés au modèle — `my3d_search`, `my3d_resolve`,
  `my3d_budget`, `my3d_scaffold` — et une couche de bundle `cordis.patch.yml`.
- **CLI `my3d`** : `search`, `resolve`, `budget`, `scaffold`, `capture`, `stats`.
- **Corpus de connaissances** dans `knowledge/` : 7 fiches rédigées pour ce projet, réparties en six
  domaines (`lighting`, `material`, `composition`, `motion`, `budget`, `verification`). Chaque fiche
  porte `values`, `checks` et `limits`.
- **Index BM25 pré-calculé** : construction verrouillée, chargement paresseux, reconstruction
  automatique si l'artefact est absent, périmé ou illisible.
- **Scaffold Vite + Three.js** : tone mapping ACES, espace colorimétrique sRGB, caméra orbitale,
  HUD fps, et hook `window.__3DVIZ__.measure()` pour lire les coûts réels du moteur.
- **Gate de budget** : trois cibles (`web-desktop`, `web-mobile`, `web-vr`), validation des coûts
  déclarés, sortie non nulle en cas de dépassement.
- **Capture** : vues nommées via Playwright ; en son absence, sortie code 3 avec message explicite —
  jamais de frame inventée.
- **Documentation** : `README.md`, `CONTRIBUTING.md`, `SECURITY.md`, `PUBLISHING.md`,
  `knowledge/README.md`.
- **CI GitHub Actions** : tests sur Node 22 et 24, garde qui échoue si le corpus importé est
  versionné, artefacts de mesure conservés 7 jours.
- **Release automatisée** : tag `v*` → contrôle tag/version → tests → `npm publish --provenance`
  → release GitHub avec notes générées.
- **Licence MIT**.

### Notes

- Projet en `0.x` : le contrat des outils et le schéma des fiches peuvent encore changer.
- Les mesures publiées (`docs/*.json`, `index/benchmark.json`) sont régénérées par la suite de tests ;
  elles ne sont pas versionnées.
- Le corpus est volontairement restreint : il grandit quand une décision se répète, pas pour atteindre
  un volume.

[Unreleased]: https://github.com/LordPhenixDeNetra/my3d-dream/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/LordPhenixDeNetra/my3d-dream/releases/tag/v0.1.0
