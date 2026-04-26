"use client";

import { useMemo, useState } from "react";
import { SeverityBadge, StatusBadge } from "@/components/status-badge";
import { Card, MetricCard, PageHeader, SectionTitle } from "@/components/ui";
import {
  detailedProject,
  mockBugFindings,
  mockDuplicateGroups,
  mockLaunchReadinessCategories,
  mockScanIssues,
  mockScans,
} from "@/lib/mock";
import {
  generateLaunchPlan,
  generateLaunchPlanMarkdown,
  type FixOrderPhase,
  type LaunchPlanItem,
  type LaunchPlanPhase,
} from "@/lib/launch-plan";
import {
  generatePromptPack,
  toolProfiles,
  type PromptPackInput,
  type PromptPackOutput,
} from "@/lib/promptpack";
import type { BuilderTarget, IssueSeverity } from "@/lib/types";

const promptTargets: BuilderTarget[] = ["cursor", "lovable", "claude_code"];

export function LaunchPlanPageContent() {
  const [exportOpen, setExportOpen] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);
  const [activePrompt, setActivePrompt] = useState<PromptPackOutput | null>(null);
  const [copied, setCopied] = useState(false);

  const plan = useMemo(() => {
    const scan = mockScans.find((item) => item.projectId === detailedProject.id) ?? mockScans[0];

    return generateLaunchPlan({
      appName: detailedProject.name,
      scan,
      issues: mockScanIssues.filter((issue) => issue.projectId === detailedProject.id),
      bugFindings: mockBugFindings.filter((bug) => bug.projectId === detailedProject.id),
      duplicateGroups: mockDuplicateGroups.filter((group) => group.projectId === detailedProject.id),
      categoryScores: mockLaunchReadinessCategories.filter((category) => category.scanId === scan.id),
    });
  }, []);

  const markdown = useMemo(() => generateLaunchPlanMarkdown(plan), [plan]);

  function openPhasePrompt(phase: FixOrderPhase, targetTool: BuilderTarget) {
    setActivePrompt(generatePromptPack(createPhasePromptInput(phase, targetTool)));
    setPromptOpen(true);
    setCopied(false);
  }

  async function copyText(value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  function downloadMarkdown() {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${plan.appName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-launch-plan.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Launch Plan"
        subtitle="A deterministic roadmap that converts the current mock scan into a prioritized pre-launch fix order."
        action={
          <button
            type="button"
            onClick={() => {
              setExportOpen(true);
              setCopied(false);
            }}
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-950/40 transition hover:bg-blue-500"
          >
            Export Launch Plan
          </button>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          label="Launch readiness"
          value={`${plan.launchScore}%`}
          detail={`Your app is ${plan.launchScore}% launch-ready.`}
          tone={plan.launchScore >= 80 ? "green" : "amber"}
        />
        <Card>
          <p className="text-sm text-zinc-400">Launch status</p>
          <div className="mt-4">
            <StatusBadge status={statusForLaunch(plan.launchStatus)} />
          </div>
          <p className="mt-4 text-xs leading-5 text-zinc-500">
            Based on the current mock scan score and open launch blockers.
          </p>
        </Card>
        <MetricCard
          label="Required fixes"
          value={plan.requiredBeforeLaunch.length}
          detail="Must resolve before launch"
          tone="red"
        />
        <MetricCard
          label="Prompt phases"
          value={plan.promptPackRecommendations.length}
          detail="Cursor, Lovable, Claude Code actions"
          tone="blue"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card>
          <SectionTitle
            title="Next recommended fix"
            subtitle="Selected by severity, launch phase, blocker status, and prompt availability."
          />
          {plan.nextRecommendedFix ? (
            <PlanItemCard item={plan.nextRecommendedFix} />
          ) : (
            <p className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-500">
              No next fix selected from current scan evidence.
            </p>
          )}
        </Card>
        <Card>
          <SectionTitle
            title="Trust guardrails"
            subtitle="Score/status caps that prevent overstating launch readiness."
          />
          <div className="space-y-3">
            {plan.consistencyNotes.length > 0 ? (
              plan.consistencyNotes.map((note) => (
                <p key={note} className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
                  {note}
                </p>
              ))
            ) : (
              <p className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-500">
                No score guardrail warnings for the current plan.
              </p>
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <PlanSection title="Required Before Launch" items={plan.requiredBeforeLaunch} />
        <PlanSection
          title="Recommended Before Paid Launch"
          items={plan.recommendedBeforePaidLaunch}
        />
        <PlanSection title="Optional After Launch" items={plan.optionalAfterLaunch} />
      </div>

      <Card>
        <SectionTitle
          title="Fix order"
          subtitle="Prioritized roadmap from deploy blockers through final smoke test."
        />
        <div className="space-y-4">
          {plan.fixOrderPhases.map((phase) => (
            <PhaseCard key={phase.phase} phase={phase} onPrompt={openPhasePrompt} />
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle
          title="Final smoke test checklist"
          subtitle="Run these checks after phase fixes are complete."
        />
        <div className="grid gap-3 md:grid-cols-2">
          {plan.finalSmokeTestChecklist.map((item) => (
            <div key={item} className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <span className="font-mono text-sm text-sky-300">[ ]</span>
              <p className="text-sm leading-6 text-zinc-300">{item}</p>
            </div>
          ))}
        </div>
      </Card>

      {exportOpen ? (
        <TextModal
          title="Markdown Launch Plan"
          subtitle={`${plan.appName} / ${plan.launchStatus}`}
          text={markdown}
          copied={copied}
          primaryLabel={copied ? "Copied" : "Copy Markdown"}
          secondaryLabel="Download .md"
          onPrimary={() => copyText(markdown)}
          onSecondary={downloadMarkdown}
          onClose={() => {
            setExportOpen(false);
            setCopied(false);
          }}
        />
      ) : null}

      {promptOpen && activePrompt ? (
        <TextModal
          title="Generated Phase Prompt"
          subtitle={`${activePrompt.title} / ${toolProfiles[activePrompt.targetTool].name}`}
          text={activePrompt.prompt}
          copied={copied}
          primaryLabel={copied ? "Copied" : "Copy Prompt"}
          onPrimary={() => copyText(activePrompt.prompt)}
          onClose={() => {
            setPromptOpen(false);
            setActivePrompt(null);
            setCopied(false);
          }}
        />
      ) : null}
    </div>
  );
}

function PlanSection({ title, items }: { title: string; items: LaunchPlanItem[] }) {
  return (
    <Card>
      <SectionTitle title={title} subtitle={`${items.length} item${items.length === 1 ? "" : "s"}`} />
      <div className="space-y-3">
        {items.slice(0, 8).map((item) => (
          <PlanItemCard key={item.id} item={item} compact />
        ))}
      </div>
    </Card>
  );
}

function PlanItemCard({ item, compact = false }: { item: LaunchPlanItem; compact?: boolean }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <SeverityBadge severity={item.severity} />
        <StatusBadge status={{ label: item.category, icon: "C", tone: "blue" }} />
      </div>
      <p className="font-medium text-white">{item.title}</p>
      {!compact ? (
        <>
          <p className="mt-2 text-sm leading-6 text-zinc-500">{item.whyItMatters}</p>
          <p className="mt-2 text-sm leading-6 text-zinc-300">{item.recommendedFix}</p>
        </>
      ) : (
        <p className="mt-2 text-sm leading-6 text-zinc-500">{item.recommendedFix}</p>
      )}
    </div>
  );
}

function PhaseCard({
  phase,
  onPrompt,
}: {
  phase: FixOrderPhase;
  onPrompt: (phase: FixOrderPhase, targetTool: BuilderTarget) => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">{phase.phase}</h2>
          <p className="mt-1 text-sm text-zinc-500">{phase.summary}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {promptTargets.map((target) => (
            <button
              key={target}
              type="button"
              onClick={() => onPrompt(phase, target)}
              disabled={phase.items.length === 0}
              className="rounded-xl border border-sky-300/30 bg-blue-500/10 px-3 py-2 text-xs font-semibold text-sky-100 transition hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Generate {toolProfiles[target].name} prompt
            </button>
          ))}
        </div>
      </div>
      {phase.items.length > 0 ? (
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {phase.items.map((item) => (
            <PlanItemCard key={item.id} item={item} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function createPhasePromptInput(phase: FixOrderPhase, targetTool: BuilderTarget): PromptPackInput {
  return {
    id: phase.phase.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    issueType: issueTypeForPhase(phase.phase),
    title: `${phase.phase} launch fixes`,
    severity: highestSeverity(phase.items),
    targetTool,
    filesToInspect: filesForPhase(phase.phase),
    knownIssue: phase.items.map((item) => `- ${item.title}: ${item.whyItMatters}`).join("\n"),
    goal: `Resolve the ${phase.phase.toLowerCase()} items before moving to the next launch phase.`,
    constraints: [
      "Use the current mock launch plan as scope.",
      "Do not implement unrelated systems.",
      "Keep changes narrow and verify before continuing.",
    ],
    successCriteria: phase.items.map((item) => item.recommendedFix),
    verificationSteps: [
      "Inspect the listed files before editing.",
      "Apply only the fixes needed for this phase.",
      "Run lint/build or typecheck if available.",
      "Verify each phase item is resolved.",
      "Stop before starting the next phase.",
    ],
    recommendedContext:
      "AppFinisher AI generated this phase prompt from a deterministic launch plan, not from an LLM call.",
  };
}

function issueTypeForPhase(phase: LaunchPlanPhase): PromptPackInput["issueType"] {
  if (phase.includes("Billing")) return "stripe_billing_fix";
  if (phase.includes("Database")) return "supabase_rls_fix";
  if (phase.includes("Auth")) return "auth_onboarding_fix";
  if (phase.includes("AI")) return "ai_route_rate_limit_fix";
  if (phase.includes("Build")) return "deployment_vercel_fix";
  if (phase.includes("Legal")) return "legal_trust_page_creation";
  if (phase.includes("Customer")) return "customer_onboarding_improvement";
  if (phase.includes("Observability")) return "launch_readiness_fix";
  return "launch_readiness_fix";
}

function filesForPhase(phase: LaunchPlanPhase) {
  if (phase.includes("Build")) return ["package.json", ".env.example", "next.config.ts", "app"];
  if (phase.includes("Auth")) return ["app/login", "app/signup", "app/onboarding", "middleware.ts"];
  if (phase.includes("Billing")) return ["app/billing", "app/api/stripe", "lib/stripe.ts", ".env.example"];
  if (phase.includes("Database")) return ["supabase/schema.sql", "supabase/rls.sql", "lib/supabase"];
  if (phase.includes("AI")) return ["app/api/ai", "lib/ai", ".env.example"];
  if (phase.includes("Legal")) return ["app/privacy", "app/terms", "app/support"];
  if (phase.includes("Customer")) return ["app/onboarding", "app/dashboard", "components"];
  if (phase.includes("Observability")) return ["app/api", "lib", "components/admin"];
  return ["app", "lib", "components"];
}

function highestSeverity(items: LaunchPlanItem[]): IssueSeverity {
  if (items.some((item) => item.severity === "critical")) return "critical";
  if (items.some((item) => item.severity === "high")) return "high";
  if (items.some((item) => item.severity === "medium")) return "medium";
  return "low";
}

function statusForLaunch(status: string) {
  if (status === "Launch Ready") return { label: status, icon: "+", tone: "green" as const };
  if (status === "Almost Ready") return { label: status, icon: "-", tone: "blue" as const };
  if (status === "Needs Work") return { label: status, icon: "!", tone: "amber" as const };
  return { label: status, icon: "x", tone: "red" as const };
}

function TextModal({
  title,
  subtitle,
  text,
  copied,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  onClose,
}: {
  title: string;
  subtitle: string;
  text: string;
  copied: boolean;
  primaryLabel: string;
  secondaryLabel?: string;
  onPrimary: () => void;
  onSecondary?: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
      <div className="w-full max-w-5xl rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl shadow-black">
        <div className="flex flex-col gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300">
              AppFinisher AI
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">{title}</h2>
            <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onPrimary}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
            >
              {copied ? "Copied" : primaryLabel}
            </button>
            {secondaryLabel && onSecondary ? (
              <button
                type="button"
                onClick={onSecondary}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
              >
                {secondaryLabel}
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
            >
              Close
            </button>
          </div>
        </div>
        <div className="max-h-[72vh] overflow-auto p-5">
          <pre className="whitespace-pre-wrap rounded-xl border border-white/10 bg-black/40 p-4 font-mono text-xs leading-6 text-zinc-200">
            {text}
          </pre>
        </div>
      </div>
    </div>
  );
}
