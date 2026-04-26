import type { BuilderTarget, IssueSeverity } from "@/lib/types";

export type PromptPackIssueType =
  | "bug_fix"
  | "duplicate_conflict_resolution"
  | "launch_readiness_fix"
  | "stripe_billing_fix"
  | "supabase_rls_fix"
  | "auth_onboarding_fix"
  | "ai_route_rate_limit_fix"
  | "deployment_vercel_fix"
  | "legal_trust_page_creation"
  | "customer_onboarding_improvement";

export type PromptPackInput = {
  id: string;
  issueType: PromptPackIssueType;
  title: string;
  severity?: IssueSeverity;
  targetTool: BuilderTarget;
  filesToInspect: string[];
  knownIssue: string;
  goal: string;
  constraints?: string[];
  successCriteria: string[];
  verificationSteps: string[];
  recommendedContext?: string;
};

export type PromptPackOutput = {
  id: string;
  inputId: string;
  title: string;
  targetTool: BuilderTarget;
  prompt: string;
  createdAt: string;
};

export type ToolProfile = {
  id: BuilderTarget;
  name: string;
  behaviorRules: string[];
  stopCondition: string;
};
