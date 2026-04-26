import type { LaunchPlanItem, LaunchPlanPhase } from "@/lib/launch-plan";
import type { NextFixInput } from "@/lib/trust/types";

const severityRank = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const phaseRank: Record<LaunchPlanPhase, number> = {
  "Phase 1: Build/deploy blockers": 9,
  "Phase 2: Auth/onboarding": 8,
  "Phase 3: Billing/subscription access": 7,
  "Phase 4: Database/RLS": 6,
  "Phase 5: AI usage/cost protection": 5,
  "Phase 6: Legal/trust": 4,
  "Phase 7: Customer success": 3,
  "Phase 8: Observability": 2,
  "Phase 9: Final smoke test": 1,
};

function scoreItem(item: LaunchPlanItem) {
  const promptBonus = item.promptTargets.length > 0 ? 1 : 0;
  const blockerBonus = item.severity === "critical" ? 3 : 0;

  return severityRank[item.severity] * 100 + phaseRank[item.phase] * 10 + promptBonus + blockerBonus;
}

export function selectNextRecommendedFix(input: NextFixInput): LaunchPlanItem | null {
  if (input.items.length === 0) return null;

  return [...input.items].sort((a, b) => scoreItem(b) - scoreItem(a))[0];
}
