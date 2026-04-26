import type {
  BugFinding,
  DuplicateGroup,
  LaunchReadinessCategory,
  Scan,
  ScanIssue,
} from "@/lib/types";
import type { BuilderTarget, IssueSeverity } from "@/lib/types";

export type LaunchStatus = "Not Ready" | "Needs Work" | "Almost Ready" | "Launch Ready";

export type LaunchPlanPhase =
  | "Phase 1: Build/deploy blockers"
  | "Phase 2: Auth/onboarding"
  | "Phase 3: Billing/subscription access"
  | "Phase 4: Database/RLS"
  | "Phase 5: AI usage/cost protection"
  | "Phase 6: Legal/trust"
  | "Phase 7: Customer success"
  | "Phase 8: Observability"
  | "Phase 9: Final smoke test";

export type LaunchPlanItem = {
  id: string;
  title: string;
  severity: IssueSeverity;
  category: string;
  whyItMatters: string;
  recommendedFix: string;
  phase: LaunchPlanPhase;
  promptTargets: BuilderTarget[];
};

export type PromptPackRecommendation = {
  id: string;
  phase: LaunchPlanPhase;
  title: string;
  targetTools: BuilderTarget[];
  itemIds: string[];
};

export type FixOrderPhase = {
  phase: LaunchPlanPhase;
  summary: string;
  items: LaunchPlanItem[];
};

export type LaunchPlan = {
  appName: string;
  launchScore: number;
  launchStatus: LaunchStatus;
  requiredBeforeLaunch: LaunchPlanItem[];
  recommendedBeforePaidLaunch: LaunchPlanItem[];
  optionalAfterLaunch: LaunchPlanItem[];
  fixOrderPhases: FixOrderPhase[];
  promptPackRecommendations: PromptPackRecommendation[];
  finalSmokeTestChecklist: string[];
  nextRecommendedFix: LaunchPlanItem | null;
  consistencyNotes: string[];
  generatedAt: string;
};

export type LaunchPlanScanInput = {
  appName: string;
  scan: Scan;
  issues: ScanIssue[];
  bugFindings: BugFinding[];
  duplicateGroups: DuplicateGroup[];
  categoryScores: LaunchReadinessCategory[];
};
