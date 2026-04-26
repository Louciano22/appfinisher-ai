import { generateLaunchPlan } from "@/lib/launch-plan";
import type { LaunchPlan } from "@/lib/launch-plan";
import type {
  BugFinding,
  BugType,
  DuplicateGroup,
  DuplicateType,
  IssueCategory,
  LaunchReadinessCategory,
  Scan,
  ScanIssue,
} from "@/lib/types";
import type {
  BugFindingType,
  DuplicateConflictType,
  EngineIssue,
  ScanResult,
  ShipGuardCategory,
} from "@/lib/shipguard-engine/types";

function issueCategory(category: ShipGuardCategory): IssueCategory {
  if (category.includes("security")) return "security";
  if (category.includes("deployment")) return "deployment_risk";
  if (category.includes("product") || category.includes("customer")) return "missing_feature";
  if (category.includes("auth") || category.includes("billing") || category.includes("database")) {
    return "launch_blocker";
  }

  return "configuration";
}

function bugType(type: BugFindingType): BugType {
  if (type.includes("route") || type.includes("redirect") || type.includes("middleware")) {
    return "routing";
  }
  if (type.includes("env") || type.includes("package") || type.includes("typescript")) {
    return "deployment";
  }
  if (type.includes("stripe") || type.includes("supabase") || type.includes("auth")) {
    return "validation";
  }

  return "runtime_error";
}

function duplicateType(type: DuplicateConflictType): DuplicateType {
  if (type.includes("route") || type.includes("router")) return "route_conflict";
  if (type.includes("component") || type.includes("pricing") || type.includes("dashboard")) {
    return "component_duplicate";
  }
  if (type.includes("type") || type.includes("supabase")) return "schema_overlap";

  return "config_drift";
}

function scanFromResult(result: ScanResult): Scan {
  return {
    id: result.scanId,
    projectId: result.projectId,
    status: result.status,
    overallScore: result.overallScore,
    createdAt: result.createdAt,
    completedAt: result.createdAt,
    summary: result.summary,
  };
}

function issueFromEngineIssue(result: ScanResult, issue: EngineIssue): ScanIssue {
  return {
    id: issue.id,
    scanId: result.scanId,
    projectId: result.projectId,
    title: issue.title,
    description: issue.description,
    category: issueCategory(issue.category),
    severity: issue.severity,
    filePath: "",
    whyItMatters: issue.description,
    recommendedFix: issue.recommendedFix,
    builderPromptAvailable: true,
    status: "open",
  };
}

function bugFromEngineFinding(result: ScanResult, finding: ScanResult["bugFindings"][number]): BugFinding {
  return {
    id: finding.id,
    scanId: result.scanId,
    projectId: result.projectId,
    title: finding.title,
    filePath: finding.filePath,
    bugType: bugType(finding.bugType),
    severity: finding.severity,
    evidence: finding.whyItMatters || finding.evidence,
    recommendedFix: finding.recommendedFix,
    successCriteria: finding.successCriteria,
  };
}

function duplicateFromEngineGroup(result: ScanResult, group: ScanResult["duplicateGroups"][number]): DuplicateGroup {
  return {
    id: group.id,
    scanId: result.scanId,
    projectId: result.projectId,
    title: group.title,
    duplicateType: duplicateType(group.duplicateType),
    severity: group.severity,
    files: group.files,
    canonicalRecommendation: group.canonicalRecommendation,
    conflictRisk: group.conflictRisk,
    recommendedAction: group.recommendedAction,
  };
}

function categoryFromEngineScore(result: ScanResult, score: ScanResult["categoryScores"][number]): LaunchReadinessCategory {
  return {
    id: `${result.scanId}-${score.categoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    scanId: result.scanId,
    name: score.categoryName,
    score: score.score,
    status: score.status,
    summary: score.summary,
    blockers: score.blockers,
  };
}

export function generateLaunchPlanFromScanResult(appName: string, result: ScanResult): LaunchPlan {
  return generateLaunchPlan({
    appName,
    scan: scanFromResult(result),
    issues: result.issues.map((issue) => issueFromEngineIssue(result, issue)),
    bugFindings: result.bugFindings.map((finding) => bugFromEngineFinding(result, finding)),
    duplicateGroups: result.duplicateGroups.map((group) => duplicateFromEngineGroup(result, group)),
    categoryScores: result.categoryScores.map((category) => categoryFromEngineScore(result, category)),
  });
}
