import type { ConsistencyInput, ConsistencyIssue } from "@/lib/trust/types";

export function validateOutputConsistency(input: ConsistencyInput): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = [];
  const scanCriticalCount = input.scanResult?.criticalBlockers.length ?? 0;
  const requiredCount = input.launchPlan?.requiredBeforeLaunch.length ?? 0;

  if (input.scanResult && input.scanResult.overallScore >= 90 && scanCriticalCount > 0) {
    issues.push({
      id: "score-critical-contradiction",
      severity: "error",
      message: "Scan score is too high while critical blockers are still present.",
    });
  }

  if (input.launchPlan?.launchStatus === "Launch Ready" && requiredCount > 0) {
    issues.push({
      id: "launch-ready-required-items",
      severity: "error",
      message: "Launch Ready status cannot be shown while Required Before Launch items exist.",
    });
  }

  if (
    typeof input.bugCount === "number" &&
    input.scanResult &&
    input.bugCount !== input.scanResult.bugFindings.length
  ) {
    issues.push({
      id: "bug-count-mismatch",
      severity: "warning",
      message: "Bug count does not match the rendered bug finding list.",
    });
  }

  if (
    typeof input.duplicateGroupCount === "number" &&
    input.scanResult &&
    input.duplicateGroupCount !== input.scanResult.duplicateGroups.length
  ) {
    issues.push({
      id: "duplicate-count-mismatch",
      severity: "warning",
      message: "Duplicate group count does not match the rendered duplicate group list.",
    });
  }

  if (input.launchPlan && input.promptRecommendationItemIds) {
    const knownItemIds = new Set(
      input.launchPlan.fixOrderPhases.flatMap((phase) => phase.items.map((item) => item.id)),
    );
    const missing = input.promptRecommendationItemIds.filter((id) => !knownItemIds.has(id));

    if (missing.length > 0) {
      issues.push({
        id: "prompt-recommendation-missing-item",
        severity: "warning",
        message: "Prompt pack recommendations reference items not present in the current launch plan.",
      });
    }
  }

  return issues;
}
