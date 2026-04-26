import { bugTypeLabels } from "@/lib/mock/bug-finder";
import type { EngineBugFinding } from "@/lib/shipguard-engine/types";

export function generateBugFixPrompt(bug: EngineBugFinding) {
  return `You are fixing a launch-blocking bug in AppFinisher AI's target SaaS app.

Agent Rules:
1. Think before coding
   - Inspect before editing.
   - Surface ambiguity.
   - Never silently assume.
2. Simplicity first
   - Use the minimum code needed to solve this bug.
   - Do not over-engineer.
3. Surgical changes
   - Only touch files required for this fix.
   - Do not refactor unrelated code.
4. Goal-driven execution
   - Define success criteria upfront.
   - Verify it worked, then stop.

Context:
- Bug type: ${bugTypeLabels[bug.bugType]}
- Severity: ${bug.severity}
- Target builder: ${bug.promptTarget}

Files to inspect:
- ${bug.filePath}

Known issue:
${bug.title}

Evidence:
${bug.evidence}

Why it matters:
${bug.whyItMatters}

Goal:
${bug.recommendedFix}

Constraints:
- Do not implement unrelated features.
- Do not add live secrets or credentials.
- Do not connect new external services.
- Do not rewrite the surrounding app architecture.
- Keep the fix compatible with the existing Next.js App Router patterns.

Success criteria:
${bug.successCriteria}

Verification steps:
1. Inspect the listed files before editing.
2. Apply the smallest code change that resolves the known issue.
3. Run the existing lint/build or type-check command if available.
4. Confirm the success criteria are met.
5. Stop after the bug is fixed.`;
}
