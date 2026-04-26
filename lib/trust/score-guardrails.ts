import type { LaunchPlanItem, LaunchStatus } from "@/lib/launch-plan";
import type { GuardrailResult } from "@/lib/trust/types";

function statusForScore(score: number): LaunchStatus {
  if (score < 60) return "Not Ready";
  if (score < 80) return "Needs Work";
  if (score < 90) return "Almost Ready";
  return "Launch Ready";
}

function hasCategory(items: LaunchPlanItem[], patterns: string[]) {
  return items.some((item) => {
    const text = `${item.title} ${item.category} ${item.phase}`.toLowerCase();
    return patterns.some((pattern) => text.includes(pattern));
  });
}

export function applyLaunchScoreGuardrails(
  score: number,
  requiredBeforeLaunch: LaunchPlanItem[],
): GuardrailResult {
  let guardedScore = Math.max(0, Math.min(100, score));
  const notes: string[] = [];
  const criticalBlockers = requiredBeforeLaunch.filter((item) => item.severity === "critical");

  if (criticalBlockers.length > 0 && guardedScore > 79) {
    guardedScore = 79;
    notes.push("Score capped below Almost Ready because critical blockers are still present.");
  }

  if (
    hasCategory(requiredBeforeLaunch, ["auth", "billing", "deploy", "database", "rls"]) &&
    guardedScore > 89
  ) {
    guardedScore = 89;
    notes.push("Score capped below Launch Ready because core launch systems still need review.");
  }

  if (hasCategory(requiredBeforeLaunch, ["privacy", "terms", "legal"]) && guardedScore > 89) {
    guardedScore = 89;
    notes.push("Score capped below Launch Ready because legal/trust pages appear incomplete.");
  }

  return {
    guardedScore,
    guardedStatus: statusForScore(guardedScore),
    notes,
  };
}
