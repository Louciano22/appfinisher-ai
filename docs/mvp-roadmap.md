# MVP Roadmap

## Current Demo

- Marketing landing page.
- Mock app shell and dashboard.
- Deterministic ShipGuard Engine v1.
- Mock Bug Finder.
- Mock Duplicate Finder.
- Deterministic PromptPack generation.
- Launch Plan generator.
- Local project intake with manual setup, pasted file trees, and manifest JSON.
- Guarded launch-plan previews from path-level scans.
- Launch OS vision page for readiness, fixes, prompts, risk analysis, and final launch verification.
- Markdown Reports and mock re-scan verification.
- Supabase SQL scaffold.

## Next Practical Steps

1. Add project persistence with Supabase.
2. Add auth for user-owned projects.
3. Persist local intake projects and their generated prompt packs.
4. Persist scan results.
5. Expand ShipGuard rules for common Next.js/Supabase/Stripe patterns.
6. Add GitHub import after local/paste flows are stable.
7. Add Stripe billing after the free scan workflow is useful.

## Later

- Real repository ingestion.
- AST-aware checks.
- Team workspaces.
- Prompt history.
- Auto-fix/PR workflows.
- PDF/docx exports.

## Scope Guard

The product should stay focused on launch completion: identify detected risks,
explain why they matter, generate focused prompts, and verify progress without
implying guaranteed bug-free output.
