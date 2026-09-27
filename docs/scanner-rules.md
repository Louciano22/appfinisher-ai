# Scanner Rules

## Current Engine

Sandpaper Engine v1 lives in the legacy-compatible `lib/shipguard-engine` module.

It uses deterministic heuristics only:

- File path presence.
- File name patterns.
- Route/path naming.
- `contentPreview` substring checks.
- Common config file presence.

It does not parse real repositories, walk the filesystem, parse ASTs, or call external services.

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
