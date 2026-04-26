# Launch Readiness Model

## Current Model

Launch readiness is currently deterministic and mock-backed, with local path-level scans available from the New Project flow.

The app combines:

- Mock scan issues.
- Mock bug findings.
- Mock duplicate/conflict groups.
- Mock category scores.
- Local `ScanResult` data adapted from pasted file trees or manifest JSON.
- Default launch requirements.

## Status Bands

- `Not Ready`: below 60
- `Needs Work`: 60-79
- `Almost Ready`: 80-89
- `Launch Ready`: 90+

## Launch Plan Buckets

- Required Before Launch
- Recommended Before Paid Launch
- Optional After Launch

## Guardrails

Raw scan scores are capped before launch status is shown when critical blockers,
core launch-system risks, or legal/trust gaps are still present. This prevents a
scan from displaying `Launch Ready` while required pre-launch work remains open.

## Fix Order Phases

1. Build/deploy blockers
2. Auth/onboarding
3. Billing/subscription access
4. Database/RLS
5. AI usage/cost protection
6. Legal/trust
7. Customer success
8. Observability
9. Final smoke test

## Reports

Reports are generated as markdown from mock scan data. PDF/docx export and real scan history are future work.

## Launch OS

The Launch OS page presents the readiness model as a command center: timeline,
risk heatmap, fix order, prompt bundles, specialist auditors, final launch gates,
and a score badge. It is the premium command-center vision for AppFinisher AI.
It is deterministic today and designed to be wired to real scan history later.
