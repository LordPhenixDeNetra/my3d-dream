# Contributing

## Engineering rules

1. **Originality.** No third-party corpus, code or module enters this repository. `upstream/` is
   forbidden and CI fails if it is committed. A knowledge record is written here, never imported.
2. **Zero runtime dependencies.** The package declares only optional `peerDependencies` on the DSH
   host. Any added dependency must be justified in the pull request and weighed for size.
3. **ESM, no build step.** `node src/plugin.mjs` must work as-is. No transpiler, no bundler for the
   package itself.
4. **Portable across Windows and Linux.** No atomic rename (`rename` fails with `EPERM` on a network
   drive), paths built with `path.join`, file locks for concurrent writes.
5. **No shell execution in published code.** The sandbox and the tests may launch processes; `src/`
   and `scripts/` may not.
6. **One behavior, one test.** Every observable change goes through `npm test`. A test that cannot run
   (no network, no browser) must be marked `skip` **with its reason**, never pass silently.

## Knowledge records

One record is one decision. The schema is described in `knowledge/README.md`.

- `values`: numbers with units, presented as starting points to adapt.
- `checks`: what you look at on the rendered frame, not what you write in a report.
- `limits`: **mandatory**. A record without limits is a claim without a boundary.
- `sources`: only verifiable URLs; otherwise `[]`, and the record claims no scientific authority.

A record that cannot name its limit is not ready.

## Commits

Conventional format: `feat:`, `fix:`, `docs:`, `test:`, `ci:`, `chore:`.

When a co-author contributes, add the trailer in its own paragraph:

```text
Co-authored-by: NetraDevLPDN <144937204+NetraDevLPDN@users.noreply.github.com>
```

## Review

A reviewer checks, in this order:

1. the change is original and reintroduces no imported corpus;
2. the published measurements come from a file produced by the tests, not from an estimate;
3. the limits are written, not implied;
4. the suite passes on Node 22 and 24.

## Versioning rules

- Semver: `patch` for a fix, `minor` for a record or a tool added, `major` for a contract change
  (tool name, record schema, index format).
- A tag must match `version` in `package.json` exactly — the release workflow enforces it and refuses
  otherwise.
- `CHANGELOG.md` is updated in the same pull request as the change; the generated GitHub release note
  complements it, it does not replace it.
- Procedure details: [PUBLISHING.md](PUBLISHING.md).
