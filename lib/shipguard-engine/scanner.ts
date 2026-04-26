import { scoreCategories, scoreOverall } from "@/lib/shipguard-engine/scoring";
import { sortBySeverity } from "@/lib/shipguard-engine/severity";
import { shipGuardRules } from "@/lib/shipguard-engine/rules";
import type {
  EngineBugFinding,
  EngineDuplicateGroup,
  EngineIssue,
  FileTree,
  ProjectConfig,
  RuleDetectionContext,
  ScanResult,
} from "@/lib/shipguard-engine/types";

function flattenFileTree(tree: FileTree): FileTree[] {
  return [tree, ...(tree.children ?? []).flatMap((child) => flattenFileTree(child))];
}

function matches(value: string, matcher: string | RegExp) {
  return typeof matcher === "string" ? value.includes(matcher) : matcher.test(value);
}

function createContext(fileTree: FileTree, projectConfig: ProjectConfig): RuleDetectionContext {
  const files = flattenFileTree(fileTree);

  return {
    files,
    projectConfig,
    hasPath: (matcher) => files.some((file) => matches(file.path, matcher)),
    hasContent: (matcher) =>
      files.some((file) => file.contentPreview && matches(file.contentPreview, matcher)),
    findPaths: (matcher) => files.filter((file) => matches(file.path, matcher)).map((file) => file.path),
  };
}

function scanRules(context: RuleDetectionContext): EngineIssue[] {
  return shipGuardRules.flatMap((rule) => {
    const detected = rule.detect(context);
    const passed = rule.passWhen === "not_detected" ? !detected : detected;

    if (passed) return [];

    return [
      {
        id: `issue-${rule.id}`,
        ruleId: rule.id,
        category: rule.category,
        title: rule.title,
        description: rule.description,
        severity: rule.severity,
        recommendedFix: rule.recommendedFix,
        builderPromptHint: rule.builderPromptHint,
      },
    ];
  });
}

function detectBugFindings(context: RuleDetectionContext): EngineBugFinding[] {
  const findings: EngineBugFinding[] = [];

  if (context.hasContent(/profile\.name|user\.name/) && !context.hasContent(/loading|optional|profile\?/i)) {
    findings.push({
      id: "bug-null-user-profile",
      title: "User profile fields may render before data is loaded",
      filePath: context.findPaths(/settings|profile/)[0] ?? "app/settings/page.tsx",
      bugType: "missing_error_handling",
      severity: "high",
      evidence: "contentPreview references profile.name or user.name without a visible loading/empty-state guard.",
      whyItMatters: "A missing data guard can crash launch-facing account settings for new users.",
      recommendedFix: "Add explicit loading and empty states before rendering profile fields.",
      successCriteria: "The page renders safely when profile data is missing.",
      promptTarget: "Cursor",
    });
  }

  if (context.hasContent(/TODO BUG|FIXME|throw new Error/)) {
    findings.push({
      id: "bug-explicit-marker",
      title: "Generated code still contains explicit bug markers",
      filePath: context.findPaths(/page|component|route/)[0] ?? "app",
      bugType: "missing_error_handling",
      severity: "medium",
      evidence: "contentPreview includes TODO BUG, FIXME, or throw new Error.",
      whyItMatters: "Generated bug markers usually mean an unfinished path can still reach production.",
      recommendedFix: "Resolve or remove generated bug markers before launch.",
      successCriteria: "No launch-facing files include unresolved bug markers.",
      promptTarget: "Cursor",
    });
  }

  if (context.hasPath(/checkout|billing/) && !context.hasContent(/success|cancel|portal/i)) {
    findings.push({
      id: "bug-checkout-state",
      title: "Billing flow lacks success or cancellation states",
      filePath: context.findPaths(/checkout|billing/)[0] ?? "app/billing/page.tsx",
      bugType: "stripe_checkout_without_user_customer_mapping",
      severity: "medium",
      evidence: "Billing paths exist, but contentPreview does not show success, cancel, or portal handling.",
      whyItMatters: "Users may complete billing and land in an ambiguous or untracked state.",
      recommendedFix: "Add mocked success, cancellation, and management states.",
      successCriteria: "Users can understand what happens after checkout or cancellation.",
      promptTarget: "Cursor",
    });
  }

  return findings;
}

function detectDuplicateGroups(context: RuleDetectionContext): EngineDuplicateGroup[] {
  const groups: EngineDuplicateGroup[] = [];
  const appDashboard = context.findPaths(/^app\/dashboard\/page\.tsx$/);
  const pagesDashboard = context.findPaths(/^pages\/dashboard\.(tsx|ts|jsx|js)$/);
  const appLogin = context.findPaths(/app\/.*(login|sign-in).*page\.tsx$/);
  const pagesLogin = context.findPaths(/pages\/(login|sign-in)\.(tsx|ts|jsx|js)$/);
  const envFiles = context.findPaths(/(^|\/)(\.env\.example|env\.example|\.env\.local\.example|env\.md)$/);
  const supabaseClients = context.findPaths(/(^|\/)(lib|utils)\/.*supabase.*\.ts$/);
  const stripeClients = context.findPaths(/(^|\/)(lib|utils)\/.*stripe.*\.ts$/);
  const chatRoutes = context.findPaths(/app\/api\/(ai\/chat|chat|chatbot)\/route\.ts$/);
  const authHelpers = context.findPaths(/(^|\/)(lib|utils)\/.*auth.*\.ts$/);
  const pricingComponents = context.findPaths(/(components\/Pricing|components\/PricingTable|app\/pricing\/PricingClient)\.tsx$/);
  const dashboardPages = context.findPaths(/app\/(\(dashboard\)\/)?dashboard\/page\.tsx$/);
  const lockfiles = context.findPaths(/^(package-lock\.json|yarn\.lock|pnpm-lock\.yaml)$/);
  const appRouterFiles = context.findPaths(/^app\//);
  const pagesRouterFiles = context.findPaths(/^pages\//);
  const typeDefinitions = context.findPaths(/(types\/database|lib\/database\.types|types\/supabase)\.ts$/);

  if (supabaseClients.length > 1) {
    groups.push({
      id: "dup-supabase-clients",
      title: "Duplicate Supabase clients",
      duplicateType: "duplicate_supabase_clients",
      severity: "critical",
      files: supabaseClients,
      canonicalRecommendation: "Keep one browser Supabase client and separate server-only privileged clients.",
      conflictRisk: "Multiple Supabase clients can mix session behavior, anon keys, and service-role assumptions.",
      recommendedAction: "Inspect clients, merge useful typed helpers, and archive redundant client factories after build passes.",
      filesToMerge: supabaseClients.slice(1),
      filesToArchive: supabaseClients.slice(1),
      promptTarget: "Cursor",
    });
  }

  if (stripeClients.length > 1) {
    groups.push({
      id: "dup-stripe-clients",
      title: "Duplicate Stripe clients",
      duplicateType: "duplicate_stripe_clients",
      severity: "high",
      files: stripeClients,
      canonicalRecommendation: "Keep one server-only Stripe helper.",
      conflictRisk: "Duplicate Stripe helpers can use different API versions, env names, and webhook assumptions.",
      recommendedAction: "Merge useful billing helpers into the canonical server-only Stripe module.",
      filesToMerge: stripeClients.slice(1),
      filesToArchive: stripeClients.slice(1),
      promptTarget: "Cursor",
    });
  }

  if (chatRoutes.length > 1) {
    groups.push({
      id: "dup-chatbot-routes",
      title: "Duplicate chatbot routes",
      duplicateType: "duplicate_chatbot_routes",
      severity: "high",
      files: chatRoutes,
      canonicalRecommendation: "Use one AI chat route that owns auth, rate limits, and usage tracking.",
      conflictRisk: "Duplicate chat routes can bypass rate limits or use conflicting request shapes.",
      recommendedAction: "Choose a canonical route, merge useful logic, update direct references, and archive duplicates after verification.",
      filesToMerge: chatRoutes.slice(1),
      filesToArchive: chatRoutes.slice(1),
      promptTarget: "Cursor",
    });
  }

  if (authHelpers.length > 1) {
    groups.push({
      id: "dup-auth-helpers",
      title: "Duplicate auth helpers",
      duplicateType: "duplicate_auth_helpers",
      severity: "high",
      files: authHelpers,
      canonicalRecommendation: "Keep one auth helper aligned with the active route/middleware pattern.",
      conflictRisk: "Duplicate auth helpers can disagree on session shape and protected route behavior.",
      recommendedAction: "Merge only useful helpers into the canonical auth module and update direct imports.",
      filesToMerge: authHelpers.slice(1),
      filesToArchive: authHelpers.slice(1),
      promptTarget: "Cursor",
    });
  }

  if (pricingComponents.length > 1) {
    groups.push({
      id: "dup-pricing-components",
      title: "Duplicate pricing components",
      duplicateType: "duplicate_pricing_components",
      severity: "medium",
      files: pricingComponents,
      canonicalRecommendation: "Use one route-owned pricing component as the source of truth.",
      conflictRisk: "Pricing copy, plan limits, and CTAs can drift across duplicate components.",
      recommendedAction: "Merge current plan copy into the canonical component and archive stale generated components after verification.",
      filesToMerge: pricingComponents.slice(1),
      filesToArchive: pricingComponents.slice(1),
      promptTarget: "Cursor",
    });
  }

  if (dashboardPages.length > 1) {
    groups.push({
      id: "dup-dashboard-pages",
      title: "Duplicate dashboard pages",
      duplicateType: "duplicate_dashboard_pages",
      severity: "high",
      files: dashboardPages,
      canonicalRecommendation: "Use one App Router dashboard page as canonical.",
      conflictRisk: "Duplicate dashboards can show different launch data, auth behavior, and navigation.",
      recommendedAction: "Choose the active dashboard route and archive duplicates after links are verified.",
      filesToMerge: dashboardPages.slice(1),
      filesToArchive: dashboardPages.slice(1),
      promptTarget: "Cursor",
    });
  }

  if (lockfiles.length > 1) {
    groups.push({
      id: "dup-package-managers",
      title: "Conflicting package managers",
      duplicateType: "conflicting_package_managers",
      severity: "high",
      files: lockfiles,
      canonicalRecommendation: "Keep the lockfile for the package manager actually used by the project.",
      conflictRisk: "Multiple lockfiles can produce different dependency trees locally and in deployment.",
      recommendedAction: "Confirm the intended package manager, then archive non-canonical lockfiles after install/build succeeds.",
      filesToArchive: lockfiles.filter((file) => file !== "package-lock.json"),
      promptTarget: "Cursor",
    });
  }

  if (appRouterFiles.length > 0 && pagesRouterFiles.length > 0) {
    groups.push({
      id: "dup-router-structures",
      title: "Conflicting router structures",
      duplicateType: "conflicting_router_structures",
      severity: "medium",
      files: [...appRouterFiles.slice(0, 4), ...pagesRouterFiles.slice(0, 4)],
      canonicalRecommendation: "Prefer the App Router unless the project intentionally supports legacy Pages Router.",
      conflictRisk: "Mixed router structures can confuse route ownership and duplicate user-facing pages.",
      recommendedAction: "Confirm route ownership before removing any legacy pages.",
      filesToMerge: pagesRouterFiles,
      filesToArchive: pagesRouterFiles,
      promptTarget: "Cursor",
    });
  }

  if (typeDefinitions.length > 1) {
    groups.push({
      id: "dup-type-definitions",
      title: "Duplicate type definitions",
      duplicateType: "duplicate_type_definitions",
      severity: "medium",
      files: typeDefinitions,
      canonicalRecommendation: "Use one generated database type source.",
      conflictRisk: "Duplicate database types can drift from the actual schema and break type safety.",
      recommendedAction: "Choose the generated source of truth and update direct imports.",
      filesToMerge: typeDefinitions.slice(1),
      filesToArchive: typeDefinitions.slice(1),
      promptTarget: "Cursor",
    });
  }

  if (appDashboard.length > 0 && pagesDashboard.length > 0) {
    groups.push({
      id: "dup-dashboard-route",
      title: "Competing dashboard route implementations",
      duplicateType: "conflicting_router_structures",
      severity: "high",
      files: [...appDashboard, ...pagesDashboard],
      canonicalRecommendation: "Use the App Router dashboard as the canonical implementation.",
      conflictRisk: "Two dashboard routes can drift in layout, auth checks, and launch copy.",
      recommendedAction: "Archive or remove the legacy pages dashboard after confirming links.",
      filesToMerge: pagesDashboard,
      filesToArchive: pagesDashboard,
      promptTarget: "Cursor",
    });
  }

  if (appLogin.length > 0 && pagesLogin.length > 0) {
    groups.push({
      id: "dup-auth-route",
      title: "Duplicate login route families",
      duplicateType: "duplicate_auth_helpers",
      severity: "critical",
      files: [...appLogin, ...pagesLogin],
      canonicalRecommendation: "Choose one login route family and update all navigation links.",
      conflictRisk: "Users can land in different auth flows depending on the link they click.",
      recommendedAction: "Keep the route that matches the current app shell.",
      filesToMerge: pagesLogin,
      filesToArchive: pagesLogin,
      promptTarget: "Cursor",
    });
  }

  if (envFiles.length > 1) {
    groups.push({
      id: "dup-env-docs",
      title: "Multiple environment setup sources",
      duplicateType: "duplicate_environment_examples",
      severity: "medium",
      files: envFiles,
      canonicalRecommendation: "Use .env.example as the source of truth.",
      conflictRisk: "Deployment setup can miss required keys when docs disagree.",
      recommendedAction: "Merge environment notes into one canonical example file.",
      filesToMerge: envFiles.filter((file) => file !== ".env.example"),
      filesToArchive: envFiles.filter((file) => file !== ".env.example"),
      promptTarget: "Cursor",
    });
  }

  return groups;
}

export function scanProject(fileTree: FileTree, projectConfig: ProjectConfig): ScanResult {
  const context = createContext(fileTree, projectConfig);
  const issues = scanRules(context);
  const bugFindings = detectBugFindings(context);
  const duplicateGroups = detectDuplicateGroups(context);
  const categoryScores = scoreCategories(issues);
  const overallScore = scoreOverall(categoryScores);
  const criticalBlockers = issues.filter((issue) => issue.severity === "critical");
  const recommendedNextFixes = sortBySeverity(issues)
    .slice(0, 5)
    .map((issue) => issue.recommendedFix);

  return {
    scanId: `mock-scan-${projectConfig.projectId}`,
    projectId: projectConfig.projectId,
    status: "completed",
    overallScore,
    categoryScores,
    summary:
      criticalBlockers.length > 0
        ? `${projectConfig.name} has ${criticalBlockers.length} critical blocker${
            criticalBlockers.length === 1 ? "" : "s"
          } before launch.`
        : `${projectConfig.name} has no critical blockers in the v1 mock heuristic scan.`,
    issues: sortBySeverity(issues),
    bugFindings: sortBySeverity(bugFindings),
    duplicateGroups: sortBySeverity(duplicateGroups),
    criticalBlockers: sortBySeverity(criticalBlockers),
    recommendedNextFixes,
    createdAt: "2026-04-26T18:50:00.000Z",
  };
}
