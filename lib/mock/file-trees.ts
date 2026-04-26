import type { FileTree } from "@/lib/shipguard-engine";

export const demoSaasFileTree: FileTree = {
  path: ".",
  type: "directory",
  children: [
    {
      path: "package.json",
      type: "file",
      contentPreview:
        '{ "scripts": { "build": "next build", "lint": "eslint" }, "dependencies": { "next": "16.2.4" } }',
    },
    {
      path: "next.config.ts",
      type: "file",
      contentPreview: "const nextConfig = {}; export default nextConfig;",
    },
    {
      path: ".env.example",
      type: "file",
      contentPreview:
        "NEXT_PUBLIC_APP_URL= STRIPE_SECRET_KEY= STRIPE_WEBHOOK_SECRET= SUPABASE_URL= SUPABASE_ANON_KEY= OPENAI_API_KEY=",
    },
    {
      path: "app",
      type: "directory",
      children: [
        {
          path: "app/page.tsx",
          type: "file",
          contentPreview:
            "Landing page with Get Started CTA and AI Generated badge for generated launch plans.",
        },
        {
          path: "app/pricing/page.tsx",
          type: "file",
          contentPreview: "Pricing cards with plan limit copy and upgrade prompts.",
        },
        {
          path: "app/dashboard/page.tsx",
          type: "file",
          contentPreview:
            "Dashboard with empty state guidance, first-run checklist, welcome copy, and sample data.",
        },
        {
          path: "app/onboarding/page.tsx",
          type: "file",
          contentPreview:
            "Onboarding guide with hasCompletedOnboarding redirect copy and getting started checklist.",
        },
        {
          path: "app/login/page.tsx",
          type: "file",
          contentPreview: "Login form using session checks.",
        },
        {
          path: "app/signup/page.tsx",
          type: "file",
          contentPreview: "Signup form links to terms and privacy.",
        },
        {
          path: "app/billing/page.tsx",
          type: "file",
          contentPreview:
            "Billing page shows subscription tier, trial logic, plan limits, cancel subscription, and customer portal copy.",
        },
        {
          path: "app/api/stripe/webhooks/route.ts",
          type: "file",
          contentPreview:
            "Stripe webhook route TODO with stripe event audit log but missing constructEvent signature verification.",
        },
        {
          path: "app/api/ai/generate/route.ts",
          type: "file",
          contentPreview:
            "AI route with token tracking, AI usage log, rate limit TODO, prompt injection protection, fallback behavior.",
        },
        {
          path: "app/api/health/route.ts",
          type: "file",
          contentPreview: "return Response.json({ status: 'ok' })",
        },
        {
          path: "app/settings/page.tsx",
          type: "file",
          contentPreview: "Settings page renders profile.name and user.name.",
        },
        {
          path: "app/support/page.tsx",
          type: "file",
          contentPreview: "Contact support at support@appfinisher.test with cancellation questions.",
        },
        {
          path: "app/privacy/page.tsx",
          type: "file",
          contentPreview: "Privacy policy placeholder for legal review.",
        },
        {
          path: "app/terms/page.tsx",
          type: "file",
          contentPreview: "Terms page with refund and cancellation language plus AI disclaimer.",
        },
      ],
    },
    {
      path: "pages",
      type: "directory",
      children: [
        {
          path: "pages/dashboard.tsx",
          type: "file",
          contentPreview: "Legacy generated dashboard route with stale cards.",
        },
      ],
    },
    {
      path: "supabase",
      type: "directory",
      children: [
        {
          path: "supabase/schema.sql",
          type: "file",
          contentPreview:
            "create table projects (id uuid, user_id uuid, organization_id uuid, updated_at timestamptz); create index projects_user_id_idx on projects(user_id);",
        },
        {
          path: "supabase/rls.sql",
          type: "file",
          contentPreview:
            "alter table projects enable row level security; create policy owner_select using (auth.uid() = user_id);",
        },
        {
          path: "supabase/functions.sql",
          type: "file",
          contentPreview:
            "create function set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;",
        },
      ],
    },
    {
      path: "docs/env.md",
      type: "file",
      contentPreview: "Env setup duplicates .env.example and should be merged before launch.",
    },
  ],
};
