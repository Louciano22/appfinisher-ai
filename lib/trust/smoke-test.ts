import type { SmokeTestOptions } from "@/lib/trust/types";

export function generateFinalSmokeTestChecklist(options: SmokeTestOptions = {}) {
  const checklist = [
    "Signup works for a new user.",
    "Login works for an existing user.",
    "Password reset flow renders and is linked from login.",
    "Protected routes reject unauthenticated users.",
    "Onboarding works from first login to dashboard.",
    "Dashboard loads with empty-state guidance.",
    "Key environment variables are documented and configured.",
    "Privacy and terms pages exist and are reachable.",
    "Support path exists and is reachable.",
    "Production build passes.",
    "Deployment configuration is reviewed.",
  ];

  if (options.billingEnabled) {
    checklist.splice(
      4,
      0,
      "Stripe checkout works in the intended test/live mode.",
      "Stripe webhook signature verification is present.",
      "Customer portal route is protected by auth.",
    );
  }

  if (options.supabaseEnabled) {
    checklist.splice(6, 0, "Supabase RLS prevents cross-user data access.");
  }

  if (options.aiEnabled) {
    checklist.splice(
      7,
      0,
      "AI routes have rate limits.",
      "AI routes record usage or cost-tracking evidence.",
      "AI-generated output is labeled for users.",
    );
  }

  return checklist;
}
