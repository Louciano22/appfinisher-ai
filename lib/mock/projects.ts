import type { Project } from "@/lib/types";

export const mockProjects: Project[] = [
  {
    id: "demo-saas-app",
    name: "Demo SaaS App",
    description:
      "A Cursor-built B2B dashboard with billing screens, partial onboarding, and unresolved production launch blockers.",
    repoUrl: "https://github.com/example/demo-saas-app",
    stack: ["Next.js", "TypeScript", "Tailwind CSS", "Supabase", "Stripe"],
    framework: "Next.js App Router",
    database: "Supabase Postgres",
    billingProvider: "stripe",
    deploymentProvider: "vercel",
    aiProvider: "cursor",
    status: "needs_fixes",
    launchReadinessScore: 68,
    createdAt: "2026-04-20T15:30:00.000Z",
    updatedAt: "2026-04-26T16:45:00.000Z",
  },
  {
    id: "founderdesk",
    name: "FounderDesk",
    description:
      "A Lovable-generated founder CRM with duplicate auth pages and incomplete deployment documentation.",
    repoUrl: "https://github.com/example/founderdesk",
    stack: ["Next.js", "React", "Tailwind CSS", "Supabase"],
    framework: "Next.js App Router",
    database: "Supabase Postgres",
    billingProvider: "none",
    deploymentProvider: "vercel",
    aiProvider: "lovable",
    status: "needs_fixes",
    launchReadinessScore: 54,
    createdAt: "2026-04-18T10:00:00.000Z",
    updatedAt: "2026-04-25T20:05:00.000Z",
  },
  {
    id: "signalpilot",
    name: "SignalPilot",
    description:
      "A Claude Code analytics MVP with a clean app shell, remaining QA tasks, and prompt packs ready for final polish.",
    repoUrl: "https://github.com/example/signalpilot",
    stack: ["Next.js", "TypeScript", "Tailwind CSS", "Prisma"],
    framework: "Next.js App Router",
    database: "Postgres",
    billingProvider: "stripe",
    deploymentProvider: "vercel",
    aiProvider: "claude_code",
    status: "ready",
    launchReadinessScore: 88,
    createdAt: "2026-04-14T13:10:00.000Z",
    updatedAt: "2026-04-24T18:20:00.000Z",
  },
];

export const detailedProject = mockProjects[0];
