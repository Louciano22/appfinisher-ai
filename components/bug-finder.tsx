"use client";

import { useMemo, useState } from "react";
import { SeverityBadge, StatusBadge } from "@/components/status-badge";
import { Card, MetricCard, PageHeader, SectionTitle } from "@/components/ui";
import { bugTypeLabels, mockBugFinderFindings } from "@/lib/mock";
import { generateBugFixPrompt, type EngineBugFinding } from "@/lib/shipguard-engine";
import type { IssueSeverity } from "@/lib/types";

const severityOptions = ["all", "critical", "high", "medium", "low"] as const;

export function BugFinder() {
  const [severityFilter, setSeverityFilter] = useState<(typeof severityOptions)[number]>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | EngineBugFinding["bugType"]>("all");
  const [selectedBug, setSelectedBug] = useState<EngineBugFinding | null>(null);
  const [copied, setCopied] = useState(false);

  const bugTypes = useMemo(
    () => Array.from(new Set(mockBugFinderFindings.map((bug) => bug.bugType))),
    [],
  );

  const filteredBugs = mockBugFinderFindings.filter((bug) => {
    const severityMatches = severityFilter === "all" || bug.severity === severityFilter;
    const typeMatches = typeFilter === "all" || bug.bugType === typeFilter;

    return severityMatches && typeMatches;
  });

  const criticalCount = mockBugFinderFindings.filter((bug) => bug.severity === "critical").length;
  const highRiskCount = mockBugFinderFindings.filter(
    (bug) => bug.severity === "critical" || bug.severity === "high",
  ).length;
  const prompt = selectedBug ? generateBugFixPrompt(selectedBug) : "";

  async function copyPrompt() {
    if (!prompt) return;

    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Bug Finder"
        subtitle="Deterministic mock bug detection for unfinished AI-built apps. This version uses curated findings only, with scoped Cursor-style fix prompts."
        action={<StatusBadge status={{ label: "Mock Data", icon: "-", tone: "accent" }} />}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Total bugs found"
          value={mockBugFinderFindings.length}
          detail="Deterministic mock findings"
        />
        <MetricCard
          label="Critical bugs"
          value={criticalCount}
          detail="Must fix before launch"
          tone="red"
        />
        <MetricCard
          label="High-risk bugs"
          value={highRiskCount}
          detail="Critical plus high severity"
          tone="amber"
        />
      </div>

      <Card>
        <SectionTitle
          title="Filters"
          subtitle="Filter mock bug findings by severity or bug type."
        />
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-zinc-300">Severity</span>
            <select
              value={severityFilter}
              onChange={(event) =>
                setSeverityFilter(event.target.value as typeof severityFilter)
              }
              className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-sky-300"
            >
              {severityOptions.map((severity) => (
                <option key={severity} value={severity}>
                  {severity === "all" ? "All severities" : capitalize(severity)}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-zinc-300">Bug type</span>
            <select
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(event.target.value as typeof typeFilter)
              }
              className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-sky-300"
            >
              <option value="all">All bug types</option>
              {bugTypes.map((type) => (
                <option key={type} value={type}>
                  {bugTypeLabels[type]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Card>

      <Card>
        <SectionTitle
          title="Bug list"
          subtitle={`${filteredBugs.length} finding${filteredBugs.length === 1 ? "" : "s"} shown.`}
        />
        <div className="space-y-4">
          {filteredBugs.map((bug) => (
            <BugCard key={bug.id} bug={bug} onGeneratePrompt={() => setSelectedBug(bug)} />
          ))}
          {filteredBugs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center">
              <p className="font-medium text-white">No bugs match these filters</p>
              <p className="mt-2 text-sm text-zinc-500">Adjust severity or bug type to see mock findings.</p>
            </div>
          ) : null}
        </div>
      </Card>

      {selectedBug ? (
        <PromptModal
          bug={selectedBug}
          prompt={prompt}
          copied={copied}
          onCopy={copyPrompt}
          onClose={() => {
            setSelectedBug(null);
            setCopied(false);
          }}
        />
      ) : null}
    </div>
  );
}

function BugCard({
  bug,
  onGeneratePrompt,
}: {
  bug: EngineBugFinding;
  onGeneratePrompt: () => void;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <SeverityBadge severity={bug.severity} />
            <StatusBadge status={{ label: bugTypeLabels[bug.bugType], icon: "B", tone: "blue" }} />
          </div>
          <h2 className="text-lg font-semibold text-white">{bug.title}</h2>
          <p className="mt-2 font-mono text-xs text-zinc-500">{bug.filePath}</p>
        </div>
        <button
          type="button"
          onClick={onGeneratePrompt}
          className="inline-flex shrink-0 justify-center rounded-xl border border-sky-300/30 bg-blue-500/10 px-4 py-2.5 text-sm font-semibold text-sky-100 transition hover:bg-blue-500/20"
        >
          Generate Fix Prompt
        </button>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <BugDetail title="Evidence" value={bug.evidence} />
        <BugDetail title="Why it matters" value={bug.whyItMatters} />
        <BugDetail title="Recommended fix" value={bug.recommendedFix} />
        <BugDetail title="Success criteria" value={bug.successCriteria} />
      </div>
    </article>
  );
}

function BugDetail({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">{title}</p>
      <p className="mt-2 text-sm leading-6 text-zinc-300">{value}</p>
    </div>
  );
}

function PromptModal({
  bug,
  prompt,
  copied,
  onCopy,
  onClose,
}: {
  bug: EngineBugFinding;
  prompt: string;
  copied: boolean;
  onCopy: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
      <div className="w-full max-w-4xl rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl shadow-black">
        <div className="flex flex-col gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300">
              Generated Cursor Prompt
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">{bug.title}</h2>
            <p className="mt-1 text-sm text-zinc-500">{bug.filePath}</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCopy}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
            >
              {copied ? "Copied" : "Copy Prompt"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
            >
              Close
            </button>
          </div>
        </div>
        <div className="max-h-[70vh] overflow-auto p-5">
          <pre className="whitespace-pre-wrap rounded-xl border border-white/10 bg-black/40 p-4 font-mono text-xs leading-6 text-zinc-200">
            {prompt}
          </pre>
        </div>
      </div>
    </div>
  );
}

function capitalize(value: IssueSeverity | "all") {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
