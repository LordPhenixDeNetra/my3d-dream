# Publier une version

Runbook de release. Tout se fait par tag : le workflow `.github/workflows/release.yml` publie sur npm
et crée la release GitHub.

## Une seule fois — prérequis

1. Compte npm avec **2FA** activée.
2. Token npm de type **Automation** (*Access Tokens* → *Generate New Token* → *Automation*). Les
   tokens *Publish* exigent un OTP à chaque appel et échouent en CI.
3. Secret GitHub **`NPM_TOKEN`** : *Settings* → *Secrets and variables* → *Actions*.
4. Dépôt **public** : sans cela, la provenance npm est refusée.

## Avant de taguer

- [ ] branche `main` à jour, arbre de travail propre (`git status` vide) ;
- [ ] `npm test` vert en local ;
- [ ] `package.json` : `version` incrémentée selon semver ;
- [ ] `CHANGELOG.md` : section `Unreleased` transformée en version datée ;
- [ ] `README.md` : toute mesure citée provient d'un fichier régénéré par les tests ;
- [ ] `LICENSE` présent, année à jour ;
- [ ] aucune trace d'`upstream/` : `git ls-files | Select-String upstream` ne renvoie rien.

## Procédure

```powershell
npm test
npm version patch          # ou minor / major — crée le commit et le tag vX.Y.Z
git push --follow-tags
```

`npm version` écrit son propre message de commit. Pour y ajouter le co-auteur :

```powershell
git commit --amend -m "chore: release vX.Y.Z" -m "Co-authored-by: NetraDevLPDN <144937204+NetraDevLPDN@users.noreply.github.com>"
git tag -f vX.Y.Z
git push --force-with-lease --follow-tags
```

## Ce que fait le workflow

1. vérifie que le tag (`vX.Y.Z`) correspond à `version` dans `package.json` — échec immédiat sinon ;
2. `npm install` ;
3. `npm publish --provenance --access public`, précédé de `prepublishOnly` qui exécute `npm test` :
   une suite rouge bloque la publication ;
4. crée la release GitHub avec les notes générées, en *prerelease* si le tag contient un tiret.

## Vérifier

- `https://www.npmjs.com/package/my3d-dream` — version et onglet *Provenance* pointant vers le commit ;
- `https://github.com/LordPhenixDeNetra/my3d-dream/releases` — release et notes ;
- `npm i -g my3d-dream@X.Y.Z && my3d stats`.

## Publication manuelle (secours)

Le workflow est la voie normale. En cas d'indisponibilité de la CI :

```powershell
$env:MY3D_SKIP_BROWSER="1"
npm login
npm publish --access public
```

Sans `--provenance` : la signature ne peut être produite que par un runner GitHub.

## En cas de problème

| Symptôme | Cause | Action |
|---|---|---|
| `tag v… does not match` | tag et `version` divergent | corriger `version`, refaire le tag |
| `EOTP` / `403` | token Publish au lieu d'Automation | régénérer un token Automation |
| `provenance` refusée | dépôt privé ou `id-token` absent | vérifier `permissions: id-token: write` |
| tests rouges dans `npm publish` | `prepublishOnly` | corriger, refaire un tag **neuf** |

## Revenir en arrière

- **Dans les 72 h** : `npm unpublish my3d-dream@X.Y.Z` (politique npm : pas de réutilisation de la
  version, pas de retrait au-delà de 72 h sauf cas exceptionnel).
- **Au-delà** : `npm deprecate my3d-dream@X.Y.Z "raison"` puis publier un correctif. On ne réécrit
  jamais une version publiée.
- **Tag Git** : supprimer le tag distant (`git push --delete origin vX.Y.Z`) et la release GitHub,
  puis republier sous un numéro supérieur.

## Préversions

```powershell
npm version prerelease --preid=rc   # 0.2.0-rc.0
git push --follow-tags
```

Le workflow marque automatiquement la release GitHub comme *prerelease*. Le tag npm `latest` n'est
pas déplacé par une préversion.
