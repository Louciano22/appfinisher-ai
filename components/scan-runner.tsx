"use client";

import { useState } from "react";
import { StatusBadge, SeverityBadge } from "@/components/status-badge";
import { Card, MetricCard, PageHeader, SectionTitle } from "@/components/ui";
import { demoSaasFileTree, detailedProject, formatBuilderTarget } from "@/lib/mock";
import {
  generateLaunchPlanFromScanResult,
  scanProject,
  type ScanResult,
} from "@/lib/shipguard-engine";

export function ScanRunner() {
  const [result, setResult] = useState<ScanResult | null>(null);

  function runMockScan() {
    setResult(
      scanProject(demoSaasFileTree, {
        projectId: detailedProject.id,
        name: detailedProject.name,
        stack: detailedProject.stack,
        framework: detailedProject.framework,
        database: detailedProject.database,
        billingProvider: detailedProject.billingProvider,
        deploymentProvider: detailedProject.deploymentProvider,
        aiProvider: detailedProject.aiProvider,
      }),
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Project Scan"
        subtitle="Run the first deterministic mocked ShipGuard Engine scan against Demo SaaS App. This uses path and content-preview heuristics only."
        action={
          <button
            type="button"
            onClick={runMockScan}
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-950/40 transition hover:bg-blue-500"
          >
            Run Mock Scan
          </button>
        }
      />

      <Card>
        <SectionTitle
          title="Mock project input"
          subtitle="No GitHub, ZIP, filesystem walking, or AST parsing is used in this step."
        />
        <div className="grid gap-4 md:grid-cols-4">
          <ProjectFact label="Project" value={detailedProject.name} />
          <ProjectFact label="Framework" value={detailedProject.framework} />
          <ProjectFact label="AI builder" value={formatBuilderTarget(detailedProject.aiProvider)} />
          <ProjectFact label="Stack" value={detailedProject.stack.join(", ")} />
        </div>
      </Card>

      {result ? <ScanResults result={result} /> : <EmptyScanState />}
    </div>
  );
}

function ScanResults({ result }: { result: ScanResult }) {
  const launchPlan = generateLaunchPlanFromScanResult(detailedProject.name, result);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Guarded score"
          value={`${launchPlan.launchScore}%`}
          detail={launchPlan.launchStatus}
          tone={launchPlan.launchScore >= 80 ? "green" : "amber"}
        />
        <MetricCard
          label="Critical blockers"
          value={result.criticalBlockers.length}
          detail="Must fix before launch"
          tone="red"
        />
        <MetricCard label="Issues" value={result.issues.length} detail="Readiness rule failures" tone="amber" />
        <MetricCard label="Bugs" value={result.bugFindings.length} detail="Heuristic bug findings" tone="blue" />
        <MetricCard
          label="Duplicates"
          value={result.duplicateGroups.length}
          detail="Conflict groups"
          tone="blue"
        />
      </div>

      {launchPlan.consistencyNotes.length > 0 ? (
        <Card>
          <SectionTitle
            title="Score guardrails"
            subtitle="The raw scan score is adjusted before launch status is displayed."
          />
          <div className="space-y-3">
            <p className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-zinc-400">
              Raw ShipGuard score: {result.overallScore}%. Guarded launch score: {launchPlan.launchScore}%.
            </p>
            {launchPlan.consistencyNotes.map((note) => (
              <p key={note} className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
                {note}
              </p>
            ))}
          </div>
        </Card>
      ) : null}

      <Card>
        <SectionTitle title="Scan summary" subtitle={result.summary} />
        <div className="grid gap-3 md:grid-cols-2">
          {result.recommendedNextFixes.map((fix, index) => (
            <div key={fix} className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <span className="font-mono text-sm text-sky-300">0{index + 1}</span>
              <p className="text-sm leading-6 text-zinc-300">{fix}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle title="Category scores" subtitle="Each score is computed from deterministic rule penalties." />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {result.categoryScores.map((category) => (
            <div key={category.categoryName} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-white">{category.categoryName}</p>
                  <p className="mt-1 text-xs leading-5 text-zinc-500">{category.summary}</p>
                </div>
                <StatusBadge status={categoryStatus(category.status)} />
              </div>
              <p className="mt-4 font-mono text-2xl font-semibold text-white">{category.score}%</p>
              {category.blockers.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {category.blockers.map((blocker) => (
                    <li key={blocker} className="text-xs leading-5 text-zinc-400">
                      {blocker}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle title="Critical blockers" subtitle="Highest-risk launch blockers from v1 rules." />
        <IssueList issues={result.criticalBlockers} empty="No critical blockers found." />
      </Card>

      <Card>
        <SectionTitle title="Launch readiness issues" subtitle="Rule failures kept separate from bugs and duplicates." />
        <IssueList issues={result.issues} empty="No launch readiness issues found." />
      </Card>

      <Card>
        <SectionTitle title="Bug findings" subtitle="Simple content-preview heuristics, not AST parsing." />
        <div className="space-y-3">
          {result.bugFindings.map((bug) => (
            <div key={bug.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-white">{bug.title}</p>
                  <p className="mt-1 font-mono text-xs text-zinc-500">{bug.filePath}</p>
                </div>
                <SeverityBadge severity={bug.severity} />
              </div>
              <p className="mt-3 text-sm leading-6 text-zinc-400">{bug.evidence}</p>
              <p className="mt-3 text-sm leading-6 text-zinc-300">{bug.recommendedFix}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle title="Duplicate/conflict groups" subtitle="Path-based duplicate and route-conflict detection." />
        <div className="space-y-3">
          {result.duplicateGroups.map((group) => (
            <div key={group.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-white">{group.title}</p>
                  <p className="mt-1 text-sm text-zinc-500">{group.conflictRisk}</p>
                </div>
                <SeverityBadge severity={group.severity} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {group.files.map((file) => (
                  <span key={file} className="rounded-lg bg-white/5 px-2.5 py-1 font-mono text-xs text-zinc-300">
                    {file}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-sm leading-6 text-zinc-300">{group.recommendedAction}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function IssueList({
  issues,
  empty,
}: {
  issues: ScanResult["issues"];
  empty: string;
}) {
  if (issues.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-6 text-sm text-zinc-500">
        {empty}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {issues.map((issue) => (
        <div key={issue.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-white">{issue.title}</p>
              <p className="mt-1 text-xs text-zinc-500">{issue.description}</p>
            </div>
            <SeverityBadge severity={issue.severity} />
          </div>
          <p className="mt-3 text-sm leading-6 text-zinc-300">{issue.recommendedFix}</p>
          <div className="mt-3 rounded-xl border border-sky-300/20 bg-blue-500/10 p-3">
            <StatusBadge status={{ label: "AI Generated", icon: "*", tone: "accent" }} />
            <p className="mt-2 text-sm leading-6 text-sky-100">{issue.builderPromptHint}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyScanState() {
  return (
    <Card>
      <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center">
        <p className="font-medium text-white">Mock scan ready</p>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
          Click Run Mock Scan to execute ShipGuard Engine v1 against a deterministic FileTree.
          The result will show category scores, launch readiness issues, bugs, and duplicate groups.
        </p>
      </div>
    </Card>
  );
}

function ProjectFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-2 text-sm font-medium text-white">{value}</p>
    </div>
  );
}

function categoryStatus(status: string) {
  if (status === "pass") return { label: "Pass", icon: "+", tone: "green" as const };
  if (status === "warning") return { label: "Warning", icon: "!", tone: "amber" as const };
  return { label: "Fail", icon: "x", tone: "red" as const };
}
