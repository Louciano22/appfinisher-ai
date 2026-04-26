"use client";

import { useMemo, useState } from "react";
import { Card, MetricCard, PageHeader, SectionTitle } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import {
  envDoctorFindings,
  fixPlanSteps,
  launchOsIdeas,
  launchRoomGates,
  launchTimeline,
  promptBundles,
  readmeAuditItems,
  riskHeatmap,
  stripeAuditItems,
  supabaseAuditItems,
  type LaunchOsStatus,
  type RiskHeatmapItem,
} from "@/lib/wow-suite";
import { formatBuilderTarget } from "@/lib/mock";

const modeCopy = {
  founder: {
    title: "Founder Mode",
    body:
      "Stripe webhook verification is a revenue-risk blocker. If this is wrong, users may pay but never receive access, or keep access after cancellation.",
  },
  engineer: {
    title: "Engineer Mode",
    body:
      "Inspect `app/api/stripe/webhooks/route.ts`, verify `constructEvent` or equivalent signature handling, persist idempotent event processing, and keep secrets server-only.",
  },
};

export function LaunchOs() {
  const [mode, setMode] = useState<"founder" | "engineer">("founder");
  const passedGates = launchRoomGates.filter((gate) => gate.passed).length;
  const badgeMarkdown = useMemo(
    () => "![AppFinisher Launch Readiness](https://img.shields.io/badge/AppFinisher-89%25%20Almost%20Ready-blue)",
    [],
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Launch OS"
        subtitle="The premium command-center vision for AppFinisher AI, where readiness, fixes, prompts, risk analysis, and final launch verification come together in one place."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Wow modules" value={launchOsIdeas.length} detail="All requested enhancements represented" />
        <MetricCard label="Launch gates" value={`${passedGates}/${launchRoomGates.length}`} detail="Final Launch Room pass state" tone="amber" />
        <MetricCard label="Prompt bundles" value={promptBundles.length} detail="Grouped builder-ready fix packs" tone="blue" />
        <MetricCard label="Guarded score" value="89%" detail="Almost Ready until blockers clear" tone="green" />
      </div>

      <FeatureMatrix />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <TimelinePanel />
        <RiskHeatmap />
      </div>

      <FixPlanPanel />
      <PromptBundlePanel />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <BuilderModePanel mode={mode} setMode={setMode} />
        <ExplainerPanel />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <ChecklistPanel title="README Audit" subtitle="Auto-generated documentation readiness checks." items={readmeAuditItems} />
        <ChecklistPanel title="Environment Variable Doctor" subtitle="Deploy-breaking env mistakes surfaced early." items={envDoctorFindings} />
        <ChecklistPanel title="Supabase RLS Auditor" subtitle="Dedicated database safety checks." items={supabaseAuditItems} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <ChecklistPanel title="Stripe Launch Auditor" subtitle="Billing readiness as a focused specialist audit." items={stripeAuditItems} />
        <LaunchRoomPanel />
      </div>

      <ScoreBadgePanel markdown={badgeMarkdown} />
    </div>
  );
}

function FeatureMatrix() {
  return (
    <Card>
      <SectionTitle
        title="15 Enhancement Modules"
        subtitle="Every idea is represented as a deterministic product surface with a clear real-integration path."
      />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {launchOsIdeas.map((idea) => (
          <div key={idea.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-white">{idea.title}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-zinc-500">{idea.category}</p>
              </div>
              <StatusBadge status={statusForIdea(idea.status)} />
            </div>
            <p className="text-sm leading-6 text-zinc-300">{idea.wowMoment}</p>
            <p className="mt-3 text-xs leading-5 text-zinc-500">{idea.currentDemo}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function TimelinePanel() {
  return (
    <Card>
      <SectionTitle title="Launch Readiness Timeline" subtitle="Before, during, and after scan progress." />
      <div className="space-y-4">
        {launchTimeline.map((item, index) => (
          <div key={item.label} className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:grid-cols-[6rem_1fr]">
            <div>
              <p className="font-mono text-2xl font-semibold text-white">{item.score}%</p>
              <p className="text-xs text-sky-300">Step 0{index + 1}</p>
            </div>
            <div>
              <p className="font-medium text-white">{item.label}</p>
              <p className="mt-1 text-sm leading-6 text-zinc-400">{item.summary}</p>
              <div className="mt-3 h-2 rounded-full bg-zinc-800">
                <div className="h-2 rounded-full bg-sky-400" style={{ width: `${item.score}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function RiskHeatmap() {
  return (
    <Card>
      <SectionTitle title="Risk Heatmap" subtitle="System-by-system launch risk at a glance." />
      <div className="grid gap-3 sm:grid-cols-2">
        {riskHeatmap.map((item) => (
          <div key={item.area} className={`rounded-xl border p-4 ${heatTone(item.severity)}`}>
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium text-white">{item.area}</p>
              <p className="font-mono text-lg text-white">{item.score}%</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-zinc-300">{item.insight}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function FixPlanPanel() {
  return (
    <Card>
      <SectionTitle title="One-Click Fix Plan" subtitle="Exact order, files, reason, and verification for the next fixes." />
      <div className="grid gap-4 xl:grid-cols-4">
        {fixPlanSteps.map((step) => (
          <div key={step.order} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="font-mono text-sm text-sky-300">Fix {step.order}</p>
            <p className="mt-2 font-medium text-white">{step.title}</p>
            <p className="mt-2 text-sm leading-6 text-zinc-400">{step.reason}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {step.files.map((file) => (
                <span key={file} className="rounded-lg bg-black/30 px-2 py-1 font-mono text-[11px] text-zinc-300">
                  {file}
                </span>
              ))}
            </div>
            <p className="mt-3 text-xs leading-5 text-zinc-500">{step.verification}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function PromptBundlePanel() {
  return (
    <Card>
      <SectionTitle title="PromptPack Bundles" subtitle="Grouped prompts for complete launch phases instead of one-off fixes." />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {promptBundles.map((bundle) => (
          <div key={bundle.title} className="rounded-xl border border-sky-300/20 bg-blue-500/10 p-4">
            <p className="font-medium text-white">{bundle.title}</p>
            <p className="mt-1 text-xs text-sky-100">{formatBuilderTarget(bundle.target)}</p>
            <p className="mt-4 font-mono text-3xl font-semibold text-white">{bundle.prompts}</p>
            <p className="mt-2 text-xs leading-5 text-zinc-400">{bundle.stopCondition}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function BuilderModePanel({
  mode,
  setMode,
}: {
  mode: "founder" | "engineer";
  setMode: (mode: "founder" | "engineer") => void;
}) {
  const active = modeCopy[mode];

  return (
    <Card>
      <SectionTitle title="Founder Mode vs Engineer Mode" subtitle="Same blocker, different explanation depth." />
      <div className="mb-4 flex gap-2">
        {(["founder", "engineer"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setMode(item)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${
              mode === item ? "bg-blue-600 text-white" : "border border-white/10 bg-white/5 text-zinc-300"
            }`}
          >
            {modeCopy[item].title}
          </button>
        ))}
      </div>
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <p className="font-medium text-white">{active.title}</p>
        <p className="mt-3 text-sm leading-6 text-zinc-300">{active.body}</p>
      </div>
    </Card>
  );
}

function ExplainerPanel() {
  const rows = [
    ["Why this blocks launch", "Paid users can lose access sync or receive access without a verified payment event."],
    ["What can go wrong", "Unsigned webhook calls, duplicate events, stale subscription state, and support refunds."],
    ["What to fix", "Verify signatures, document secrets, map customers to users, and add idempotency."],
    ["How to verify", "Run build, inspect server-only env usage, and simulate rejected unsigned events."],
  ];

  return (
    <Card>
      <SectionTitle title="Launch Blocker Explainer" subtitle="Severity becomes understandable and actionable." />
      <div className="grid gap-3 md:grid-cols-2">
        {rows.map(([title, body]) => (
          <div key={title} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="font-medium text-white">{title}</p>
            <p className="mt-2 text-sm leading-6 text-zinc-400">{body}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ChecklistPanel({ title, subtitle, items }: { title: string; subtitle: string; items: string[] }) {
  return (
    <Card>
      <SectionTitle title={title} subtitle={subtitle} />
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={item} className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <span className="font-mono text-sm text-sky-300">0{index + 1}</span>
            <p className="text-sm leading-6 text-zinc-300">{item}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function LaunchRoomPanel() {
  return (
    <Card>
      <SectionTitle title="Final Launch Room" subtitle="A cockpit view for launch gates and final readiness." />
      <div className="grid gap-3 sm:grid-cols-2">
        {launchRoomGates.map((gate) => (
          <div key={gate.gate} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-sm font-medium text-white">{gate.gate}</p>
            <StatusBadge
              status={
                gate.passed
                  ? { label: "Pass", icon: "+", tone: "green" }
                  : { label: "Needs proof", icon: "!", tone: "amber" }
              }
            />
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
        Soft launch is close, but not ready until auth, billing, AI limits, legal, and final smoke test gates pass.
      </div>
    </Card>
  );
}

function ScoreBadgePanel({ markdown }: { markdown: string }) {
  return (
    <Card>
      <SectionTitle title="AppFinisher Score Badge" subtitle="A shareable repo badge concept for launch readiness." />
      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-xl border border-sky-300/30 bg-blue-500/15 p-5">
          <p className="text-sm text-sky-100">AppFinisher Launch Readiness</p>
          <p className="mt-3 font-mono text-4xl font-semibold text-white">89%</p>
          <p className="mt-2 text-sm text-zinc-300">Almost Ready</p>
        </div>
        <pre className="overflow-auto rounded-xl border border-white/10 bg-black/40 p-4 font-mono text-xs leading-6 text-zinc-200">
          {markdown}
        </pre>
      </div>
    </Card>
  );
}

function statusForIdea(status: LaunchOsStatus) {
  if (status === "Live Demo") return { label: status, icon: "+", tone: "green" as const };
  if (status === "Ready Next") return { label: status, icon: ">", tone: "blue" as const };
  if (status === "Mocked") return { label: status, icon: "-", tone: "amber" as const };
  return { label: status, icon: "*", tone: "zinc" as const };
}

function heatTone(severity: RiskHeatmapItem["severity"]) {
  if (severity === "critical") return "border-red-400/25 bg-red-500/10";
  if (severity === "high") return "border-amber-400/25 bg-amber-500/10";
  if (severity === "medium") return "border-sky-400/25 bg-sky-500/10";
  return "border-emerald-400/25 bg-emerald-500/10";
}
