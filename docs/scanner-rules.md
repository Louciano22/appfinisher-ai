# Scanner Rules

## Current Engine

Sandpaper Engine v1 lives in the legacy-compatible `lib/shipguard-engine` module.

It uses deterministic heuristics only:

- File path presence.
- File name patterns.
- Route/path naming.
- `contentPreview` substring checks.
- Common config file presence.

The browser scanner does not parse real repositories, walk the filesystem, parse ASTs, or call external services.

## Local observation (CLI only)

From a terminal on a machine containing an authorized checkout:

```bash
npm run evidence:local -- --root /absolute/path/to/authorized/repo --project-id my-project --billing-provider stripe
```

This read-only command emits a `sandpaper.local-collection/v1` JSON receipt to stdout. It does not install dependencies, execute source, run a build, call a network service, write files, or read environment values. The root is explicit and absolute; symlinked roots, symlinked entries, nonregular entries, unsafe paths, and exceeded traversal, depth, file, or package byte limits fail collection. Common generated directories and sensitive filenames are excluded. Only root `package.json` scripts and dependency metadata are parsed, under a byte limit; the receipt includes the hash of the exact package bytes parsed, never package content or source excerpts. The collector does not read source files or `.env` files.

The separate local receipt records a root fingerprint, file count, skipped counts, package hash, manifest fingerprint, and conservative gate results. The root path is not printed. Coverage remains **partial** because generated and sensitive entries are excluded; no absence-dependent check is promoted to pass. The receipt explicitly states `runtimeVerification: not_performed`. Browser manifest receipts retain their `sandpaper.evidence/v2` contract and cannot be mistaken for this local provenance. The underlying path listing and JSON observations are static, not proof that a build runs, Stripe verification works, or a repository is safe. Filesystem races and hostile concurrently mutating checkouts require a stronger sandboxed collection protocol in a future version.

## Evidence Receipts

Manifest scans also produce a `sandpaper.evidence/v2` receipt for four narrow checks:

- production build command;
- single package-manager lockfile;
- Stripe webhook signature marker inspection;
- single route-family ownership.

Receipts contain structured assertions and paths, never raw content previews or secret values. Pasted and manually supplied path lists are always treated as partial, even if the input declares complete coverage. Absence-based lockfile and router checks therefore remain `unknown` unless the supplied paths directly disclose a conflict. A Stripe signature marker is only a heuristic observation and never yields `pass`.

`compareEvidenceScans` compares compatible receipts from the same project and labels outcomes as changes in declared manifest observations. It rejects different contract, engine, rule-set, or gate-set versions. The scan fingerprint includes the rule-set version and gate-relevant project configuration.

## Categories

- Product Readiness
- Auth Readiness
- Billing Readiness
- Database Readiness
- Security Readiness
- AI Readiness
- Deployment Readiness
- Observability Readiness
- Legal/Trust Readiness
- Customer Success Readiness

## Rule Shape

Each rule includes:

- `id`
- `category`
- `title`
- `severity`
- `description`
- `detect`
- `recommendedFix`
- `builderPromptHint`

## Roadmap

Future work may add real repo ingestion, richer static analysis, framework-specific rule packs, and scan persistence. Those are not implemented in the current demo.
