import type { BugFinding, DuplicateGroup, LaunchReadinessCategory, Project, Scan, ScanIssue } from "@/lib/types";

export type ReportType =
  | "launch_readiness"
  | "bug_report"
  | "duplicate_conflict"
  | "security_risk"
  | "billing_readiness"
  | "ai_readiness"
  | "final_launch_checklist";

export type GeneratedReport = {
  id: string;
  projectId: string;
  scanId: string;
  reportType: ReportType;
  title: string;
  markdown: string;
  summary: string;
  score?: number;
  generatedAt: string;
};

export type ReportScanInput = {
  project: Project;
  scan: Scan;
  issues: ScanIssue[];
  bugFindings: BugFinding[];
  duplicateGroups: DuplicateGroup[];
  categoryScores: LaunchReadinessCategory[];
};

export type ScanComparison = {
  previousScanId: string;
  currentScanId: string;
  previousScore: number;
  currentScore: number;
  resolvedIssues: string[];
  unresolvedIssues: string[];
  newIssues: string[];
  recommendedNextFix: string;
  executiveSummary: string;
};
