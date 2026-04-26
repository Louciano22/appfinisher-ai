import type { BuilderTarget } from "@/lib/types";

export type LaunchOsStatus = "Live Demo" | "Mocked" | "Ready Next" | "Future";

export type LaunchOsIdea = {
  id: string;
  title: string;
  status: LaunchOsStatus;
  category: "ingestion" | "planning" | "prompts" | "audit" | "launch" | "trust";
  wowMoment: string;
  currentDemo: string;
  nextRealStep: string;
};

export type RiskHeatmapItem = {
  area: string;
  score: number;
  severity: "critical" | "high" | "medium" | "low";
  insight: string;
};

export type ScanTimelineItem = {
  label: string;
  score: number;
  summary: string;
};

export type FixPlanStep = {
  order: number;
  title: string;
  files: string[];
  reason: string;
  verification: string;
};

export type PromptBundle = {
  title: string;
  target: BuilderTarget;
  prompts: number;
  stopCondition: string;
};

export const launchOsIdeas: LaunchOsIdea[] = [
  {
    id: "real-repo-import",
    title: "Real Repo Import",
    status: "Ready Next",
    category: "ingestion",
    wowMoment: "Users see GitHub, ZIP, and manifest paths in one import command center.",
    currentDemo: "Local manifest and pasted file tree intake already feed deterministic scans.",
    nextRealStep: "Add GitHub OAuth, repo tree fetch, and ZIP parsing behind the same manifest shape.",
  },
  {
    id: "launch-readiness-timeline",
    title: "Launch Readiness Timeline",
    status: "Live Demo",
    category: "planning",
    wowMoment: "The project feels alive because every scan becomes a visible launch journey.",
    currentDemo: "A deterministic timeline shows score movement from first scan to launch room.",
    nextRealStep: "Persist scan snapshots and calculate deltas from real historical scans.",
  },
  {
    id: "one-click-fix-plan",
    title: "One-Click Fix Plan Generator",
    status: "Live Demo",
    category: "planning",
    wowMoment: "The app tells builders exactly what to fix first, where, why, and how to verify.",
    currentDemo: "A ranked fix plan includes files, reason, and verification commands.",
    nextRealStep: "Generate plan steps directly from stored scan issues and repository paths.",
  },
  {
    id: "promptpack-bundles",
    title: "PromptPack Bundles",
    status: "Live Demo",
    category: "prompts",
    wowMoment: "Users can copy an entire auth, billing, Supabase, or deploy fix bundle.",
    currentDemo: "Bundle cards group prompts by launch phase and builder target.",
    nextRealStep: "Persist bundles and connect them to real issue IDs and prompt history.",
  },
  {
    id: "builder-mode-selector",
    title: "AI Builder Mode Selector",
    status: "Live Demo",
    category: "prompts",
    wowMoment: "Every prompt adapts to Cursor, Lovable, Claude Code, Replit, Bolt, or Windsurf.",
    currentDemo: "Builder profile cards show behavior, style, and stop-condition differences.",
    nextRealStep: "Expose the selector globally across prompt generation flows.",
  },
  {
    id: "risk-heatmap",
    title: "Risk Heatmap",
    status: "Live Demo",
    category: "audit",
    wowMoment: "Founders instantly see which systems are most dangerous before launch.",
    currentDemo: "A visual heatmap ranks auth, billing, database, AI, legal, deploy, UX, and support.",
    nextRealStep: "Tie heatmap scores to live rule weights and scan categories.",
  },
  {
    id: "before-after-scan-diff",
    title: "Before/After Scan Diff",
    status: "Live Demo",
    category: "planning",
    wowMoment: "Re-scans become proof that work is actually reducing launch risk.",
    currentDemo: "The diff separates resolved, still open, new issues, score change, and next fix.",
    nextRealStep: "Compare persisted scans by issue fingerprint instead of mock labels.",
  },
  {
    id: "founder-engineer-mode",
    title: "Founder Mode vs Engineer Mode",
    status: "Live Demo",
    category: "trust",
    wowMoment: "The same issue can be explained as business risk or implementation detail.",
    currentDemo: "Mode cards translate a Stripe webhook blocker into founder and engineer language.",
    nextRealStep: "Add a global mode toggle for scan issues, reports, and prompt packs.",
  },
  {
    id: "launch-blocker-explainer",
    title: "Launch Blocker Severity Explainer",
    status: "Live Demo",
    category: "trust",
    wowMoment: "Every blocker explains what breaks, what to fix, and what proves it is fixed.",
    currentDemo: "Severity cards show impact, failure mode, fix, and verification.",
    nextRealStep: "Attach explainers to every ShipGuard rule and report section.",
  },
  {
    id: "readme-audit",
    title: "Auto-Generated README Audit",
    status: "Live Demo",
    category: "audit",
    wowMoment: "The app catches missing setup docs before users or reviewers get stuck.",
    currentDemo: "A README checklist checks setup, env vars, deploy notes, screenshots, support, and pricing.",
    nextRealStep: "Parse actual README content from imported repositories.",
  },
  {
    id: "env-doctor",
    title: "Environment Variable Doctor",
    status: "Live Demo",
    category: "audit",
    wowMoment: "Env mistakes become visible before deploy, auth, billing, or AI routes break.",
    currentDemo: "Env Doctor flags missing app URL, unsafe public keys, and undocumented Stripe/Supabase vars.",
    nextRealStep: "Compare `.env.example`, source references, and deployment env metadata.",
  },
  {
    id: "supabase-rls-auditor",
    title: "Supabase RLS Policy Auditor",
    status: "Live Demo",
    category: "audit",
    wowMoment: "Supabase safety gets its own launch-grade audit instead of generic database warnings.",
    currentDemo: "RLS cards check owner columns, enabled RLS, policies, and service-role safety.",
    nextRealStep: "Parse SQL migrations and generated Supabase types.",
  },
  {
    id: "stripe-launch-auditor",
    title: "Stripe Launch Auditor",
    status: "Live Demo",
    category: "audit",
    wowMoment: "Billing readiness becomes a complete product surface, not one warning.",
    currentDemo: "Stripe checklist covers checkout, webhook signature, customer mapping, portal, plans, and refunds.",
    nextRealStep: "Inspect real route handlers and Stripe helper usage.",
  },
  {
    id: "final-launch-room",
    title: "Final Launch Room",
    status: "Live Demo",
    category: "launch",
    wowMoment: "The app turns launch into a cockpit with pass/fail gates and one final readiness call.",
    currentDemo: "Launch Room gates show build, auth, billing, RLS, AI, legal, support, and final score.",
    nextRealStep: "Allow users to mark gates verified and save launch sessions.",
  },
  {
    id: "appfinisher-score-badge",
    title: "AppFinisher Score Badge",
    status: "Live Demo",
    category: "trust",
    wowMoment: "Users get a shareable repo badge that makes launch readiness visible.",
    currentDemo: "A badge preview and markdown snippet are generated from the guarded score.",
    nextRealStep: "Generate public badge URLs from saved scan results.",
  },
];

export const launchTimeline: ScanTimelineItem[] = [
  { label: "First import", score: 42, summary: "Raw AI-built app imported with missing auth, Stripe, and RLS proof." },
  { label: "ShipGuard scan", score: 68, summary: "Critical blockers identified and grouped by launch phase." },
  { label: "Prompt fixes", score: 82, summary: "Billing/auth duplicates reduced after builder-ready prompt bundles." },
  { label: "Launch room", score: 89, summary: "Guarded score remains below Launch Ready until legal/support gates pass." },
];

export const riskHeatmap: RiskHeatmapItem[] = [
  { area: "Auth", score: 42, severity: "critical", insight: "Protected routes and recovery flow need proof." },
  { area: "Billing", score: 48, severity: "critical", insight: "Webhook verification and customer mapping are launch blockers." },
  { area: "Database/RLS", score: 55, severity: "high", insight: "User ownership policies need a complete pass." },
  { area: "AI Cost", score: 62, severity: "high", insight: "Rate limits and usage tracking should ship before paid launch." },
  { area: "Legal", score: 58, severity: "high", insight: "Privacy, terms, cancellation, and AI disclaimer are incomplete." },
  { area: "Deploy", score: 81, severity: "medium", insight: "Build path exists, but env proof still matters." },
  { area: "UX", score: 76, severity: "medium", insight: "Onboarding and empty states need final polish." },
  { area: "Support", score: 69, severity: "medium", insight: "Users need a clear contact path before launch." },
];

export const fixPlanSteps: FixPlanStep[] = [
  {
    order: 1,
    title: "Lock down auth and protected routes",
    files: ["middleware.ts", "app/login/page.tsx", "app/dashboard/page.tsx"],
    reason: "Launch users cannot trust account areas if protected routes are public or recovery is missing.",
    verification: "Run build, open dashboard unauthenticated, confirm redirect or protected-state copy.",
  },
  {
    order: 2,
    title: "Verify Stripe webhook safety",
    files: ["app/api/stripe/webhooks/route.ts", "lib/stripe.ts", ".env.example"],
    reason: "Paid access cannot be trusted without signature verification and idempotency planning.",
    verification: "Confirm webhook secret is server-only and route rejects unsigned events.",
  },
  {
    order: 3,
    title: "Prove Supabase RLS ownership",
    files: ["supabase/schema.sql", "supabase/rls.sql", "lib/supabase.ts"],
    reason: "User-owned data must be protected before any real customer enters the product.",
    verification: "Check every user-owned table has `user_id`, RLS enabled, and owner policies.",
  },
  {
    order: 4,
    title: "Add AI usage controls",
    files: ["app/api/ai/chat/route.ts", "lib/ai/usage.ts", ".env.example"],
    reason: "AI routes can create runaway cost without quotas, limits, and logging.",
    verification: "Confirm rate checks happen before provider calls and limit errors are clear.",
  },
];

export const promptBundles: PromptBundle[] = [
  { title: "Auth Fix Bundle", target: "cursor", prompts: 4, stopCondition: "Stop after login, signup, recovery, and protected route checks pass." },
  { title: "Stripe Fix Bundle", target: "claude_code", prompts: 5, stopCondition: "Stop after webhook, checkout, portal, plan limits, and refund copy are verified." },
  { title: "Supabase RLS Bundle", target: "cursor", prompts: 3, stopCondition: "Stop after schema, RLS, and service-role boundaries are verified." },
  { title: "AI Cost-Control Bundle", target: "replit", prompts: 3, stopCondition: "Stop after rate limit, usage logging, and fallback behavior are visible." },
  { title: "Launch Polish Bundle", target: "lovable", prompts: 6, stopCondition: "Stop after onboarding, empty states, legal, support, and final smoke test pass." },
];

export const readmeAuditItems = [
  "Local setup command documented",
  "Required env vars listed",
  "Vercel deploy notes included",
  "Screenshots or product preview included",
  "Support/contact path visible",
  "Pricing or waitlist state explained",
];

export const envDoctorFindings = [
  "Add `NEXT_PUBLIC_APP_URL` for callback and webhook URL consistency.",
  "Keep `SUPABASE_SERVICE_ROLE_KEY` server-only and never `NEXT_PUBLIC_`.",
  "Document `STRIPE_WEBHOOK_SECRET` separately from `STRIPE_SECRET_KEY`.",
  "List AI provider keys without shipping real values.",
];

export const supabaseAuditItems = [
  "Every user-owned table includes `user_id`.",
  "RLS is enabled for projects, scans, issues, prompts, and reports.",
  "Owner select/insert/update/delete policies are present.",
  "Service-role behavior is separated from browser clients.",
];

export const stripeAuditItems = [
  "Checkout entry point exists or has explicit not-live copy.",
  "Webhook route verifies signatures before event handling.",
  "Subscription status maps to a user/customer record.",
  "Customer portal and cancellation/refund language are visible.",
  "Plan limits are documented in product UI.",
];

export const launchRoomGates = [
  { gate: "Build passes", passed: true },
  { gate: "Auth protected", passed: false },
  { gate: "Stripe verified", passed: false },
  { gate: "Supabase RLS verified", passed: true },
  { gate: "AI rate limits", passed: false },
  { gate: "Legal pages ready", passed: false },
  { gate: "Support path visible", passed: true },
  { gate: "Final smoke test", passed: false },
];
