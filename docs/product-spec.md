# Product Spec

## Product Promise

Sandpaper is application completion and release readiness for AI-built software.
It helps founders and AI-builder users identify launch blockers, prioritize fixes,
and generate builder-ready prompts for tools like Cursor, Lovable, Claude Code,
Replit, Bolt, and Windsurf.

The current product is a deterministic demo, not a live production scanner. It
proves the workflow: scan, diagnose, generate fix prompts, apply fixes, re-scan,
and verify progress.

## Current MVP Behavior

- Public landing page with pricing-ready UI.
- Mock dashboard backed by deterministic project and scan data.
- Sandpaper Engine v1 scans a deterministic mock `FileTree` and local user-provided file manifests.
- Bug Finder and Duplicate Finder use curated mock findings.
- New Project supports manual setup, pasted file trees, and manifest JSON for path-level scan previews.
- PromptPack generates prompts from structured data and templates only, including all findings from a local project scan.
- Launch Plan converts mock or local scan data into a guarded roadmap.
- Launch OS is the premium command-center vision for Sandpaper, where readiness, fixes, prompts, risk analysis, and final launch verification come together in one place.
- Reports generate copyable/downloadable markdown from mock scan data.

## Current Check Areas

- Product readiness.
- Auth/onboarding.
- Billing/Stripe.
- Database/RLS safety.
- Security risks.
- AI route cost and rate-limit risks.
- Deployment readiness.
- Observability.
- Legal/trust pages.
- Customer success readiness.
- Duplicate/conflicting files.
- Bug-prone generated code patterns.
- Missing env vars and support/onboarding gaps.

## Not Implemented Yet

- Real repo ingestion.
- GitHub integration.
- ZIP upload parsing.
- Live Supabase reads/writes.
- Auth and billing.
- LLM-based prompt generation.
- Auto-fix agents or PR generation.

## Primary Users

- Solo founders.
- Vibe coders.
- Cursor/Lovable/Replit users.
- Agencies and SaaS builders using AI tools.
