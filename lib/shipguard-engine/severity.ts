import type { IssueSeverity } from "@/lib/types";

export const severityPenalty: Record<IssueSeverity, number> = {
  critical: 24,
  high: 16,
  medium: 9,
  low: 5,
};

export const severityRank: Record<IssueSeverity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export function sortBySeverity<T extends { severity: IssueSeverity }>(items: T[]) {
  return [...items].sort((a, b) => severityRank[b.severity] - severityRank[a.severity]);
}
