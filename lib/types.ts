export type BuilderTarget =
  | "cursor"
  | "lovable"
  | "claude_code"
  | "replit"
  | "bolt"
  | "windsurf"
  | "generic";

export type ProjectStatus =
  | "draft"
  | "needs_scan"
  | "scanned"
  | "needs_fixes"
  | "ready"
  | "archived";

export type ScanStatus = "queued" | "running" | "completed" | "failed";

export type IssueSeverity = "critical" | "high" | "medium" | "low";

export type IssueCategory =
  | "launch_blocker"
  | "bug"
  | "duplicate_conflict"
  | "missing_feature"
  | "deployment_risk"
  | "configuration"
  | "security"
  | "ux";

export type IssueStatus = "open" | "in_progress" | "resolved" | "ignored";

export type LaunchCategoryStatus = "pass" | "warning" | "fail";

export type DuplicateType =
  | "route_conflict"
  | "component_duplicate"
  | "config_drift"
  | "schema_overlap";

export type BugType =
  | "runtime_error"
  | "routing"
  | "state_management"
  | "validation"
  | "deployment";

export type BillingProvider = "stripe" | "paddle" | "none" | "unknown";

export type DeploymentProvider = "vercel" | "netlify" | "railway" | "render" | "unknown";

export type Project = {
  id: string;
  name: string;
  description: string;
  repoUrl: string;
  stack: string[];
  framework: string;
  database: string;
  billingProvider: BillingProvider;
  deploymentProvider: DeploymentProvider;
  aiProvider: BuilderTarget;
  status: ProjectStatus;
  launchReadinessScore: number;
  createdAt: string;
  updatedAt: string;
};

export type Scan = {
  id: string;
  projectId: string;
  status: ScanStatus;
  overallScore: number;
  createdAt: string;
  completedAt: string | null;
  summary: string;
};

export type ScanIssue = {
  id: string;
  scanId: string;
  projectId: string;
  title: string;
  description: string;
  category: IssueCategory;
  severity: IssueSeverity;
  filePath: string;
  whyItMatters: string;
  recommendedFix: string;
  builderPromptAvailable: boolean;
  status: IssueStatus;
};

export type BugFinding = {
  id: string;
  scanId: string;
  projectId: string;
  title: string;
  filePath: string;
  bugType: BugType;
  severity: IssueSeverity;
  evidence: string;
  recommendedFix: string;
  successCriteria: string;
};

export type DuplicateGroup = {
  id: string;
  scanId: string;
  projectId: string;
  title: string;
  duplicateType: DuplicateType;
  severity: IssueSeverity;
  files: string[];
  canonicalRecommendation: string;
  conflictRisk: string;
  recommendedAction: string;
};

export type LaunchReadinessCategory = {
  id: string;
  scanId: string;
  name: string;
  score: number;
  status: LaunchCategoryStatus;
  summary: string;
  blockers: string[];
};

export type PromptPack = {
  id: string;
  projectId: string;
  issueId: string;
  targetTool: BuilderTarget;
  title: string;
  prompt: string;
  successCriteria: string[];
  filesToInspect: string[];
  createdAt: string;
};

export type Report = {
  id: string;
  projectId: string;
  scanId: string;
  type: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};
