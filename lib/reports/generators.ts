import type { IssueSeverity, Project } from "@/lib/types";
import type { GeneratedReport, ReportScanInput, ReportType, ScanComparison } from "@/lib/reports/types";
import { generateFinalSmokeTestChecklist } from "@/lib/trust";

const generatedAt = "2026-04-26T19:20:00.000Z";

const severityOrder: IssueSeverity[] = ["critical", "high", "medium", "low"];

function severitySection(input: ReportScanInput) {
  const issueLines = severityOrder.map((severity) => {
    const issues = input.issues.filter((issue) => issue.severity === severity);
    const bugs = input.bugFindings.filter((bug) => bug.severity === severity);
    const duplicates = input.duplicateGroups.filter((group) => group.severity === severity);
    const all = [
      ...issues.map((issue) => `${issue.title}: ${issue.recommendedFix}`),
      ...bugs.map((bug) => `${bug.title}: ${bug.recommendedFix}`),
      ...duplicates.map((group) => `${group.title}: ${group.recommendedAction}`),
    ];

    return `### ${severity.toUpperCase()}\n${all.length ? all.map((item) => `- ${item}`).join("\n") : "- None"}`;
  });

  return issueLines.join("\n\n");
}

export function getReportRecommendedFixOrder(input: ReportScanInput) {
  return [
    "Fix critical deployment, auth, billing, and database blockers first.",
    ...input.issues
      .filter((issue) => issue.severity === "critical" || issue.severity === "high")
      .map((issue) => issue.recommendedFix),
    ...input.bugFindings
      .filter((bug) => bug.severity === "critical" || bug.severity === "high")
      .map((bug) => bug.recommendedFix),
    ...input.duplicateGroups
      .filter((group) => group.severity === "critical" || group.severity === "high")
      .map((group) => group.recommendedAction),
    "Re-scan and verify the launch score improved.",
  ];
}

function promptPackRecommendations(input: ReportScanInput) {
  return [
    ...input.issues.map((issue) => `- Generate a Cursor prompt for: ${issue.title}`),
    ...input.bugFindings.map((bug) => `- Generate a Cursor prompt for bug: ${bug.title}`),
    ...input.duplicateGroups.map((group) => `- Generate a duplicate-resolution prompt for: ${group.title}`),
  ].join("\n");
}

function criticalBlockers(input: ReportScanInput) {
  const blockers = [
    ...input.issues.filter((issue) => issue.severity === "critical").map((issue) => issue.title),
    ...input.bugFindings.filter((bug) => bug.severity === "critical").map((bug) => bug.title),
    ...input.duplicateGroups.filter((group) => group.severity === "critical").map((group) => group.title),
  ];

  return blockers.length ? blockers.map((item) => `- ${item}`).join("\n") : "- None detected from current evidence.";
}

function verificationChecklist(input: ReportScanInput) {
  return [
    ...generateFinalSmokeTestChecklist({
      billingEnabled: input.project.billingProvider === "stripe",
      aiEnabled: true,
      supabaseEnabled: input.project.database.toLowerCase().includes("supabase"),
    }),
    `Confirm launch score is higher than ${input.scan.overallScore}% after fixes.`,
  ];
}

function buildMarkdown(input: ReportScanInput, title: string, summary: string, score = input.scan.overallScore) {
  return `# ${title}

Generated: ${new Date(generatedAt).toLocaleString()}

## Summary
${summary}

## Score / Status
${score}%

## Critical Blockers
${criticalBlockers(input)}

## Issues by Severity
${severitySection(input)}

## Why It Matters
AppFinisher AI reports focus on launch blockers that can prevent users from signing up, paying, using the product safely, or trusting the app in production.

## Recommended Fix Order
${getReportRecommendedFixOrder(input).map((item, index) => `${index + 1}. ${item}`).join("\n")}

## Prompt Pack Recommendations
${promptPackRecommendations(input)}

## Verification Checklist
${verificationChecklist(input).map((item) => `- [ ] ${item}`).join("\n")}
`;
}

function makeReport(
  input: ReportScanInput,
  reportType: ReportType,
  title: string,
  summary: string,
  score = input.scan.overallScore,
): GeneratedReport {
  return {
    id: `${reportType}-${input.scan.id}`,
    projectId: input.project.id,
    scanId: input.scan.id,
    reportType,
    title,
    markdown: buildMarkdown(input, title, summary, score),
    summary,
    score,
    generatedAt,
  };
}

export function generateMarkdownReport(scan: ReportScanInput, project?: Project): GeneratedReport {
  const input = project ? { ...scan, project } : scan;

  return makeReport(
    input,
    "launch_readiness",
    `${input.project.name} Launch Readiness Report`,
    `${input.project.name} is estimated at ${input.scan.overallScore}% launch-ready from current scan evidence, with ${input.issues.length} open scan issues, ${input.bugFindings.length} bug findings, and ${input.duplicateGroups.length} duplicate/conflict groups to review before production.`,
  );
}

export function generateBugReport(scan: ReportScanInput): GeneratedReport {
  return makeReport(
    scan,
    "bug_report",
    `${scan.project.name} Bug Report`,
    `${scan.bugFindings.length} deterministic mock bug findings need review before launch.`,
  );
}

export function generateDuplicateReport(scan: ReportScanInput): GeneratedReport {
  return makeReport(
    scan,
    "duplicate_conflict",
    `${scan.project.name} Duplicate Conflict Report`,
    `${scan.duplicateGroups.length} duplicate or conflicting file groups should be consolidated or archived after verification.`,
  );
}

export function generateLaunchChecklist(scan: ReportScanInput): GeneratedReport {
  return makeReport(
    scan,
    "final_launch_checklist",
    `${scan.project.name} Final Launch Checklist`,
    "A final smoke-test checklist for build, auth, billing, database, AI, legal, and support readiness.",
  );
}

export function generateExecutiveSummary(scan: ReportScanInput): GeneratedReport {
  return makeReport(
    scan,
    "launch_readiness",
    `${scan.project.name} Executive Summary`,
    `${scan.project.name} improved through focused launch fixes, but remaining risks should be cleared before paid launch.`,
  );
}

export function generateAllReports(scan: ReportScanInput): GeneratedReport[] {
  return [
    generateMarkdownReport(scan),
    generateBugReport(scan),
    generateDuplicateReport(scan),
    makeReport(
      scan,
      "security_risk",
      `${scan.project.name} Security Risk Report`,
      "Security readiness focuses on env leaks, service-role safety, auth checks, webhook verification, and RLS protections.",
    ),
    makeReport(
      scan,
      "billing_readiness",
      `${scan.project.name} Billing Readiness Report`,
      "Billing readiness checks checkout, webhook verification, subscription access, customer portal, and plan-limit clarity.",
    ),
    makeReport(
      scan,
      "ai_readiness",
      `${scan.project.name} AI Readiness Report`,
      "AI readiness checks rate limits, usage tracking, prompt safety, fallback behavior, and AI output labeling.",
    ),
    generateLaunchChecklist(scan),
  ];
}

export const mockScanComparison: ScanComparison = {
  previousScanId: "scan-demo-001",
  currentScanId: "scan-demo-002",
  previousScore: 68,
  currentScore: 82,
  resolvedIssues: [
    "Stripe webhook signature verification added",
    "Duplicate Supabase clients reduced",
    "Password reset route added",
  ],
  unresolvedIssues: [
    "AI route missing usage limit",
    "No health check route",
    "No privacy policy",
  ],
  newIssues: ["Customer portal route added but missing auth guard"],
  recommendedNextFix:
    "Add auth protection to the customer portal route, then re-scan billing readiness.",
  executiveSummary:
    "The mock re-scan shows a 14-point improvement from 68% to 82%. Generated prompts resolved major billing and auth blockers, but AI usage limits, legal trust pages, and customer portal auth still need attention before paid launch.",
};

export function generateComparisonMarkdown(comparison: ScanComparison) {
  return `# Re-scan Verification Summary

Previous scan: ${comparison.previousScanId}
Current scan: ${comparison.currentScanId}

Previous launch score: ${comparison.previousScore}%
Current launch score: ${comparison.currentScore}%

## What Improved
${comparison.resolvedIssues.map((issue) => `- ${issue}`).join("\n")}

## Still Unresolved
${comparison.unresolvedIssues.map((issue) => `- ${issue}`).join("\n")}

## New Issues
${comparison.newIssues.map((issue) => `- ${issue}`).join("\n")}

## Recommended Next Fix
${comparison.recommendedNextFix}

## Executive Summary
${comparison.executiveSummary}
`;
}
