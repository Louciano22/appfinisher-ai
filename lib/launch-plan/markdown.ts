import type { LaunchPlan, LaunchPlanItem } from "@/lib/launch-plan/types";

function listItems(items: LaunchPlanItem[]) {
  if (items.length === 0) return "- None";

  return items
    .map(
      (item) =>
        `- **${item.title}** (${item.severity}, ${item.category})\n  - Why it matters: ${item.whyItMatters}\n  - Recommended fix: ${item.recommendedFix}`,
    )
    .join("\n");
}

export function generateLaunchPlanMarkdown(plan: LaunchPlan) {
  return `# ${plan.appName} Launch Plan

Generated: ${new Date(plan.generatedAt).toLocaleString()}

## Launch Score

${plan.appName} is **${plan.launchScore}% launch-ready**.

Launch status: **${plan.launchStatus}**

## Required Before Launch

${listItems(plan.requiredBeforeLaunch)}

## Recommended Before Paid Launch

${listItems(plan.recommendedBeforePaidLaunch)}

## Optional After Launch

${listItems(plan.optionalAfterLaunch)}

## Fix Order

${plan.fixOrderPhases
  .map(
    (phase) => `### ${phase.phase}

${phase.items.length === 0 ? "- No active blockers in this phase." : listItems(phase.items)}`,
  )
  .join("\n\n")}

## Prompt Pack List

${plan.promptPackRecommendations
  .map(
    (recommendation) =>
      `- ${recommendation.phase}: Cursor, Lovable, Claude Code prompts available for ${recommendation.itemIds.length} item${recommendation.itemIds.length === 1 ? "" : "s"}.`,
  )
  .join("\n")}

## Final Smoke Test Checklist

${plan.finalSmokeTestChecklist.map((item) => `- [ ] ${item}`).join("\n")}
`;
}
