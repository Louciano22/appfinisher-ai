import type { EngineDuplicateGroup } from "@/lib/shipguard-engine";

export const duplicateTypeLabels: Record<EngineDuplicateGroup["duplicateType"], string> = {
  duplicate_supabase_clients: "Duplicate Supabase clients",
  duplicate_stripe_clients: "Duplicate Stripe clients",
  duplicate_chatbot_routes: "Duplicate chatbot routes",
  duplicate_auth_helpers: "Duplicate auth helpers",
  duplicate_pricing_components: "Duplicate pricing components",
  duplicate_dashboard_pages: "Duplicate dashboard pages",
  conflicting_package_managers: "Conflicting package managers",
  conflicting_router_structures: "Conflicting router structures",
  duplicate_environment_examples: "Duplicate environment examples",
  duplicate_type_definitions: "Duplicate type definitions",
};

export const mockDuplicateFinderGroups: EngineDuplicateGroup[] = [
  {
    id: "dup-supabase-clients",
    title: "Duplicate Supabase clients",
    severity: "critical",
    duplicateType: "duplicate_supabase_clients",
    files: [
      "lib/supabase.ts",
      "lib/supabaseClient.ts",
      "lib/supabase/client.ts",
      "utils/supabase.ts",
    ],
    canonicalRecommendation:
      "Use lib/supabase/client.ts as the browser client and reserve server-only clients for explicit server modules.",
    conflictRisk:
      "Multiple Supabase client factories can mix anon and service-role behavior, bypass RLS expectations, and create inconsistent session handling.",
    recommendedAction:
      "Inspect all clients, keep the safest canonical client, merge any useful typed helpers, and archive redundant files after build passes.",
    filesToMerge: ["lib/supabase.ts", "lib/supabaseClient.ts", "utils/supabase.ts"],
    filesToArchive: ["lib/supabase.ts", "lib/supabaseClient.ts", "utils/supabase.ts"],
    promptTarget: "Cursor",
  },
  {
    id: "dup-chatbot-routes",
    title: "Duplicate chatbot routes",
    severity: "high",
    duplicateType: "duplicate_chatbot_routes",
    files: ["app/api/chat/route.ts", "app/api/ai/chat/route.ts", "app/api/chatbot/route.ts"],
    canonicalRecommendation:
      "Use app/api/ai/chat/route.ts as the canonical AI chat route because it matches the product AI namespace.",
    conflictRisk:
      "Different chat routes can apply different auth, rate-limit, prompt, and usage-tracking behavior.",
    recommendedAction:
      "Merge useful validation and provider-call logic into the canonical route, then update UI calls before archiving duplicates.",
    filesToMerge: ["app/api/chat/route.ts", "app/api/chatbot/route.ts"],
    filesToArchive: ["app/api/chat/route.ts", "app/api/chatbot/route.ts"],
    promptTarget: "Cursor",
  },
  {
    id: "dup-package-managers",
    title: "Conflicting package managers",
    severity: "high",
    duplicateType: "conflicting_package_managers",
    files: ["package-lock.json", "yarn.lock", "pnpm-lock.yaml"],
    canonicalRecommendation:
      "Use package-lock.json as canonical because the current project was initialized with npm.",
    conflictRisk:
      "Multiple lockfiles can cause different dependency trees between local development, CI, and Vercel builds.",
    recommendedAction:
      "Confirm npm is the intended package manager, then archive non-canonical lockfiles only after install/build succeeds.",
    filesToMerge: [],
    filesToArchive: ["yarn.lock", "pnpm-lock.yaml"],
    promptTarget: "Cursor",
  },
  {
    id: "dup-pricing-components",
    title: "Duplicate pricing components",
    severity: "medium",
    duplicateType: "duplicate_pricing_components",
    files: [
      "components/Pricing.tsx",
      "components/PricingTable.tsx",
      "app/pricing/PricingClient.tsx",
    ],
    canonicalRecommendation:
      "Use app/pricing/PricingClient.tsx as the route-owned pricing surface and extract shared presentation only if needed.",
    conflictRisk:
      "Pricing copy, plan limits, and CTA behavior can drift across duplicate generated components.",
    recommendedAction:
      "Compare pricing details, merge the current plan copy into the canonical component, and update imports where consolidation is required.",
    filesToMerge: ["components/Pricing.tsx", "components/PricingTable.tsx"],
    filesToArchive: ["components/Pricing.tsx", "components/PricingTable.tsx"],
    promptTarget: "Cursor",
  },
];
