# AppFinisher AI

AppFinisher AI is a launch-completion system for unfinished AI-built SaaS apps.
It helps founders and AI-builder users identify launch blockers, prioritize fixes,
and generate builder-ready prompts for tools like Cursor, Lovable, Claude Code,
Replit, Bolt, and Windsurf.

This repository is currently a deterministic demo product, not a live production
scanner. It does not yet connect to GitHub, Supabase, Stripe, or external AI
providers. It proves the workflow: scan, diagnose, generate fix prompts, apply
fixes, re-scan, and verify progress.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Mock ShipGuard Engine
- Deterministic PromptPack generator
- Supabase SQL scaffold only

## Run Locally

```bash
npm run dev
```

Open `http://localhost:3000`.

Use the app commands from the project directory:

```bash
cd appfinisher-ai
npm run lint
npm run build
```

## Implemented Demo Routes

- `/` public landing page
- `/dashboard` mock launch dashboard
- `/projects` and `/projects/[id]`
- `/new-project` local intake wizard for manual setup, pasted file trees, and manifest JSON
- `/scan` deterministic mock scan runner
- `/bug-finder`
- `/duplicate-finder`
- `/launch-plan`
- `/launch-os`
- `/prompt-packs`
- `/reports`
- `/settings`

## Current Scope

Implemented:

- App shell, dashboard, and marketing landing page
- Mock project model and scan data
- ShipGuard Engine v1 with deterministic file-tree heuristics
- Bug Finder and Duplicate Finder mock workflows
- PromptPack template generator
- Launch Plan generator
- Launch OS vision page where readiness, fixes, prompts, risk analysis, and final launch verification come together
- Local project intake with path-level scanning, guarded launch-plan preview, and prompt packs for all findings
- Markdown Reports and mock re-scan verification loop
- Supabase schema/RLS/function SQL scaffold

Checks currently cover product readiness, auth/onboarding, billing/Stripe,
database/RLS safety, security risks, AI route cost controls, deployment readiness,
observability, legal/trust pages, customer success readiness, duplicate/conflicting
files, bug-prone generated code patterns, missing env vars, and support/onboarding
gaps.

Not implemented yet:

- Real repository ingestion
- GitHub OAuth/integration
- ZIP upload parsing
- Live Supabase connection
- Auth
- Stripe billing
- LLM-based prompt generation
- Auto-fix or PR generation
- Real scan history backend

## Docs

- `docs/product-spec.md`
- `docs/scanner-rules.md`
- `docs/promptpack-system.md`
- `docs/launch-readiness-model.md`
- `docs/mvp-roadmap.md`
- `docs/agent-principles.md`
