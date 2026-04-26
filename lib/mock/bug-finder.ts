import type { EngineBugFinding } from "@/lib/shipguard-engine";

export const bugTypeLabels: Record<EngineBugFinding["bugType"], string> = {
  broken_imports: "Broken imports",
  missing_exports: "Missing exports",
  duplicate_route_handlers: "Duplicate route handlers",
  missing_env_var_usage: "Missing env var usage",
  env_var_referenced_not_documented: "Env var referenced but not documented",
  stripe_webhook_without_signature_verification: "Stripe webhook without signature verification",
  stripe_checkout_without_user_customer_mapping: "Stripe checkout without user/customer mapping",
  supabase_service_role_used_in_client_code: "Supabase service role used in client code",
  supabase_rls_mismatch_risk: "Supabase RLS mismatch risk",
  middleware_edge_runtime_risk: "Middleware edge runtime risk",
  api_route_missing_auth_check: "API route missing auth check",
  ai_route_missing_rate_limit: "AI route missing rate limit",
  ai_route_missing_usage_tracking: "AI route missing usage tracking",
  missing_await_on_async_calls: "Missing await on async calls",
  wrong_redirect_urls: "Wrong redirect URLs",
  public_admin_route: "Public admin route",
  missing_error_handling: "Missing error handling",
  missing_try_catch_critical_api_route: "Missing try/catch in critical API routes",
  webhook_not_idempotent: "Webhook not idempotent",
  typescript_config_risk: "TypeScript config risk",
  package_script_missing_build: "Package script missing build",
  conflicting_package_managers: "Conflicting package managers",
};

export const mockBugFinderFindings: EngineBugFinding[] = [
  {
    id: "bug-stripe-webhook-signature",
    title: "Stripe webhook does not verify signature",
    severity: "critical",
    bugType: "stripe_webhook_without_signature_verification",
    filePath: "app/api/stripe/webhooks/route.ts",
    evidence:
      "The webhook route receives Stripe events, but content preview does not show constructEvent, stripe-signature, or webhook secret verification.",
    whyItMatters:
      "Unsigned webhooks allow forged payment events, which can incorrectly activate subscriptions or corrupt billing state.",
    recommendedFix:
      "Verify the raw request body with Stripe webhook signature verification before processing any event.",
    successCriteria:
      "Webhook processing rejects unsigned events and only continues after signature verification succeeds.",
    promptTarget: "Cursor",
  },
  {
    id: "bug-supabase-service-role-client",
    title: "Supabase service role risk",
    severity: "critical",
    bugType: "supabase_service_role_used_in_client_code",
    filePath: "components/admin/admin-data-panel.tsx",
    evidence:
      "Client-facing component preview references SUPABASE_SERVICE_ROLE_KEY while rendering admin data controls.",
    whyItMatters:
      "A service role key in client code bypasses RLS and can expose or mutate all project data.",
    recommendedFix:
      "Remove service role references from client components and keep privileged Supabase usage in server-only code.",
    successCriteria:
      "No client component, page, or NEXT_PUBLIC variable references the Supabase service role key.",
    promptTarget: "Cursor",
  },
  {
    id: "bug-ai-chat-rate-limit",
    title: "AI chat route missing rate limit",
    severity: "high",
    bugType: "ai_route_missing_rate_limit",
    filePath: "app/api/ai/chat/route.ts",
    evidence:
      "AI chat route accepts user prompts and calls the provider, but no rate limit, throttle, or quota guard is shown.",
    whyItMatters:
      "Unbounded AI routes can create runaway API cost and degrade service for legitimate users.",
    recommendedFix:
      "Add a small rate-limit guard or explicit placeholder that blocks repeated requests per user/session.",
    successCriteria:
      "The AI chat route has a visible rate-limit decision before provider calls are made.",
    promptTarget: "Cursor",
  },
  {
    id: "bug-duplicate-api-chat-route",
    title: "Duplicate API chat route",
    severity: "high",
    bugType: "duplicate_route_handlers",
    filePath: "app/api/chat/route.ts and app/api/ai/chat/route.ts",
    evidence:
      "Two route handlers appear to own chat completion behavior with different request payload assumptions.",
    whyItMatters:
      "Duplicate handlers drift over time and make frontend calls unpredictable during launch QA.",
    recommendedFix:
      "Choose one canonical chat API route and update references to use it; archive or remove the duplicate.",
    successCriteria:
      "Only one chat route handles AI chat requests, and all UI calls point to the canonical route.",
    promptTarget: "Cursor",
  },
  {
    id: "bug-missing-password-reset",
    title: "Missing password reset route",
    severity: "medium",
    bugType: "missing_exports",
    filePath: "app/(auth)",
    evidence:
      "Login and signup routes exist, but no reset-password, forgot-password, or password-reset route is present.",
    whyItMatters:
      "Users who forget credentials can become locked out, creating support burden immediately after launch.",
    recommendedFix:
      "Add a minimal password reset route or a clear auth-provider handoff placeholder.",
    successCriteria:
      "Login surfaces link to a password reset path and the path renders a launch-ready placeholder.",
    promptTarget: "Cursor",
  },
  {
    id: "bug-app-url-env-doc",
    title: "NEXT_PUBLIC_APP_URL referenced but not listed in env example",
    severity: "medium",
    bugType: "env_var_referenced_not_documented",
    filePath: "lib/url.ts and .env.example",
    evidence:
      "App URL helper references NEXT_PUBLIC_APP_URL, but .env.example does not document the variable.",
    whyItMatters:
      "Missing app URL configuration breaks redirects, email links, webhook callbacks, and production previews.",
    recommendedFix:
      "Add NEXT_PUBLIC_APP_URL to .env.example and note the expected Vercel production URL format.",
    successCriteria:
      ".env.example lists NEXT_PUBLIC_APP_URL and no live production value is committed.",
    promptTarget: "Cursor",
  },
];
