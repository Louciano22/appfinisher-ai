import type { ShipGuardCategory } from "@/lib/shipguard-engine/types";

export const scanCategories: {
  id: ShipGuardCategory;
  name: string;
  checks: string[];
}[] = [
  {
    id: "product_readiness",
    name: "Product Readiness",
    checks: [
      "landing page",
      "pricing page",
      "CTA",
      "onboarding flow",
      "dashboard",
      "empty states",
      "support/contact path",
    ],
  },
  {
    id: "auth_readiness",
    name: "Auth Readiness",
    checks: [
      "login route",
      "signup route",
      "password reset route",
      "protected routes",
      "middleware/session handling",
      "onboarding redirect",
      "role/team support",
    ],
  },
  {
    id: "billing_readiness",
    name: "Billing Readiness",
    checks: [
      "Stripe keys",
      "checkout route",
      "webhook route",
      "customer portal",
      "subscription sync",
      "plan limits",
      "trial logic",
      "downgrade/cancel handling",
      "test/live mode mismatch",
    ],
  },
  {
    id: "database_readiness",
    name: "Database Readiness",
    checks: [
      "migrations/schema files",
      "RLS files",
      "user ownership columns",
      "org ownership columns",
      "indexes",
      "updated_at triggers",
      "service role safety",
    ],
  },
  {
    id: "security_readiness",
    name: "Security Readiness",
    checks: [
      "env leaks",
      "service role frontend risk",
      "auth checks",
      "admin routes",
      "CORS",
      "input validation",
      "webhook verification",
      "rate limiting",
    ],
  },
  {
    id: "ai_readiness",
    name: "AI Readiness",
    checks: [
      "AI provider keys",
      "AI route",
      "usage limits",
      "rate limits",
      "prompt injection protection",
      "token/cost tracking",
      "fallback behavior",
      "AI output label",
    ],
  },
  {
    id: "deployment_readiness",
    name: "Deployment Readiness",
    checks: [
      "build script",
      "lint script",
      "Vercel compatibility",
      "env var references",
      "NEXT_PUBLIC_APP_URL",
      "cron route protection",
      "edge runtime risks",
    ],
  },
  {
    id: "observability_readiness",
    name: "Observability Readiness",
    checks: [
      "error logging",
      "analytics",
      "audit logs",
      "health check route",
      "payment event logs",
      "AI usage logs",
    ],
  },
  {
    id: "legal_trust_readiness",
    name: "Legal/Trust Readiness",
    checks: [
      "privacy policy",
      "terms page",
      "refund/cancellation language",
      "support email",
      "AI disclaimer",
      "data deletion path",
    ],
  },
  {
    id: "customer_success_readiness",
    name: "Customer Success Readiness",
    checks: [
      "welcome guide",
      "demo data",
      "help docs",
      "FAQ",
      "first-run checklist",
      "upgrade prompts",
      "empty-state guidance",
    ],
  },
];

export function getCategoryName(category: ShipGuardCategory) {
  return scanCategories.find((item) => item.id === category)?.name ?? category;
}
