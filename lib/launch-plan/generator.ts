import type { BugFinding, DuplicateGroup, ScanIssue } from "@/lib/types";
import type {
  FixOrderPhase,
  LaunchPlan,
  LaunchPlanItem,
  LaunchPlanPhase,
  LaunchPlanScanInput,
  PromptPackRecommendation,
} from "@/lib/launch-plan/types";
import {
  applyLaunchScoreGuardrails,
  generateFinalSmokeTestChecklist,
  selectNextRecommendedFix,
  validateOutputConsistency,
} from "@/lib/trust";

const phases: LaunchPlanPhase[] = [
  "Phase 1: Build/deploy blockers",
  "Phase 2: Auth/onboarding",
  "Phase 3: Billing/subscription access",
  "Phase 4: Database/RLS",
  "Phase 5: AI usage/cost protection",
  "Phase 6: Legal/trust",
  "Phase 7: Customer success",
  "Phase 8: Observability",
  "Phase 9: Final smoke test",
];

const defaultRequiredItems: LaunchPlanItem[] = [
  {
    id: "required-auth",
    title: "Auth must work",
    severity: "critical",
    category: "auth",
    whyItMatters: "Users need a reliable way to sign up, log in, recover access, and reach protected pages.",
    recommendedFix: "Verify login, signup, password reset, protected routes, and onboarding redirects.",
    phase: "Phase 2: Auth/onboarding",
    promptTargets: ["cursor", "lovable", "claude_code"],
  },
  {
    id: "required-billing",
    title: "Billing must sync",
    severity: "critical",
    category: "billing",
    whyItMatters: "Paid launches fail if checkout, webhook sync, and subscription access are unreliable.",
    recommendedFix: "Verify checkout, webhook signature handling, subscription sync, and customer portal behavior.",
    phase: "Phase 3: Billing/subscription access",
    promptTargets: ["cursor", "lovable", "claude_code"],
  },
  {
    id: "required-database",
    title: "Database must protect user data",
    severity: "critical",
    category: "database",
    whyItMatters: "User-owned data needs RLS and ownership rules before production traffic.",
    recommendedFix: "Verify user_id ownership, RLS policies, and service-role safety.",
    phase: "Phase 4: Database/RLS",
    promptTargets: ["cursor", "claude_code"],
  },
  {
    id: "required-env",
    title: "Env vars must be configured",
    severity: "critical",
    category: "deployment",
    whyItMatters: "Missing production env vars can break Vercel deploys, auth callbacks, billing, and AI routes.",
    recommendedFix: "Document and verify required production environment variables.",
    phase: "Phase 1: Build/deploy blockers",
    promptTargets: ["cursor", "claude_code"],
  },
  {
    id: "required-build",
    title: "App must build/deploy",
    severity: "critical",
    category: "deployment",
    whyItMatters: "A launch is blocked until the production build and deploy path are reliable.",
    recommendedFix: "Run lint/build and fix blocking deployment errors before feature polish.",
    phase: "Phase 1: Build/deploy blockers",
    promptTargets: ["cursor", "claude_code"],
  },
  {
    id: "required-support",
    title: "Users must be able to contact support",
    severity: "high",
    category: "support",
    whyItMatters: "Early customers need a clear support path when launch issues appear.",
    recommendedFix: "Add support email, contact page, or support link in the app shell.",
    phase: "Phase 7: Customer success",
    promptTargets: ["cursor", "lovable"],
  },
  {
    id: "required-legal",
    title: "Privacy/terms pages must exist",
    severity: "high",
    category: "legal",
    whyItMatters: "Legal and trust pages are expected before account creation and paid checkout.",
    recommendedFix: "Add privacy and terms pages with clear review placeholders.",
    phase: "Phase 6: Legal/trust",
    promptTargets: ["cursor", "lovable", "claude_code"],
  },
];

const recommendedPaidLaunchItems: LaunchPlanItem[] = [
  {
    id: "recommended-welcome-email",
    title: "Welcome email",
    severity: "medium",
    category: "customer_success",
    whyItMatters: "A welcome email reinforces activation and gives users a recovery path after signup.",
    recommendedFix: "Add welcome email copy or a placeholder integration plan.",
    phase: "Phase 7: Customer success",
    promptTargets: ["lovable", "cursor"],
  },
  {
    id: "recommended-error-logging",
    title: "Error logging",
    severity: "medium",
    category: "observability",
    whyItMatters: "Launch issues are hard to diagnose without runtime error visibility.",
    recommendedFix: "Add lightweight error logging notes or a scaffold compatible with the app.",
    phase: "Phase 8: Observability",
    promptTargets: ["cursor", "claude_code"],
  },
  {
    id: "recommended-analytics",
    title: "Analytics",
    severity: "medium",
    category: "observability",
    whyItMatters: "Analytics show whether users reach activation and paid conversion points.",
    recommendedFix: "Add analytics placeholders for signup, onboarding, checkout, and activation events.",
    phase: "Phase 8: Observability",
    promptTargets: ["cursor", "lovable"],
  },
  {
    id: "recommended-ai-limits",
    title: "AI usage limits",
    severity: "high",
    category: "ai",
    whyItMatters: "AI routes can create runaway cost without rate limits and usage tracking.",
    recommendedFix: "Add rate-limit and token/usage tracking guards before provider calls.",
    phase: "Phase 5: AI usage/cost protection",
    promptTargets: ["cursor", "claude_code"],
  },
  {
    id: "recommended-customer-portal",
    title: "Customer portal",
    severity: "medium",
    category: "billing",
    whyItMatters: "Paid users need a way to manage subscription changes and cancellations.",
    recommendedFix: "Add customer portal path or clear management placeholder.",
    phase: "Phase 3: Billing/subscription access",
    promptTargets: ["cursor", "lovable"],
  },
  {
    id: "recommended-upgrade-prompts",
    title: "Upgrade prompts",
    severity: "medium",
    category: "billing",
    whyItMatters: "Users should understand plan limits and paid value before upgrading.",
    recommendedFix: "Add upgrade copy around limited or premium features.",
    phase: "Phase 7: Customer success",
    promptTargets: ["lovable", "cursor"],
  },
  {
    id: "recommended-admin-visibility",
    title: "Admin visibility",
    severity: "medium",
    category: "operations",
    whyItMatters: "Founders need visibility into signups, payments, and errors during launch.",
    recommendedFix: "Add a minimal admin visibility plan without exposing public admin routes.",
    phase: "Phase 8: Observability",
    promptTargets: ["cursor", "claude_code"],
  },
];

const optionalItems: LaunchPlanItem[] = [
  {
    id: "optional-team-accounts",
    title: "Team accounts",
    severity: "low",
    category: "growth",
    whyItMatters: "Teams can expand account value after the first launch path works.",
    recommendedFix: "Plan team invites and roles after single-user launch readiness is verified.",
    phase: "Phase 7: Customer success",
    promptTargets: ["lovable", "cursor"],
  },
  {
    id: "optional-referrals",
    title: "Referral tracking",
    severity: "low",
    category: "growth",
    whyItMatters: "Referral tracking is useful after core activation and billing are stable.",
    recommendedFix: "Add referral tracking later as a growth feature.",
    phase: "Phase 7: Customer success",
    promptTargets: ["cursor"],
  },
  {
    id: "optional-advanced-reports",
    title: "Advanced reports",
    severity: "low",
    category: "product",
    whyItMatters: "Advanced reports can improve retention after the MVP proves value.",
    recommendedFix: "Defer advanced reporting until after launch blockers are removed.",
    phase: "Phase 7: Customer success",
    promptTargets: ["lovable", "cursor"],
  },
  {
    id: "optional-integrations",
    title: "More integrations",
    severity: "low",
    category: "integrations",
    whyItMatters: "Integrations increase value, but they should not block the first launch.",
    recommendedFix: "Add integrations after the core launch path is reliable.",
    phase: "Phase 7: Customer success",
    promptTargets: ["cursor", "claude_code"],
  },
  {
    id: "optional-auto-fix",
    title: "Auto-fix agent",
    severity: "low",
    category: "automation",
    whyItMatters: "Auto-fix can reduce manual work later, but it increases risk before launch.",
    recommendedFix: "Keep auto-fix as a post-launch feature.",
    phase: "Phase 7: Customer success",
    promptTargets: ["cursor"],
  },
];

function phaseForCategory(category: string, title: string): LaunchPlanPhase {
  const value = `${category} ${title}`.toLowerCase();

  if (value.includes("deploy") || value.includes("env") || value.includes("build")) {
    return "Phase 1: Build/deploy blockers";
  }
  if (value.includes("auth") || value.includes("onboarding") || value.includes("password")) {
    return "Phase 2: Auth/onboarding";
  }
  if (value.includes("billing") || value.includes("checkout") || value.includes("stripe") || value.includes("subscription")) {
    return "Phase 3: Billing/subscription access";
  }
  if (value.includes("database") || value.includes("rls") || value.includes("supabase")) {
    return "Phase 4: Database/RLS";
  }
  if (value.includes("ai") || value.includes("rate") || value.includes("usage")) {
    return "Phase 5: AI usage/cost protection";
  }
  if (value.includes("legal") || value.includes("privacy") || value.includes("terms")) {
    return "Phase 6: Legal/trust";
  }
  if (value.includes("support") || value.includes("welcome") || value.includes("upgrade")) {
    return "Phase 7: Customer success";
  }
  if (value.includes("logging") || value.includes("analytics") || value.includes("admin")) {
    return "Phase 8: Observability";
  }

  return "Phase 9: Final smoke test";
}

function promptTargetsForPhase(phase: LaunchPlanPhase) {
  if (phase === "Phase 7: Customer success" || phase === "Phase 6: Legal/trust") {
    return ["cursor", "lovable", "claude_code"] as const;
  }

  return ["cursor", "claude_code", "lovable"] as const;
}

function itemFromIssue(issue: ScanIssue): LaunchPlanItem {
  const phase = phaseForCategory(issue.category, issue.title);

  return {
    id: issue.id,
    title: issue.title,
    severity: issue.severity,
    category: issue.category,
    whyItMatters: issue.whyItMatters,
    recommendedFix: issue.recommendedFix,
    phase,
    promptTargets: [...promptTargetsForPhase(phase)],
  };
}

function itemFromBug(bug: BugFinding): LaunchPlanItem {
  const phase = phaseForCategory(bug.bugType, bug.title);

  return {
    id: bug.id,
    title: bug.title,
    severity: bug.severity,
    category: `bug:${bug.bugType}`,
    whyItMatters: bug.evidence,
    recommendedFix: bug.recommendedFix,
    phase,
    promptTargets: [...promptTargetsForPhase(phase)],
  };
}

function itemFromDuplicate(group: DuplicateGroup): LaunchPlanItem {
  const phase = phaseForCategory(group.duplicateType, group.title);

  return {
    id: group.id,
    title: group.title,
    severity: group.severity,
    category: `duplicate:${group.duplicateType}`,
    whyItMatters: group.conflictRisk,
    recommendedFix: group.recommendedAction,
    phase,
    promptTargets: [...promptTargetsForPhase(phase)],
  };
}

function uniqueById(items: LaunchPlanItem[]) {
  return Array.from(new Map(items.map((item) => [item.id, item])).values());
}

function groupItems(items: LaunchPlanItem[]) {
  return phases.map<FixOrderPhase>((phase) => {
    const phaseItems = items.filter((item) => item.phase === phase);

    return {
      phase,
      summary:
        phaseItems.length > 0
          ? `${phaseItems.length} launch plan item${phaseItems.length === 1 ? "" : "s"} to resolve.`
          : "No active blockers in this phase from the current mock scan.",
      items: phaseItems,
    };
  });
}

function classifyRequired(item: LaunchPlanItem) {
  if (item.severity === "critical") return true;
  if (item.severity !== "high") return false;

  return [
    "Phase 1: Build/deploy blockers",
    "Phase 2: Auth/onboarding",
    "Phase 3: Billing/subscription access",
    "Phase 4: Database/RLS",
    "Phase 5: AI usage/cost protection",
  ].includes(item.phase);
}

function createPromptRecommendations(phasesWithItems: FixOrderPhase[]): PromptPackRecommendation[] {
  return phasesWithItems
    .filter((phase) => phase.items.length > 0)
    .map((phase) => ({
      id: `prompt-${phase.phase.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      phase: phase.phase,
      title: `Generate fix prompts for ${phase.phase}`,
      targetTools: ["cursor", "lovable", "claude_code"],
      itemIds: phase.items.map((item) => item.id),
    }));
}

export function generateLaunchPlan(scanInput: LaunchPlanScanInput): LaunchPlan {
  const scanItems = scanInput.issues.map(itemFromIssue);
  const bugItems = scanInput.bugFindings.map(itemFromBug);
  const duplicateItems = scanInput.duplicateGroups.map(itemFromDuplicate);
  const allCurrentItems = uniqueById([
    ...defaultRequiredItems,
    ...recommendedPaidLaunchItems,
    ...optionalItems,
    ...scanItems,
    ...bugItems,
    ...duplicateItems,
  ]);

  const requiredBeforeLaunch = allCurrentItems.filter(classifyRequired);
  const recommendedBeforePaidLaunch = allCurrentItems.filter(
    (item) =>
      !requiredBeforeLaunch.some((required) => required.id === item.id) &&
      (item.severity === "medium" || item.severity === "high"),
  );
  const optionalAfterLaunch = allCurrentItems.filter((item) => item.severity === "low");
  const orderedItems = [
    ...requiredBeforeLaunch,
    ...recommendedBeforePaidLaunch,
    ...optionalAfterLaunch,
  ];
  const fixOrderPhases = groupItems(orderedItems);
  const guardrails = applyLaunchScoreGuardrails(scanInput.scan.overallScore, requiredBeforeLaunch);
  const nextRecommendedFix = selectNextRecommendedFix({ items: orderedItems });
  const draftPlan = {
    appName: scanInput.appName,
    launchScore: guardrails.guardedScore,
    launchStatus: guardrails.guardedStatus,
    requiredBeforeLaunch,
    recommendedBeforePaidLaunch,
    optionalAfterLaunch,
    fixOrderPhases,
    promptPackRecommendations: createPromptRecommendations(fixOrderPhases),
    finalSmokeTestChecklist: generateFinalSmokeTestChecklist({
      billingEnabled: true,
      aiEnabled: true,
      supabaseEnabled: true,
    }),
    nextRecommendedFix,
    consistencyNotes: guardrails.notes,
    generatedAt: "2026-04-26T19:05:00.000Z",
  };
  const consistencyIssues = validateOutputConsistency({ launchPlan: draftPlan });

  return {
    ...draftPlan,
    consistencyNotes: [
      ...draftPlan.consistencyNotes,
      ...consistencyIssues.map((issue) => issue.message),
    ],
  };
}
