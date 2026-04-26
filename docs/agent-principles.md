# AppFinisher AI Agent Principles

These principles guide the documentation and generated prompt language for ShipGuard Engine. They are intentionally simple so builders can apply fixes in Cursor, Lovable, Claude Code, Replit, Bolt, and similar tools without creating unrelated churn.

## 1. Think Before Coding

- Inspect before editing.
- Surface ambiguity before changing files.
- Never silently assume requirements, architecture, or intent.

Prompt language should ask the builder agent to first read the relevant files, identify uncertainty, and define the smallest safe path before implementation.

## 2. Simplicity First

- Use the minimum code needed to solve the problem.
- Avoid over-engineering.
- Prefer existing project patterns over new abstractions.

Prompt language should push for practical fixes, not rewrites or speculative systems.

## 3. Surgical Changes

- Touch only what is necessary.
- Never refactor unrelated code.
- Preserve user work and avoid broad formatting churn.

Prompt language should name the exact area to change and explicitly constrain the agent from modifying unrelated systems.

## 4. Goal-Driven Execution

- Define success criteria upfront.
- Verify that the fix worked.
- Stop once the stated goal is met.

Prompt language should include a clear expected outcome and a verification step for each generated fix.
