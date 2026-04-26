# Scanner Rules

## Current Engine

ShipGuard Engine v1 lives in `lib/shipguard-engine`.

It uses deterministic heuristics only:

- File path presence.
- File name patterns.
- Route/path naming.
- `contentPreview` substring checks.
- Common config file presence.

It does not parse real repositories, walk the filesystem, parse ASTs, or call external services.

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
