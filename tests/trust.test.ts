import assert from "node:assert/strict";
import test from "node:test";
import { generateLaunchPlan } from "../lib/launch-plan/generator";
import type { LaunchPlanItem } from "../lib/launch-plan/types";
import { generatePromptPack } from "../lib/promptpack/generators";
import { validatePromptOutput } from "../lib/trust/prompt-quality";
import { applyLaunchScoreGuardrails } from "../lib/trust/score-guardrails";
import { selectNextRecommendedFix } from "../lib/trust/next-fix";
import { generateFinalSmokeTestChecklist } from "../lib/trust/smoke-test";
import { validateOutputConsistency } from "../lib/trust/consistency";
import { generateMarkdownReport } from "../lib/reports/generators";
import type { ReportScanInput } from "../lib/reports/types";

const criticalItem: LaunchPlanItem = {
  id: "critical-env",
  title: "Env vars must be configured",
  severity: "critical",
  category: "deployment",
  whyItMatters: "Deployments can fail without env configuration.",
  recommendedFix: "Document required env vars.",
  phase: "Phase 1: Build/deploy blockers",
  promptTargets: ["cursor"],
};

test("launch score guardrails cap high scores with critical blockers", () => {
  const result = applyLaunchScoreGuardrails(96, [criticalItem]);

  assert.equal(result.guardedScore, 79);
  assert.equal(result.guardedStatus, "Needs Work");
  assert.ok(result.notes.length > 0);
});

test("consistency checker flags Launch Ready with required items", () => {
  const issues = validateOutputConsistency({
    launchPlan: {
      appName: "Demo",
      launchScore: 95,
      launchStatus: "Launch Ready",
      requiredBeforeLaunch: [criticalItem],
      recommendedBeforePaidLaunch: [],
      optionalAfterLaunch: [],
      fixOrderPhases: [],
      promptPackRecommendations: [],
      finalSmokeTestChecklist: [],
      nextRecommendedFix: criticalItem,
      consistencyNotes: [],
      generatedAt: "2026-04-26T00:00:00.000Z",
    },
  });

  assert.ok(issues.some((issue) => issue.id === "launch-ready-required-items"));
});

test("next recommended fix prioritizes severity and phase", () => {
  const mediumAuth: LaunchPlanItem = {
    ...criticalItem,
    id: "medium-auth",
    severity: "medium",
    phase: "Phase 2: Auth/onboarding",
  };

  assert.equal(
    selectNextRecommendedFix({ items: [mediumAuth, criticalItem] })?.id,
    "critical-env",
  );
});

test("prompt output includes required sections and agent principles", () => {
  const prompt = generatePromptPack({
    id: "test",
    issueType: "bug_fix",
    title: "Fix likely route issue",
    targetTool: "cursor",
    filesToInspect: [],
    knownIssue: "",
    goal: "",
    successCriteria: [],
    verificationSteps: [],
  }).prompt;
  const quality = validatePromptOutput(prompt);

  assert.equal(quality.valid, true);
});

test("smoke test checklist includes billing, Supabase, and AI checks when enabled", () => {
  const checklist = generateFinalSmokeTestChecklist({
    billingEnabled: true,
    supabaseEnabled: true,
    aiEnabled: true,
  });

  assert.ok(checklist.some((item) => item.includes("Stripe checkout")));
  assert.ok(checklist.some((item) => item.includes("Supabase RLS")));
  assert.ok(checklist.some((item) => item.includes("AI routes have rate limits")));
});

test("launch plan guardrails prevent Launch Ready with required items", () => {
  const plan = generateLaunchPlan({
    appName: "Guardrail Demo",
    scan: {
      id: "scan",
      projectId: "project",
      status: "completed",
      overallScore: 98,
      createdAt: "2026-04-26T00:00:00.000Z",
      completedAt: "2026-04-26T00:01:00.000Z",
      summary: "High score with blockers.",
    },
    issues: [],
    bugFindings: [],
    duplicateGroups: [],
    categoryScores: [],
  });

  assert.notEqual(plan.launchStatus, "Launch Ready");
  assert.ok(plan.consistencyNotes.length > 0);
});

test("reports use consistent section ordering", () => {
  const input: ReportScanInput = {
    project: {
      id: "project",
      name: "Demo",
      description: "",
      repoUrl: "",
      stack: [],
      framework: "Next.js",
      database: "Supabase Postgres",
      billingProvider: "stripe",
      deploymentProvider: "vercel",
      aiProvider: "cursor",
      status: "needs_fixes",
      launchReadinessScore: 68,
      createdAt: "2026-04-26T00:00:00.000Z",
      updatedAt: "2026-04-26T00:00:00.000Z",
    },
    scan: {
      id: "scan",
      projectId: "project",
      status: "completed",
      overallScore: 68,
      createdAt: "2026-04-26T00:00:00.000Z",
      completedAt: "2026-04-26T00:01:00.000Z",
      summary: "",
    },
    issues: [],
    bugFindings: [],
    duplicateGroups: [],
    categoryScores: [],
  };
  const markdown = generateMarkdownReport(input).markdown;
  const sectionOrder = [
    "## Summary",
    "## Score / Status",
    "## Critical Blockers",
    "## Recommended Fix Order",
    "## Prompt Pack Recommendations",
    "## Verification Checklist",
  ];

  assert.deepEqual(
    sectionOrder.map((section) => markdown.includes(section)),
    sectionOrder.map(() => true),
  );
  assert.ok(markdown.indexOf("## Summary") < markdown.indexOf("## Score / Status"));
});
