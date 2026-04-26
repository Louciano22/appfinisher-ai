"use client";

import { useMemo, useState } from "react";
import { SeverityBadge, StatusBadge } from "@/components/status-badge";
import { Card, MetricCard, PageHeader, SectionTitle } from "@/components/ui";
import { duplicateTypeLabels, mockDuplicateFinderGroups } from "@/lib/mock";
import {
  generateDuplicateResolutionPrompt,
  type EngineDuplicateGroup,
} from "@/lib/shipguard-engine";
import type { IssueSeverity } from "@/lib/types";

const severityOptions = ["all", "critical", "high", "medium", "low"] as const;

export function DuplicateFinder() {
  const [severityFilter, setSeverityFilter] = useState<(typeof severityOptions)[number]>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | EngineDuplicateGroup["duplicateType"]>(
    "all",
  );
  const [selectedGroup, setSelectedGroup] = useState<EngineDuplicateGroup | null>(null);
  const [copied, setCopied] = useState(false);

  const duplicateTypes = useMemo(
    () => Array.from(new Set(mockDuplicateFinderGroups.map((group) => group.duplicateType))),
    [],
  );

  const filteredGroups = mockDuplicateFinderGroups.filter((group) => {
    const severityMatches = severityFilter === "all" || group.severity === severityFilter;
    const typeMatches = typeFilter === "all" || group.duplicateType === typeFilter;

    return severityMatches && typeMatches;
  });

  const criticalCount = mockDuplicateFinderGroups.filter(
    (group) => group.severity === "critical",
  ).length;
  const filesToMergeCount = mockDuplicateFinderGroups.reduce(
    (total, group) => total + (group.filesToMerge?.length ?? 0),
    0,
  );
  const filesToArchiveCount = mockDuplicateFinderGroups.reduce(
    (total, group) => total + (group.filesToArchive?.length ?? 0),
    0,
  );
  const prompt = selectedGroup ? generateDuplicateResolutionPrompt(selectedGroup) : "";

  async function copyPrompt() {
    if (!prompt) return;

    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Duplicate Finder"
        subtitle="Deterministic mock duplicate and conflict detection for AI-built apps. This version uses curated groups only, with scoped resolution prompts."
        action={<StatusBadge status={{ label: "Mock Data", icon: "-", tone: "accent" }} />}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          label="Duplicate groups"
          value={mockDuplicateFinderGroups.length}
          detail="Deterministic mock conflicts"
        />
        <MetricCard
          label="Critical conflicts"
          value={criticalCount}
          detail="Highest-risk consolidation work"
          tone="red"
        />
        <MetricCard
          label="Files to merge"
          value={filesToMergeCount}
          detail="Useful logic candidates"
          tone="amber"
        />
        <MetricCard
          label="Files to archive"
          value={filesToArchiveCount}
          detail="After verification only"
          tone="blue"
        />
      </div>

      <Card>
        <SectionTitle
          title="Filters"
          subtitle="Filter mock duplicate/conflict groups by severity or type."
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
            <span className="text-sm font-medium text-zinc-300">Duplicate type</span>
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as typeof typeFilter)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-sky-300"
            >
              <option value="all">All duplicate types</option>
              {duplicateTypes.map((type) => (
                <option key={type} value={type}>
                  {duplicateTypeLabels[type]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Card>

      <Card>
        <SectionTitle
          title="Duplicate/conflict groups"
          subtitle={`${filteredGroups.length} group${filteredGroups.length === 1 ? "" : "s"} shown.`}
        />
        <div className="space-y-4">
          {filteredGroups.map((group) => (
            <DuplicateGroupCard
              key={group.id}
              group={group}
              onGeneratePrompt={() => setSelectedGroup(group)}
            />
          ))}
          {filteredGroups.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center">
              <p className="font-medium text-white">No duplicate groups match these filters</p>
              <p className="mt-2 text-sm text-zinc-500">
                Adjust severity or duplicate type to see mock conflicts.
              </p>
            </div>
          ) : null}
        </div>
      </Card>

      {selectedGroup ? (
        <ResolutionPromptModal
          group={selectedGroup}
          prompt={prompt}
          copied={copied}
          onCopy={copyPrompt}
          onClose={() => {
            setSelectedGroup(null);
            setCopied(false);
          }}
        />
      ) : null}
    </div>
  );
}

function DuplicateGroupCard({
  group,
  onGeneratePrompt,
}: {
  group: EngineDuplicateGroup;
  onGeneratePrompt: () => void;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <SeverityBadge severity={group.severity} />
            <StatusBadge
              status={{ label: duplicateTypeLabels[group.duplicateType], icon: "D", tone: "blue" }}
            />
          </div>
          <h2 className="text-lg font-semibold text-white">{group.title}</h2>
        </div>
        <button
          type="button"
          onClick={onGeneratePrompt}
          className="inline-flex shrink-0 justify-center rounded-xl border border-sky-300/30 bg-blue-500/10 px-4 py-2.5 text-sm font-semibold text-sky-100 transition hover:bg-blue-500/20"
        >
          Generate Resolution Prompt
        </button>
      </div>

      <div className="mt-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Files
        </p>
        <div className="flex flex-wrap gap-2">
          {group.files.map((file) => (
            <span key={file} className="rounded-lg bg-white/5 px-2.5 py-1 font-mono text-xs text-zinc-300">
              {file}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <GroupDetail title="Canonical recommendation" value={group.canonicalRecommendation} />
        <GroupDetail title="Conflict risk" value={group.conflictRisk} />
        <GroupDetail title="Recommended action" value={group.recommendedAction} />
        <GroupList title="Files to merge" values={group.filesToMerge} empty="No merge candidates listed" />
        <GroupList
          title="Files to remove/archive"
          values={group.filesToArchive}
          empty="Do not archive until verified"
        />
      </div>
    </article>
  );
}

function GroupDetail({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">{title}</p>
      <p className="mt-2 text-sm leading-6 text-zinc-300">{value}</p>
    </div>
  );
}

function GroupList({
  title,
  values,
  empty,
}: {
  title: string;
  values?: string[];
  empty: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">{title}</p>
      <div className="mt-2 space-y-2">
        {values && values.length > 0 ? (
          values.map((value) => (
            <p key={value} className="font-mono text-xs leading-5 text-zinc-300">
              {value}
            </p>
          ))
        ) : (
          <p className="text-sm text-zinc-500">{empty}</p>
        )}
      </div>
    </div>
  );
}

function ResolutionPromptModal({
  group,
  prompt,
  copied,
  onCopy,
  onClose,
}: {
  group: EngineDuplicateGroup;
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
              Generated Resolution Prompt
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">{group.title}</h2>
            <p className="mt-1 text-sm text-zinc-500">
              {duplicateTypeLabels[group.duplicateType]}
            </p>
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
