# Sécurité

## Modèle de menace

Un plugin DSH est du **code hôte de confiance** : il s'exécute dans le processus `dsh`, avec les
droits de l'utilisateur, en dehors du bac à sable de l'agent. Installer ce paquet revient à exécuter
son code.

Surfaces exposées :

| Surface | Ce qu'elle touche | Risque |
|---|---|---|
| `my3d capture <url>` | lance un navigateur sur une URL fournie | accès au réseau local, exécution de JS d'un site tiers dans le navigateur piloté |
| `my3d scaffold <dir>` | écrit des fichiers dans un dossier choisi | écrasement si `--force`, écriture hors du dossier prévu si le chemin est mal formé |
| `my3d budget <file>`, `my3d resolve <id>` | lit un fichier JSON | lecture d'un chemin arbitraire accessible à l'utilisateur |
| chargement de l'index | `JSON.parse` d'un fichier généré | empoisonnement local si le fichier est modifiable par un tiers |

## Ce qui est déjà en place

- **Aucune exécution de shell** dans le code publié (`src/`, `scripts/`) : vérifié par recherche de
  `child_process`, `spawn`, `execFile`, `eval`. Les tests en lancent, mais `tests/` n'est pas publié.
- **Aucun appel réseau** au chargement ; le seul accès distant est celui que `capture` effectue, vers
  l'URL que l'utilisateur fournit explicitement.
- **Pas de `eval`, pas de code dynamique** hors import statique.
- **Écriture verrouillée** de l'index (fichier de verrou, écriture en place) : un autre processus ne
  peut pas produire un index partiel exploitable.
- **Suite de tests bloquante** avant publication (`prepublishOnly`).

## Ce que ce paquet ne protège pas

- **SSRF via `capture`.** L'URL n'est pas filtrée : elle peut viser `127.0.0.1`, un routeur ou un
  service interne. Ne passe que des URL que tu contrôles.
- **Contenu tiers.** Une page distante exécute son propre JavaScript dans le navigateur piloté ; elle
  peut lire ses propres cookies, pas ceux de ton navigateur personnel (profil isolé).
- **Chemins fournis par l'utilisateur.** `scaffold` et `budget` font ce qu'on leur demande ; aucun
  confinement à un répertoire.
- **Exactitude des fiches.** Ce sont des recommandations chiffrées, pas des garanties physiques.

## Signaler une vulnérabilité

N'ouvre **pas** d'issue publique. Utilise l'onglet **Security** du dépôt →
*Report a vulnerability* (GitHub Security Advisories) :

<https://github.com/LordPhenixDeNetra/my3d-dream/security/advisories/new>

Décris : version concernée, entrée exacte, comportement observé, impact estimé.

Engagement de réponse : accusé de réception sous 72 heures, évaluation de gravité, correctif et
publication coordonnée. Aucun délai contractuel n'est promis.

## Versions supportées

Le projet est en `0.x` : seule la dernière version publiée reçoit des correctifs de sécurité.
