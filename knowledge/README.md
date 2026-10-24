# Corpus de connaissances — écrit ici

Ces fiches sont **rédigées pour ce projet**. Elles ne sont copiées d'aucun dépôt.

## Règles

1. Une fiche = une décision concrète qu'un agent doit prendre, pas un cours.
2. Chaque valeur numérique est justifiée ou marquée comme point de départ à ajuster.
3. `checks` contient ce qui doit être vérifié sur l'image rendue, pas ce qui doit être écrit dans un rapport.
4. `limits` dit ce que la fiche ne couvre pas — c'est obligatoire.
5. Pas de source externe sans URL vérifiable ; sinon `sources: []` et le dire.

## Schéma

```json
{
  "schema_version": 1,
  "id": "kb.<domaine>.<sujet>",
  "kind": "lighting | material | composition | motion | budget | verification",
  "title": "…",
  "summary": "une phrase : la décision et son effet",
  "applies_when": ["situations où la fiche s'applique"],
  "values": { "clé": "valeur de départ, unité explicite" },
  "checks": ["ce qu'on regarde sur la frame"],
  "limits": ["ce que la fiche ne dit pas"],
  "sources": []
}
```

## Domaines

`lighting`, `material`, `composition`, `motion`, `budget`, `verification`.
