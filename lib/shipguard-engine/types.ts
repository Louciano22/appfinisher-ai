import type {
  BillingProvider,
  BuilderTarget,
  DeploymentProvider,
  IssueSeverity,
  LaunchCategoryStatus,
} from "@/lib/types";

export type FileTree = {
  path: string;
  type: "file" | "directory";
  contentPreview?: string;
  children?: FileTree[];
};

export type ProjectConfig = {
  projectId: string;
  name: string;
  stack?: string[];
  framework?: string;
  database?: string;
  billingProvider?: BillingProvider;
  deploymentProvider?: DeploymentProvider;
  aiProvider?: BuilderTarget;
};

export type FileManifest = {
  files: string[];
  contentPreviews?: Record<string, string>;
  packageJson?: {
    scripts?: Record<string, string>;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  envExample?: string;
  frameworkHints?: string[];
  routeList?: string[];
};

export type DetectedStack = {
  framework?: string;
  database?: string;
  billingProvider?: BillingProvider;
  deploymentProvider?: DeploymentProvider;
  aiProvider?: BuilderTarget;
  confidenceNotes: string[];
};

export type FileTreeParseResult = {
  manifest: FileManifest;
  errors: string[];
};

export type ShipGuardCategory =
  | "product_readiness"
  | "auth_readiness"
  | "billing_readiness"
  | "database_readiness"
  | "security_readiness"
  | "ai_readiness"
  | "deployment_readiness"
  | "observability_readiness"
  | "legal_trust_readiness"
  | "customer_success_readiness";

export type RuleDetectionContext = {
  files: FileTree[];
  projectConfig: ProjectConfig;
  hasPath: (matcher: string | RegExp) => boolean;
  hasContent: (matcher: string | RegExp) => boolean;
  findPaths: (matcher: string | RegExp) => string[];
};

export type ShipGuardRule = {
  id: string;
  category: ShipGuardCategory;
  title: string;
  severity: IssueSeverity;
  description: string;
  detect: (context: RuleDetectionContext) => boolean;
  recommendedFix: string;
  builderPromptHint: string;
  passWhen?: "detected" | "not_detected";
};

export type CategoryScore = {
  categoryName: string;
  score: number;
  status: LaunchCategoryStatus;
  summary: string;
  blockers: string[];
};

export type EngineIssue = {
  id: string;
  ruleId: string;
  category: ShipGuardCategory;
  title: string;
  description: string;
  severity: IssueSeverity;
  recommendedFix: string;
  builderPromptHint: string;
};

export type EngineBugFinding = {
  id: string;
  title: string;
  filePath: string;
  bugType: BugFindingType;
  severity: IssueSeverity;
  evidence: string;
  whyItMatters: string;
  recommendedFix: string;
  successCriteria: string;
  promptTarget: "Cursor";
};

export type BugFindingType =
  | "broken_imports"
  | "missing_exports"
  | "duplicate_route_handlers"
  | "missing_env_var_usage"
  | "env_var_referenced_not_documented"
  | "stripe_webhook_without_signature_verification"
  | "stripe_checkout_without_user_customer_mapping"
  | "supabase_service_role_used_in_client_code"
  | "supabase_rls_mismatch_risk"
  | "middleware_edge_runtime_risk"
  | "api_route_missing_auth_check"
  | "ai_route_missing_rate_limit"
  | "ai_route_missing_usage_tracking"
  | "missing_await_on_async_calls"
  | "wrong_redirect_urls"
  | "public_admin_route"
  | "missing_error_handling"
  | "missing_try_catch_critical_api_route"
  | "webhook_not_idempotent"
  | "typescript_config_risk"
  | "package_script_missing_build"
  | "conflicting_package_managers";

export type EngineDuplicateGroup = {
  id: string;
  title: string;
  duplicateType: DuplicateConflictType;
  severity: IssueSeverity;
  files: string[];
  canonicalRecommendation: string;
  conflictRisk: string;
  recommendedAction: string;
  filesToMerge?: string[];
  filesToArchive?: string[];
  promptTarget: "Cursor";
};

export type DuplicateConflictType =
  | "duplicate_supabase_clients"
  | "duplicate_stripe_clients"
  | "duplicate_chatbot_routes"
  | "duplicate_auth_helpers"
  | "duplicate_pricing_components"
  | "duplicate_dashboard_pages"
  | "conflicting_package_managers"
  | "conflicting_router_structures"
  | "duplicate_environment_examples"
  | "duplicate_type_definitions";

export type ScanResult = {
  scanId: string;
  projectId: string;
  status: "completed";
  overallScore: number;
  categoryScores: CategoryScore[];
  summary: string;
  issues: EngineIssue[];
  bugFindings: EngineBugFinding[];
  duplicateGroups: EngineDuplicateGroup[];
  criticalBlockers: EngineIssue[];
  recommendedNextFixes: string[];
  createdAt: string;
};
