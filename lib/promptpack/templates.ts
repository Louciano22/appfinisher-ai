import type { PromptPackIssueType } from "@/lib/promptpack/types";

export const issueTypeLabels: Record<PromptPackIssueType, string> = {
  bug_fix: "Bug fix",
  duplicate_conflict_resolution: "Duplicate/conflict resolution",
  launch_readiness_fix: "Launch readiness fix",
  stripe_billing_fix: "Stripe billing fix",
  supabase_rls_fix: "Supabase RLS fix",
  auth_onboarding_fix: "Auth/onboarding fix",
  ai_route_rate_limit_fix: "AI route/rate limit fix",
  deployment_vercel_fix: "Deployment/Vercel fix",
  legal_trust_page_creation: "Legal/trust page creation",
  customer_onboarding_improvement: "Customer onboarding improvement",
};

export const agentRules = [
  "Think before coding: inspect before editing, surface ambiguity, and never silently assume.",
  "Simplicity first: use the minimum code needed and avoid over-engineering.",
  "Surgical changes: only touch what is necessary and do not refactor unrelated code.",
  "Goal-driven execution: define success criteria, verify it worked, then stop.",
];

export function listSection(items: string[], fallback = "None provided") {
  if (items.length === 0) return `- ${fallback}`;

  return items.map((item) => `- ${item}`).join("\n");
}
