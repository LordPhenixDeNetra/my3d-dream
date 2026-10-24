# Security

## Threat model

A DSH plugin is **trusted host code**: it runs inside the `dsh` process, with the user's privileges,
outside the agent sandbox. Installing this package means executing its code.

Exposed surfaces:

| Surface | What it touches | Risk |
|---|---|---|
| `my3d capture <url>` | launches a browser on a supplied URL | access to the local network, execution of a third-party site's JS in the driven browser |
| `my3d scaffold <dir>` | writes files into a chosen directory | overwrite with `--force`, writes outside the intended directory if the path is malformed |
| `my3d budget <file>`, `my3d resolve <id>` | reads a JSON file | reading an arbitrary path the user can access |
| index loading | `JSON.parse` of a generated file | local poisoning if a third party can modify the file |

## What is already in place

- **No shell execution** in published code (`src/`, `scripts/`): verified by searching for
  `child_process`, `spawn`, `execFile`, `eval`. The tests launch processes, but `tests/` is not
  published.
- **No network call** at load time; the only remote access is the one `capture` performs, toward the
  URL the user explicitly supplies.
- **No `eval`, no dynamic code** beyond static imports.
- **Locked index writes** (lock file, in-place write): another process cannot produce an exploitable
  partial index.
- **Blocking test suite** before publication (`prepublishOnly`).

## What this package does not protect against

- **SSRF through `capture`.** The URL is not filtered: it may target `127.0.0.1`, a router or an
  internal service. Only pass URLs you control.
- **Third-party content.** A remote page runs its own JavaScript in the driven browser; it can read
  its own cookies, not those of your personal browser (isolated profile).
- **User-supplied paths.** `scaffold` and `budget` do what they are told; no confinement to a
  directory.
- **Record accuracy.** These are numeric recommendations, not physical guarantees.

## Reporting a vulnerability

Do **not** open a public issue. Use the repository **Security** tab → *Report a vulnerability*
(GitHub Security Advisories):

<https://github.com/LordPhenixDeNetra/my3d-dream/security/advisories/new>

Describe: affected version, exact input, observed behavior, estimated impact.

Response commitment: acknowledgement within 72 hours, severity assessment, fix and coordinated
disclosure. No contractual deadline is promised.

## Supported versions

The project is at `0.x`: only the latest published version receives security fixes.
