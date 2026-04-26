# PromptPack System

PromptPack lives in `lib/promptpack`.

## Current Behavior

PromptPack generates copy-ready markdown/plain-text prompts from structured issue data and deterministic templates.

It does not call LLMs or external AI providers.

The New Project flow can generate prompt packs for every finding from a local
path-level scan: scan issues, bug findings, and duplicate/conflict groups.

## Supported Prompt Types

- Bug fix
- Duplicate/conflict resolution
- Launch readiness fix
- Stripe billing fix
- Supabase RLS fix
- Auth/onboarding fix
- AI route/rate limit fix
- Deployment/Vercel fix
- Legal/trust page creation
- Customer onboarding improvement

## Target Tools

- Cursor
- Lovable
- Claude Code
- Replit
- Bolt
- Windsurf
- Generic AI Builder

## Prompt Sections

Generated prompts include:

- Title
- Target tool
- Context
- Agent Rules
- Tool behavior rules
- Files to inspect
- Known issue
- Goal
- Constraints
- Success criteria
- Verification steps
- Stop condition

## Roadmap

Future work may add persisted prompt packs, prompt analytics, and deeper builder integrations. The current app stores generated prompts in local UI state only.
