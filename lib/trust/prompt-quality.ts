import type { PromptPackInput } from "@/lib/promptpack";
import type { NormalizedPromptInput, PromptQualityResult } from "@/lib/trust/types";

const requiredSections = [
  "## Context",
  "## Agent Rules",
  "## Files to Inspect",
  "## Known Issue",
  "## Goal",
  "## Constraints",
  "## Success Criteria",
  "## Verification Steps",
  "## Stop Condition",
];

export function normalizePromptPackInput(input: PromptPackInput): NormalizedPromptInput {
  return {
    ...input,
    filesToInspect: input.filesToInspect.length > 0 ? input.filesToInspect : ["Review current scan evidence first."],
    knownIssue:
      input.knownIssue.trim() ||
      "A likely issue was detected from the available scan evidence. Review before production.",
    goal:
      input.goal.trim() ||
      "Apply a focused recommended fix based on the current scan evidence.",
    constraints: [
      "Do not overstate certainty beyond the provided scan evidence.",
      "Treat findings as likely risks that require review before production.",
      ...(input.constraints ?? []),
    ],
    successCriteria:
      input.successCriteria.length > 0
        ? input.successCriteria
        : ["The likely issue has been reviewed and the scoped fix is verified."],
    verificationSteps:
      input.verificationSteps.length > 0
        ? input.verificationSteps
        : ["Inspect the listed files.", "Apply the smallest safe fix.", "Run build/typecheck if available."],
    recommendedContext:
      input.recommendedContext ??
      "This prompt is generated from deterministic AppFinisher scan evidence. Review findings before production.",
  };
}

export function validatePromptOutput(prompt: string): PromptQualityResult {
  const missingSections = requiredSections.filter((section) => !prompt.includes(section));
  const warnings: string[] = [];

  if (!prompt.includes("Think before coding")) warnings.push("Agent principle missing: Think before coding.");
  if (!prompt.includes("Simplicity first")) warnings.push("Agent principle missing: Simplicity first.");
  if (!prompt.includes("Surgical changes")) warnings.push("Agent principle missing: Surgical changes.");
  if (!prompt.includes("Goal-driven execution")) warnings.push("Agent principle missing: Goal-driven execution.");
  if (/\n## [^\n]+\n\s*\n## /.test(prompt)) warnings.push("Prompt appears to contain an empty section.");
  if (/guarantee|bug-free/i.test(prompt)) warnings.push("Prompt overstates certainty.");

  return {
    valid: missingSections.length === 0 && warnings.length === 0,
    missingSections,
    warnings,
  };
}
