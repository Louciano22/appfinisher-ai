"use client";

import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/status-badge";
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
  generateAllReports,
  generateComparisonMarkdown,
  mockScanComparison,
  type GeneratedReport,
} from "@/lib/reports";
import { generatePromptPack, toolProfiles, type PromptPackOutput } from "@/lib/promptpack";

export function Reports() {
  const [activeText, setActiveText] = useState<{
    title: string;
    subtitle: string;
    text: string;
    filename?: string;
  } | null>(null);
  const [activePrompt, setActivePrompt] = useState<PromptPackOutput | null>(null);
  const [copied, setCopied] = useState(false);

  const scanInput = useMemo(() => {
    const scan = mockScans.find((item) => item.projectId === detailedProject.id) ?? mockScans[0];

    return {
      project: detailedProject,
      scan,
      issues: mockScanIssues.filter((issue) => issue.projectId === detailedProject.id),
      bugFindings: mockBugFindings.filter((bug) => bug.projectId === detailedProject.id),
      duplicateGroups: mockDuplicateGroups.filter((group) => group.projectId === detailedProject.id),
      categoryScores: mockLaunchReadinessCategories.filter((category) => category.scanId === scan.id),
    };
  }, []);

  const reports = useMemo(() => generateAllReports(scanInput), [scanInput]);
  const comparisonMarkdown = useMemo(
    () => generateComparisonMarkdown(mockScanComparison),
    [],
  );

  async function copyText(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  function downloadMarkdown(text: string, filename: string) {
    const blob = new Blob([text], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function generateNextFixPrompt() {
    setActivePrompt(
      generatePromptPack({
        id: "verification-next-fix",
        issueType: "stripe_billing_fix",
        title: "Protect customer portal route after re-scan",
        severity: "high",
        targetTool: "cursor",
        filesToInspect: ["app/billing", "app/api/stripe", "middleware.ts", "lib/auth.ts"],
        knownIssue: mockScanComparison.newIssues[0],
        goal: mockScanComparison.recommendedNextFix,
        constraints: [
          "Use the mock re-scan comparison as scope.",
          "Do not add new billing features.",
          "Do not connect live Stripe or Supabase.",
        ],
        successCriteria: [
          "Customer portal route checks authentication before creating or showing portal access.",
          "Unauthenticated users are redirected or shown a safe error state.",
          "Build/typecheck passes after the scoped change.",
        ],
        verificationSteps: [
          "Inspect billing portal route and auth helpers.",
          "Add the smallest auth guard consistent with the app.",
          "Run lint/build or typecheck if available.",
          "Confirm the route is no longer public.",
        ],
        recommendedContext:
          "AppFinisher AI generated this prompt from the mock re-scan verification loop.",
      }),
    );
    setCopied(false);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Reports"
        subtitle="Generate deterministic markdown reports and review a mock re-scan verification loop for Demo SaaS App."
        action={<StatusBadge status={{ label: "Mock Reports", icon: "R", tone: "accent" }} />}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Previous score" value={`${mockScanComparison.previousScore}%`} detail="Initial mock scan" />
        <MetricCard label="Current score" value={`${mockScanComparison.currentScore}%`} detail="Mock re-scan result" tone="green" />
        <MetricCard label="Resolved" value={mockScanComparison.resolvedIssues.length} detail="Prompt fixes verified" tone="blue" />
        <MetricCard label="Still open" value={mockScanComparison.unresolvedIssues.length + mockScanComparison.newIssues.length} detail="Needs another fix loop" tone="amber" />
      </div>

      <Card>
        <SectionTitle
          title="Generated reports"
          subtitle="Markdown reports are generated from existing mock scan data."
        />
        <div className="grid gap-4 lg:grid-cols-2">
          {reports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onExport={() => {
                setActiveText({
                  title: report.title,
                  subtitle: report.summary,
                  text: report.markdown,
                  filename: `${report.reportType}-${report.projectId}.md`,
                });
                setCopied(false);
              }}
            />
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle
          title="Re-scan / verification loop"
          subtitle="Answers what improved, what is still broken, what to fix next, and whether generated prompts helped."
        />
        <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          <div className="space-y-4">
            <VerificationList title="What improved?" items={mockScanComparison.resolvedIssues} tone="green" />
            <VerificationList title="What is still broken?" items={mockScanComparison.unresolvedIssues} tone="amber" />
            <VerificationList title="New issue found" items={mockScanComparison.newIssues} tone="red" />
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <SectionTitle title="Executive summary" subtitle="Copy this into a founder update or launch review." />
            <p className="text-sm leading-6 text-zinc-300">{mockScanComparison.executiveSummary}</p>
            <div className="mt-5 rounded-xl border border-white/10 bg-zinc-950/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Recommended next fix
              </p>
              <p className="mt-2 text-sm leading-6 text-white">
                {mockScanComparison.recommendedNextFix}
              </p>
            </div>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  setActiveText({
                    title: "Re-scan Verification Markdown",
                    subtitle: "Previous vs current mock scan",
                    text: comparisonMarkdown,
                    filename: "rescan-verification-summary.md",
                  });
                  setCopied(false);
                }}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
              >
                Export Markdown Report
              </button>
              <button
                type="button"
                onClick={() => copyText(mockScanComparison.executiveSummary)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
              >
                {copied ? "Copied" : "Copy Executive Summary"}
              </button>
              <button
                type="button"
                onClick={generateNextFixPrompt}
                className="rounded-xl border border-sky-300/30 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-sky-100 hover:bg-blue-500/20"
              >
                Generate Next Fix Prompt
              </button>
            </div>
          </div>
        </div>
      </Card>

      {activeText ? (
        <TextModal
          title={activeText.title}
          subtitle={activeText.subtitle}
          text={activeText.text}
          primaryLabel={copied ? "Copied" : "Copy Markdown"}
          secondaryLabel="Download .md"
          onPrimary={() => copyText(activeText.text)}
          onSecondary={() =>
            downloadMarkdown(activeText.text, activeText.filename ?? "appfinisher-report.md")
          }
          onClose={() => {
            setActiveText(null);
            setCopied(false);
          }}
        />
      ) : null}

      {activePrompt ? (
        <TextModal
          title="Generated Next Fix Prompt"
          subtitle={toolProfiles[activePrompt.targetTool].name}
          text={activePrompt.prompt}
          primaryLabel={copied ? "Copied" : "Copy Prompt"}
          onPrimary={() => copyText(activePrompt.prompt)}
          onClose={() => {
            setActivePrompt(null);
            setCopied(false);
          }}
        />
      ) : null}
    </div>
  );
}

function ReportCard({ report, onExport }: { report: GeneratedReport; onExport: () => void }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <StatusBadge status={{ label: report.reportType.replaceAll("_", " "), icon: "R", tone: "blue" }} />
          <h2 className="mt-3 text-lg font-semibold text-white">{report.title}</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-500">{report.summary}</p>
        </div>
        {typeof report.score === "number" ? (
          <p className="font-mono text-2xl font-semibold text-white">{report.score}%</p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onExport}
        className="mt-5 w-full rounded-xl border border-sky-300/30 bg-blue-500/10 px-4 py-2.5 text-sm font-semibold text-sky-100 hover:bg-blue-500/20"
      >
        Export Markdown Report
      </button>
    </article>
  );
}

function VerificationList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "green" | "amber" | "red";
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-4">
        <StatusBadge status={{ label: title, icon: tone === "green" ? "+" : "!", tone }} />
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item} className="rounded-xl border border-white/10 bg-zinc-950/70 p-4">
            <p className="text-sm leading-6 text-zinc-300">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TextModal({
  title,
  subtitle,
  text,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  onClose,
}: {
  title: string;
  subtitle: string;
  text: string;
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
              AppFinisher AI Report
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
              {primaryLabel}
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
