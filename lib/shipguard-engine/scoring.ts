import { scanCategories, getCategoryName } from "@/lib/shipguard-engine/categories";
import { severityPenalty } from "@/lib/shipguard-engine/severity";
import type { CategoryScore, EngineIssue } from "@/lib/shipguard-engine/types";

export function scoreCategories(issues: EngineIssue[]): CategoryScore[] {
  return scanCategories.map((category) => {
    const categoryIssues = issues.filter((issue) => issue.category === category.id);
    const penalty = categoryIssues.reduce(
      (total, issue) => total + severityPenalty[issue.severity],
      0,
    );
    const score = Math.max(0, 100 - penalty);
    const blockers = categoryIssues
      .filter((issue) => issue.severity === "critical" || issue.severity === "high")
      .map((issue) => issue.title);

    return {
      categoryName: getCategoryName(category.id),
      score,
      status: score >= 85 ? "pass" : score >= 60 ? "warning" : "fail",
      summary:
        categoryIssues.length === 0
          ? `${getCategoryName(category.id)} has no likely gaps from v1 path/content heuristics.`
          : `${categoryIssues.length} likely readiness gap${
              categoryIssues.length === 1 ? "" : "s"
            } found.`,
      blockers,
    };
  });
}

export function scoreOverall(categoryScores: CategoryScore[]) {
  if (categoryScores.length === 0) return 0;

  return Math.round(
    categoryScores.reduce((total, category) => total + category.score, 0) /
      categoryScores.length,
  );
}
