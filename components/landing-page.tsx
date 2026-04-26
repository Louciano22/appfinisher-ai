import Link from "next/link";
import { Card } from "@/components/ui";

const painPoints = [
  "Stripe does not sync",
  "Supabase RLS blocks users",
  "Auth breaks after deploy",
  "Duplicate files confuse the app",
  "AI routes have no limits",
  "Vercel build fails",
  "No launch checklist",
  "No idea what to fix first",
];

const solutions = [
  "Launch readiness score",
  "Bug finder",
  "Duplicate/conflict detector",
  "Missing feature map",
  "Builder-ready prompts",
  "Re-scan verification",
  "Markdown reports",
];

const features = [
  "App Completion Scan",
  "Bug Finder",
  "Duplicate Finder",
  "Launch Plan",
  "Prompt Packs",
  "Reports",
  "Rescan Verification",
];

const targetUsers = [
  "Solo founders",
  "Vibe coders",
  "Cursor users",
  "Lovable users",
  "Replit users",
  "Agencies",
  "SaaS builders",
  "AI app builders",
];

const pricing = [
  {
    name: "Free",
    price: "$0",
    items: ["1 project", "Basic scan", "Basic report"],
  },
  {
    name: "Pro",
    price: "Pricing ready",
    items: [
      "Unlimited projects",
      "Full bug finder",
      "Duplicate detector",
      "Prompt packs",
      "Markdown exports",
    ],
  },
  {
    name: "Team",
    price: "Coming soon",
    items: ["Shared projects", "Scan history", "Team reports", "Advanced checks"],
  },
];

export function LandingPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <nav className="flex items-center justify-between rounded-2xl border border-white/10 bg-zinc-950/70 px-4 py-3 backdrop-blur">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-sky-300/30 bg-blue-500/15 font-mono text-sm font-semibold text-sky-100">
            AF
          </span>
          <span className="font-semibold text-white">AppFinisher AI</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="hidden rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 sm:inline-flex"
          >
            Open Demo
          </Link>
          <Link
            href="/scan"
            className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500"
          >
            Run Demo Scan
          </Link>
        </div>
      </nav>

      <section className="grid gap-8 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="mb-4 inline-flex rounded-full border border-sky-300/25 bg-blue-500/10 px-3 py-1 text-xs font-medium text-sky-100">
            Deterministic ShipGuard Engine demo
          </p>
          <h1 className="max-w-5xl text-5xl font-semibold tracking-tight text-white sm:text-7xl">
            Finish your AI-built app without guessing what is broken.
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-zinc-400 sm:text-lg">
            AppFinisher AI is a launch-completion system for unfinished AI-built SaaS apps.
            It helps founders and AI-builder users identify detected risks, prioritize
            recommended fixes, and generate builder-ready prompts for Cursor, Lovable,
            Claude Code, Replit, Bolt, Windsurf, and more.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/scan"
              className="inline-flex justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-950/40 hover:bg-blue-500"
            >
              Run Demo Scan
            </Link>
            <Link
              href="/reports"
              className="inline-flex justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              View Demo Report
            </Link>
          </div>
        </div>
        <Card className="bg-gradient-to-br from-blue-500/15 via-sky-400/5 to-zinc-950">
          <p className="text-sm text-zinc-400">Example risk output</p>
          <p className="mt-3 font-mono text-5xl font-semibold text-white">68%</p>
          <p className="mt-2 text-sm text-zinc-500">Your app is 68% launch-ready.</p>
          <div className="mt-6 space-y-3">
            {[
              "Stripe webhook not verified",
              "Duplicate Supabase clients",
              "AI route missing rate limit",
              "No password reset flow",
            ].map((item) => (
              <div key={item} className="rounded-xl border border-sky-300/20 bg-blue-500/10 p-3 text-sm text-sky-100">
                <span className="mr-2 font-mono">!</span>
                {item}
              </div>
            ))}
          </div>
        </Card>
      </section>

      <LandingSection eyebrow="The stuck point" title="AI can build 80% of your app. The last 20% is where founders get stuck.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {painPoints.map((point) => (
            <Pill key={point} text={point} tone="blue" />
          ))}
        </div>
      </LandingSection>

      <LandingSection eyebrow="Solution" title="AppFinisher gives you a launch-completion workflow.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {solutions.map((item) => (
            <Pill key={item} text={item} tone="blue" />
          ))}
        </div>
      </LandingSection>

      <LandingSection eyebrow="How it works" title="From unfinished app to verified progress.">
        <div className="grid gap-4 md:grid-cols-7">
          {[
            "Create project",
            "Paste file tree or connect repo later",
            "Run scan",
            "Get launch plan",
            "Generate Cursor/Lovable prompts",
            "Apply fixes",
            "Re-scan",
          ].map((step, index) => (
            <Card key={step}>
              <span className="font-mono text-sm text-sky-300">0{index + 1}</span>
              <p className="mt-3 text-sm font-medium text-white">{step}</p>
            </Card>
          ))}
        </div>
      </LandingSection>

      <LandingSection eyebrow="Features" title="Everything in the current mock-backed demo.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Card key={feature}>
              <p className="font-medium text-white">{feature}</p>
              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Deterministic demo data, copy-ready prompts, and markdown outputs.
              </p>
            </Card>
          ))}
        </div>
      </LandingSection>

      <LandingSection eyebrow="Built for" title="AI builders who need a launch checklist that actually points to fixes.">
        <div className="flex flex-wrap gap-3">
          {targetUsers.map((user) => (
            <Pill key={user} text={user} tone="zinc" />
          ))}
        </div>
      </LandingSection>

      <LandingSection eyebrow="Pricing" title="Pricing-ready UI. Stripe is not connected in this demo.">
        <div className="grid gap-4 lg:grid-cols-3">
          {pricing.map((plan) => (
            <Card key={plan.name} className={plan.name === "Pro" ? "border-sky-300/30 bg-blue-500/10" : ""}>
              <p className="text-lg font-semibold text-white">{plan.name}</p>
              <p className="mt-2 font-mono text-2xl font-semibold text-white">{plan.price}</p>
              <ul className="mt-5 space-y-3">
                {plan.items.map((item) => (
                  <li key={item} className="text-sm text-zinc-300">
                    <span className="mr-2 font-mono text-sky-300">+</span>
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center text-xs font-medium text-zinc-400">
                Stripe checkout coming later
              </p>
            </Card>
          ))}
        </div>
      </LandingSection>

      <LandingSection eyebrow="Trust" title="AppFinisher helps reduce launch risk without overstating certainty.">
        <Card>
          <p className="text-base leading-7 text-zinc-300">
            AppFinisher is currently a deterministic demo product, not a live production scanner.
            It proves the workflow: scan, diagnose, generate fix prompts, apply fixes,
            re-scan, and verify progress before production review.
          </p>
        </Card>
      </LandingSection>

      <section className="py-14">
        <div className="rounded-3xl border border-sky-300/20 bg-gradient-to-br from-blue-500/20 via-sky-400/10 to-zinc-950 p-8 text-center">
          <h2 className="text-3xl font-semibold text-white sm:text-5xl">
            From 80% built to launch-ready.
          </h2>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/scan" className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500">
              Run Demo Scan
            </Link>
            <Link href="/dashboard" className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">
              Open Demo Dashboard
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function LandingSection({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="py-12">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-sky-300">
        {eyebrow}
      </p>
      <h2 className="mb-6 max-w-4xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Pill({ text, tone }: { text: string; tone: "blue" | "zinc" }) {
  const tones = {
    blue: "border-sky-300/20 bg-blue-500/10 text-sky-100",
    zinc: "border-white/10 bg-white/[0.03] text-zinc-300",
  };

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${tones[tone]}`}>
      {text}
    </div>
  );
}
