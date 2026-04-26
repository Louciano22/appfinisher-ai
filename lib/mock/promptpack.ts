import type { PromptPackInput } from "@/lib/promptpack";

export const mockPromptPackInputs: PromptPackInput[] = [
  {
    id: "stripe-webhook-fix",
    issueType: "stripe_billing_fix",
    title: "Stripe webhook fix",
    severity: "critical",
    targetTool: "cursor",
    filesToInspect: ["app/api/stripe/webhooks/route.ts", ".env.example", "lib/stripe.ts"],
    knownIssue:
      "The Stripe webhook route handles events without clear signature verification or idempotency safeguards.",
    goal:
      "Add a safe webhook verification scaffold and document required Stripe webhook environment variables without processing live payments.",
    constraints: [
      "Do not add real Stripe credentials.",
      "Do not implement full billing persistence in this step.",
      "Keep webhook logic server-only.",
    ],
    successCriteria: [
      "Webhook route verifies signatures before event handling.",
      "Webhook secret is documented in .env.example.",
      "The route includes an idempotency note or placeholder.",
    ],
    verificationSteps: [
      "Inspect the webhook route and Stripe helper.",
      "Confirm no client file imports the webhook secret.",
      "Run build/typecheck if available.",
    ],
    recommendedContext:
      "AppFinisher detected a billing launch blocker in an AI-built SaaS app. The fix should be narrow and production-readiness oriented.",
  },
  {
    id: "duplicate-supabase-client-cleanup",
    issueType: "duplicate_conflict_resolution",
    title: "Duplicate Supabase client cleanup",
    severity: "critical",
    targetTool: "cursor",
    filesToInspect: [
      "lib/supabase.ts",
      "lib/supabaseClient.ts",
      "lib/supabase/client.ts",
      "utils/supabase.ts",
    ],
    knownIssue:
      "Multiple Supabase client factories exist and may mix browser, server, and service-role behavior.",
    goal:
      "Identify the canonical Supabase client, merge useful typed helper logic, and avoid deleting duplicates until verification passes.",
    constraints: [
      "Do not expose service-role keys to client code.",
      "Preserve imports where possible.",
      "Update references only when consolidation requires it.",
    ],
    successCriteria: [
      "One canonical Supabase browser client is clearly used.",
      "Server-only Supabase behavior is separated from client code.",
      "Build/typecheck passes before redundant files are archived.",
    ],
    verificationSteps: [
      "Inspect every listed Supabase file.",
      "Choose the canonical file before editing.",
      "Run build/typecheck after consolidation.",
    ],
    recommendedContext:
      "AppFinisher found duplicate Supabase clients that can create RLS and session drift in generated apps.",
  },
  {
    id: "ai-route-rate-limit",
    issueType: "ai_route_rate_limit_fix",
    title: "AI route rate limit",
    severity: "high",
    targetTool: "cursor",
    filesToInspect: ["app/api/ai/chat/route.ts", "lib/ai/usage.ts", ".env.example"],
    knownIssue:
      "The AI chat route accepts prompts without a visible rate-limit or usage-tracking guard.",
    goal:
      "Add a minimal rate-limit and usage-tracking scaffold before any AI provider call.",
    constraints: [
      "Do not call an external AI provider.",
      "Do not add a paid rate-limit service unless already present.",
      "Keep fallback behavior explicit.",
    ],
    successCriteria: [
      "AI route checks request limits before provider calls.",
      "Usage tracking placeholder is visible and scoped.",
      "Rate-limit failure returns a clear response.",
    ],
    verificationSteps: [
      "Inspect AI route and usage helpers.",
      "Confirm limit check occurs before provider execution.",
      "Run build/typecheck if available.",
    ],
    recommendedContext:
      "AppFinisher identified an AI cost-control risk. The prompt should keep implementation narrow and deterministic.",
  },
  {
    id: "missing-password-reset-flow",
    issueType: "auth_onboarding_fix",
    title: "Missing password reset flow",
    severity: "medium",
    targetTool: "lovable",
    filesToInspect: ["app/login/page.tsx", "app/signup/page.tsx", "app/(auth)"],
    knownIssue:
      "Login and signup routes exist, but there is no password reset or forgot-password path.",
    goal:
      "Add a minimal password reset page or provider handoff placeholder and link it from login.",
    constraints: [
      "Preserve existing auth page style.",
      "Do not implement live auth if provider wiring is absent.",
      "Do not change unrelated navigation.",
    ],
    successCriteria: [
      "Login page includes a visible forgot-password link.",
      "Password reset route renders a clear launch-ready placeholder.",
      "Existing login/signup navigation still works.",
    ],
    verificationSteps: [
      "Inspect auth pages and routing.",
      "Add the smallest page/link change.",
      "Click through login to reset route in the app preview.",
    ],
    recommendedContext:
      "AppFinisher found an auth-readiness gap that affects customer recovery during launch.",
  },
  {
    id: "supabase-rls-onboarding-issue",
    issueType: "supabase_rls_fix",
    title: "Supabase RLS onboarding issue",
    severity: "high",
    targetTool: "claude_code",
    filesToInspect: ["supabase/schema.sql", "supabase/rls.sql", "app/onboarding/page.tsx"],
    knownIssue:
      "Onboarding records need owner-based access rules and a clear user_id relationship before launch.",
    goal:
      "Add or verify user ownership columns and simple owner-based RLS policies for onboarding data.",
    constraints: [
      "Do not build team/organization permissions yet.",
      "Do not connect to live Supabase.",
      "Keep SQL policies simple and owner-based.",
    ],
    successCriteria: [
      "Onboarding table has user_id ownership.",
      "RLS is enabled for onboarding data.",
      "Owner select/insert/update policies are present.",
    ],
    verificationSteps: [
      "Inspect schema and RLS files.",
      "Apply minimal SQL scaffold changes.",
      "Run build/typecheck and summarize changed files.",
    ],
    recommendedContext:
      "AppFinisher detected a database launch-readiness risk around onboarding data ownership.",
  },
];
