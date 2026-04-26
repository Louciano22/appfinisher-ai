import { duplicateTypeLabels } from "@/lib/mock/duplicate-finder";
import type { EngineDuplicateGroup } from "@/lib/shipguard-engine/types";

function listItems(items: string[] | undefined, fallback: string) {
  if (!items || items.length === 0) return `- ${fallback}`;

  return items.map((item) => `- ${item}`).join("\n");
}

export function generateDuplicateResolutionPrompt(group: EngineDuplicateGroup) {
  return `You are resolving duplicate/conflicting files in an AI-built SaaS app.

Agent Rules:
1. Think before coding
   - Inspect before editing.
   - Surface ambiguity.
   - Never silently assume.
2. Simplicity first
   - Use the minimum code needed to resolve the duplicate/conflict.
   - Do not introduce new architecture unless required.
3. Surgical changes
   - Only touch files directly involved in this duplicate/conflict.
   - Do not refactor unrelated files.
4. Goal-driven execution
   - Define success criteria upfront.
   - Verify it worked, then stop.

Context:
- Duplicate/conflict: ${group.title}
- Severity: ${group.severity}
- Target builder: ${group.promptTarget}

Files to inspect:
${listItems(group.files, "No files listed")}

Duplicate/conflict type:
${duplicateTypeLabels[group.duplicateType]}

Goal:
Resolve the duplicate/conflict while preserving working behavior and minimizing code churn.

Constraints:
- Inspect all listed files before editing.
- Identify the canonical file before changing code.
- Merge only useful logic into the canonical file.
- Do not delete files until build/typecheck passes.
- Do not refactor unrelated files.
- Preserve existing imports when possible.
- Update references only if consolidation requires it.
- Do not perform broad automatic import rewrites across the repo.

Canonical recommendation:
${group.canonicalRecommendation}

Files to merge:
${listItems(group.filesToMerge, "Only inspect; no merge candidate specified")}

Files to remove/archive after verification:
${listItems(group.filesToArchive, "Do not archive anything unless a redundant file is confirmed")}

Conflict risk:
${group.conflictRisk}

Recommended action:
${group.recommendedAction}

Success criteria:
- One canonical implementation owns this behavior.
- Useful logic from duplicate files is preserved if needed.
- References still point to a working file or route.
- Redundant files are archived or left clearly unused only after verification.
- No unrelated files are refactored.

Verification steps:
1. Inspect all listed files and choose the canonical file.
2. Merge only necessary logic into the canonical file.
3. Update direct references if consolidation requires it.
4. Run build/typecheck and lint if available.
5. Only then remove or archive redundant files.
6. Stop after this duplicate/conflict is resolved.`;
}
