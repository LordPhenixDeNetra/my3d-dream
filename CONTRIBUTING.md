# Contribuer

## Règles d'ingénierie

1. **Originalité.** Aucun corpus, code ou module tiers n'entre dans le dépôt. `upstream/` est interdit
   et la CI échoue s'il est versionné. Une fiche de connaissance se rédige ici, elle ne s'importe pas.
2. **Zéro dépendance runtime.** Le paquet ne déclare que des `peerDependencies` optionnelles vers
   l'hôte DSH. Toute dépendance ajoutée doit être justifiée dans la pull request et pesée en taille.
3. **ESM, sans étape de build.** `node src/plugin.mjs` doit fonctionner tel quel. Pas de transpileur,
   pas de bundler pour le paquet lui-même.
4. **Portable Windows et Linux.** Pas de renommage atomique (`rename` échoue en `EPERM` sur un lecteur
   réseau), chemins construits avec `path.join`, verrous par fichier pour les écritures concurrentes.
5. **Pas d'exécution de shell dans le code publié.** Le bac à sable et les tests peuvent lancer des
   processus ; `src/` et `scripts/` non.
6. **Un comportement, un test.** Toute modification observable passe par `npm test`. Un test qui ne
   peut pas s'exécuter (réseau absent, navigateur absent) doit se marquer `skip` **avec sa raison**,
   jamais passer silencieusement.

## Fiches de connaissance

Une fiche = une décision. Le schéma est décrit dans `knowledge/README.md`.

- `values` : nombres avec unités, présentés comme points de départ à ajuster.
- `checks` : ce qu'on regarde sur l'image rendue, pas ce qu'on écrit dans un rapport.
- `limits` : **obligatoire**. Une fiche sans limites est une affirmation sans bord.
- `sources` : uniquement des URL vérifiables ; sinon `[]`, et la fiche ne prétend pas à une autorité
  scientifique.

Une fiche qui ne peut pas nommer sa limite n'est pas prête.

## Commits

Format conventionnel : `feat:`, `fix:`, `docs:`, `test:`, `ci:`, `chore:`.

Quand un co-auteur contribue, ajoute le trailer sur son propre paragraphe :

```text
Co-authored-by: NetraDevLPDN <144937204+NetraDevLPDN@users.noreply.github.com>
```

## Relecture

Un relecteur vérifie, dans cet ordre :

1. la modification est originale et ne réintroduit aucun corpus importé ;
2. les mesures annoncées viennent d'un fichier produit par les tests, pas d'une estimation ;
3. les limites sont écrites, pas sous-entendues ;
4. la suite passe sur Node 22 et 24.

## Règles de version

- Semver : `patch` pour un correctif, `minor` pour une fiche ou un outil ajouté, `major` pour un
  changement de contrat (nom d'outil, schéma de fiche, format d'index).
- Un tag doit correspondre exactement à `version` dans `package.json` — le workflow de release le
  contrôle et refuse sinon.
- `CHANGELOG.md` est mis à jour dans la même pull request que le changement ; la note de release
  GitHub est générée à partir des commits et le complète, elle ne le remplace pas.
- Détail de la procédure : [PUBLISHING.md](PUBLISHING.md).
