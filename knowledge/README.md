# Knowledge corpus — written here

These records are **written for this project**. They are copied from no repository.

## Rules

1. One record = one concrete decision an agent must make, not a lecture.
2. Every numeric value is justified or marked as a starting point to adapt.
3. `checks` contains what must be verified on the rendered image, not what must be written in a report.
4. `limits` states what the record does not cover — this is mandatory.
5. No external source without a verifiable URL; otherwise `sources: []` and say so.

## Schema

```json
{
  "schema_version": 1,
  "id": "kb.<domain>.<subject>",
  "kind": "lighting | material | composition | motion | budget | verification",
  "title": "…",
  "summary": "one sentence: the decision and its effect",
  "applies_when": ["situations where the record applies"],
  "values": { "key": "starting value, explicit unit" },
  "checks": ["what you look at on the frame"],
  "limits": ["what the record does not say"],
  "sources": []
}
```

## Domains

`lighting`, `material`, `composition`, `motion`, `budget`, `verification`.
