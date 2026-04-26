"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SeverityBadge, StatusBadge } from "@/components/status-badge";
import { Card, MetricCard, PageHeader, SectionTitle } from "@/components/ui";
import {
  detectStackFromManifest,
  generateLaunchPlanFromScanResult,
  parseManifestJson,
  parsePastedFileTree,
  scanFileManifest,
  type DetectedStack,
  type FileManifest,
  type ScanResult,
} from "@/lib/shipguard-engine";
import type { LaunchPlan } from "@/lib/launch-plan";
import {
  generatePromptPack,
  toolProfiles,
  type PromptPackInput,
  type PromptPackOutput,
} from "@/lib/promptpack";
import type { BillingProvider, BuilderTarget, DeploymentProvider } from "@/lib/types";

type InputMethod = "manual" | "file-tree" | "manifest";

const sampleTree = `app/
  page.tsx
  dashboard/
    page.tsx
  api/
    chat/
      route.ts
    ai/
      chat/
        route.ts
    stripe/
      webhook/
        route.ts
lib/
  supabase.ts
  supabaseClient.ts
  stripe.ts
utils/
  supabase.ts
components/
  Pricing.tsx
  PricingTable.tsx
.env.example
package.json
next.config.ts
package-lock.json
yarn.lock`;

const sampleManifest = {
  files: [
    "app/page.tsx",
    "app/dashboard/page.tsx",
    "app/api/ai/chat/route.ts",
    "app/api/chat/route.ts",
    "app/api/stripe/webhooks/route.ts",
    "lib/supabase.ts",
    "lib/supabaseClient.ts",
    "lib/stripe.ts",
    "components/Pricing.tsx",
    "components/PricingTable.tsx",
    ".env.example",
    "package.json",
    "next.config.ts",
  ],
  contentPreviews: {
    "app/api/ai/chat/route.ts": "openai chat route without rate limit",
    "app/api/stripe/webhooks/route.ts": "stripe webhook TODO no signature verification",
  },
  packageJson: {
    scripts: { build: "next build", lint: "eslint" },
    dependencies: { next: "16.2.4", stripe: "latest", "@supabase/supabase-js": "latest" },
  },
  envExample: "NEXT_PUBLIC_SUPABASE_URL= STRIPE_SECRET_KEY= OPENAI_API_KEY=",
  frameworkHints: ["Next.js App Router"],
  routeList: ["app/api/ai/chat/route.ts", "app/api/stripe/webhooks/route.ts"],
};

export function NewProjectWizard() {
  const [step, setStep] = useState(1);
  const [method, setMethod] = useState<InputMethod>("file-tree");
  const [details, setDetails] = useState({
    name: "My AI SaaS App",
    description: "An unfinished AI-built SaaS app that needs launch readiness checks.",
    framework: "Next.js App Router",
    database: "Supabase Postgres",
    billingProvider: "stripe" as BillingProvider,
    deploymentProvider: "vercel" as DeploymentProvider,
    aiProvider: "cursor" as BuilderTarget,
  });
  const [treeText, setTreeText] = useState(sampleTree);
  const [manifestText, setManifestText] = useState(JSON.stringify(sampleManifest, null, 2));
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [prompts, setPrompts] = useState<PromptPackOutput[]>([]);

  const parseResult = useMemo(() => {
    if (method === "file-tree") return parsePastedFileTree(treeText);
    if (method === "manifest") return parseManifestJson(manifestText);

    return { manifest: buildManualManifest(details), errors: [] };
  }, [details, manifestText, method, treeText]);

  const detectedStack = useMemo(
    () => detectStackFromManifest(parseResult.manifest),
    [parseResult.manifest],
  );

  const launchPlan = useMemo(
    () => (scanResult ? generateLaunchPlanFromScanResult(details.name, scanResult) : null),
    [details.name, scanResult],
  );

  function runScan() {
    const result = scanFileManifest(parseResult.manifest, {
      projectId: slugify(details.name),
      name: details.name,
      stack: [details.framework, details.database, details.billingProvider],
      framework: detectedStack.framework ?? details.framework,
      database: detectedStack.database ?? details.database,
      billingProvider: detectedStack.billingProvider ?? details.billingProvider,
      deploymentProvider: detectedStack.deploymentProvider ?? details.deploymentProvider,
      aiProvider: detectedStack.aiProvider ?? details.aiProvider,
    });

    setScanResult(result);
    setPrompts([]);
    setStep(5);
  }

  function generateAllPrompts() {
    if (!scanResult) return;

    setPrompts(
      createPromptInputs(scanResult, parseResult.manifest.files).map((input) =>
        generatePromptPack(input),
      ),
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="New Project"
        subtitle="Create a project with manual setup, pasted file tree, or manifest JSON. No GitHub OAuth, ZIP upload, or private code ingestion is used."
      />

      <StepNav step={step} setStep={setStep} />

      {step === 1 ? <ProjectDetails details={details} setDetails={setDetails} /> : null}
      {step === 2 ? <InputMethodPicker method={method} setMethod={setMethod} /> : null}
      {step === 3 ? (
        <InputForm
          method={method}
          treeText={treeText}
          setTreeText={setTreeText}
          manifestText={manifestText}
          setManifestText={setManifestText}
          onManifestFile={(text) => setManifestText(text)}
        />
      ) : null}
      {step === 4 ? (
        <ReviewStack
          manifest={parseResult.manifest}
          errors={parseResult.errors}
          detectedStack={detectedStack}
          onRunScan={runScan}
        />
      ) : null}
      {step === 5 && scanResult ? (
        <ScanSummary
          result={scanResult}
          detectedStack={detectedStack}
          launchPlan={launchPlan}
          prompts={prompts}
          onGeneratePrompts={generateAllPrompts}
        />
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={() => setStep((value) => Math.max(1, value - 1))}
          disabled={step === 1}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Back
        </button>
        {step < 4 ? (
          <button
            type="button"
            onClick={() => setStep((value) => Math.min(4, value + 1))}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
          >
            Continue
          </button>
        ) : step === 4 ? (
          <button
            type="button"
            onClick={runScan}
            disabled={parseResult.errors.length > 0 || parseResult.manifest.files.length === 0}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Run Path-Level Scan
          </button>
        ) : (
          <button
            type="button"
            onClick={runScan}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
          >
            Re-run Local Scan
          </button>
        )}
      </div>
    </div>
  );
}

function StepNav({ step, setStep }: { step: number; setStep: (step: number) => void }) {
  const labels = ["Project details", "Input method", "Input", "Review stack", "Scan results"];

  return (
    <div className="grid gap-2 md:grid-cols-5">
      {labels.map((label, index) => {
        const value = index + 1;
        return (
          <button
            key={label}
            type="button"
            onClick={() => setStep(value)}
            className={`rounded-xl border px-3 py-2 text-left text-sm ${
              step === value
                ? "border-sky-300/40 bg-blue-500/15 text-white"
                : "border-white/10 bg-white/[0.03] text-zinc-400"
            }`}
          >
            <span className="font-mono text-xs">0{value}</span>
            <span className="ml-2">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

function ProjectDetails({
  details,
  setDetails,
}: {
  details: {
    name: string;
    description: string;
    framework: string;
    database: string;
    billingProvider: BillingProvider;
    deploymentProvider: DeploymentProvider;
    aiProvider: BuilderTarget;
  };
  setDetails: (details: {
    name: string;
    description: string;
    framework: string;
    database: string;
    billingProvider: BillingProvider;
    deploymentProvider: DeploymentProvider;
    aiProvider: BuilderTarget;
  }) => void;
}) {
  return (
    <Card>
      <SectionTitle title="Step 1: Project details" subtitle="Manual metadata only. Nothing is stored on a server in this MVP." />
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="Project name" value={details.name} onChange={(name) => setDetails({ ...details, name })} />
        <TextField label="Description" value={details.description} onChange={(description) => setDetails({ ...details, description })} />
        <TextField label="Framework" value={details.framework} onChange={(framework) => setDetails({ ...details, framework })} />
        <TextField label="Database" value={details.database} onChange={(database) => setDetails({ ...details, database })} />
        <SelectField
          label="Billing provider"
          value={details.billingProvider}
          options={["stripe", "paddle", "none", "unknown"]}
          onChange={(billingProvider) => setDetails({ ...details, billingProvider: billingProvider as BillingProvider })}
        />
        <SelectField
          label="Deployment provider"
          value={details.deploymentProvider}
          options={["vercel", "netlify", "railway", "render", "unknown"]}
          onChange={(deploymentProvider) => setDetails({ ...details, deploymentProvider: deploymentProvider as DeploymentProvider })}
        />
        <SelectField
          label="AI provider / builder"
          value={details.aiProvider}
          options={["cursor", "lovable", "claude_code", "replit", "bolt", "windsurf", "generic"]}
          onChange={(aiProvider) => setDetails({ ...details, aiProvider: aiProvider as BuilderTarget })}
        />
      </div>
    </Card>
  );
}

function InputMethodPicker({
  method,
  setMethod,
}: {
  method: InputMethod;
  setMethod: (method: InputMethod) => void;
}) {
  const methods: { id: InputMethod; title: string; detail: string }[] = [
    { id: "manual", title: "Manual Project Setup", detail: "Use only the metadata from step 1." },
    { id: "file-tree", title: "Paste File Tree", detail: "Paste an indented tree of paths. Recommended for early scans." },
    { id: "manifest", title: "Upload Manifest JSON", detail: "Paste or load a structured JSON manifest with optional content previews." },
  ];

  return (
    <Card>
      <SectionTitle title="Step 2: Input method" subtitle="GitHub OAuth and ZIP upload are intentionally not included yet." />
      <div className="grid gap-4 lg:grid-cols-3">
        {methods.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setMethod(item.id)}
            className={`rounded-2xl border p-5 text-left ${
              method === item.id
                ? "border-sky-300/40 bg-blue-500/15"
                : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
            }`}
          >
            <p className="font-semibold text-white">{item.title}</p>
            <p className="mt-2 text-sm leading-6 text-zinc-500">{item.detail}</p>
          </button>
        ))}
      </div>
    </Card>
  );
}

function InputForm({
  method,
  treeText,
  setTreeText,
  manifestText,
  setManifestText,
  onManifestFile,
}: {
  method: InputMethod;
  treeText: string;
  setTreeText: (value: string) => void;
  manifestText: string;
  setManifestText: (value: string) => void;
  onManifestFile: (value: string) => void;
}) {
  if (method === "manual") {
    return (
      <Card>
        <SectionTitle title="Step 3: Manual setup" subtitle="No file paths were provided, so scan confidence will be lower." />
        <p className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
          Manual setup creates a minimal manifest from your selected stack. Paste a file tree or manifest for better duplicate and route detection.
        </p>
      </Card>
    );
  }

  if (method === "manifest") {
    return (
      <Card>
        <SectionTitle title="Step 3: Manifest JSON" subtitle="Paste JSON or load a local .json file. The app reads only the selected manifest text." />
        <input
          type="file"
          accept="application/json,.json"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            file.text().then(onManifestFile);
          }}
          className="mb-3 block w-full text-sm text-zinc-400 file:mr-4 file:rounded-xl file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
        />
        <textarea
          value={manifestText}
          onChange={(event) => setManifestText(event.target.value)}
          className="min-h-[420px] w-full rounded-xl border border-white/10 bg-zinc-950 p-4 font-mono text-xs leading-6 text-zinc-200 outline-none focus:border-sky-300"
        />
      </Card>
    );
  }

  return (
    <Card>
      <SectionTitle title="Step 3: Paste file tree" subtitle="Use simple indentation. Content is not required for path-level scanning." />
      <textarea
        value={treeText}
        onChange={(event) => setTreeText(event.target.value)}
        className="min-h-[420px] w-full rounded-xl border border-white/10 bg-zinc-950 p-4 font-mono text-xs leading-6 text-zinc-200 outline-none focus:border-sky-300"
      />
    </Card>
  );
}

function ReviewStack({
  manifest,
  errors,
  detectedStack,
  onRunScan,
}: {
  manifest: FileManifest;
  errors: string[];
  detectedStack: DetectedStack;
  onRunScan: () => void;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <Card>
        <SectionTitle title="Step 4: Review detected stack" subtitle="Stack detection uses file paths, manifest metadata, and optional content previews." />
        <div className="space-y-3">
          <StackRow label="Framework" value={detectedStack.framework} />
          <StackRow label="Database" value={detectedStack.database} />
          <StackRow label="Billing" value={detectedStack.billingProvider} />
          <StackRow label="Deployment" value={detectedStack.deploymentProvider} />
          <StackRow label="AI provider" value={detectedStack.aiProvider} />
        </div>
        <button
          type="button"
          onClick={onRunScan}
          disabled={errors.length > 0 || manifest.files.length === 0}
          className="mt-5 w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Run Path-Level Scan
        </button>
      </Card>
      <Card>
        <SectionTitle title="Manifest preview" subtitle={`${manifest.files.length} paths parsed.`} />
        {errors.length > 0 ? (
          <div className="mb-4 space-y-2">
            {errors.map((error) => (
              <p key={error} className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-100">
                {error}
              </p>
            ))}
          </div>
        ) : null}
        <div className="mb-4 space-y-2">
          {detectedStack.confidenceNotes.map((note) => (
            <p key={note} className="text-sm leading-6 text-zinc-400">
              <span className="mr-2 font-mono text-sky-300">+</span>
              {note}
            </p>
          ))}
        </div>
        <div className="max-h-80 overflow-auto rounded-xl border border-white/10 bg-black/30 p-4">
          {manifest.files.slice(0, 80).map((file) => (
            <p key={file} className="font-mono text-xs leading-6 text-zinc-300">
              {file}
            </p>
          ))}
        </div>
      </Card>
    </div>
  );
}

function ScanSummary({
  result,
  detectedStack,
  launchPlan,
  prompts,
  onGeneratePrompts,
}: {
  result: ScanResult;
  detectedStack: DetectedStack;
  launchPlan: LaunchPlan | null;
  prompts: PromptPackOutput[];
  onGeneratePrompts: () => void;
}) {
  const displayedScore = launchPlan?.launchScore ?? result.overallScore;
  const totalFindings = result.issues.length + result.bugFindings.length + result.duplicateGroups.length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          label="Guarded launch score"
          value={`${displayedScore}%`}
          detail={launchPlan?.launchStatus ?? "From pasted paths"}
          tone={displayedScore >= 80 ? "green" : "amber"}
        />
        <MetricCard label="Critical blockers" value={result.criticalBlockers.length} detail="Must fix first" tone="red" />
        <MetricCard label="Duplicates" value={result.duplicateGroups.length} detail="Path-level conflicts" tone="blue" />
        <MetricCard label="Prompt packs" value={prompts.length || totalFindings} detail="Generated from findings" tone="blue" />
      </div>
      <Card>
        <SectionTitle title="Step 5: Scan results" subtitle={result.summary} />
        <div className="grid gap-4 lg:grid-cols-3">
          <ResultList title="Critical blockers" items={result.criticalBlockers.map((item) => item.title)} />
          <ResultList title="Duplicate/conflict groups" items={result.duplicateGroups.map((item) => item.title)} />
          <ResultList title="Detected stack notes" items={detectedStack.confidenceNotes} />
        </div>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onGeneratePrompts}
            disabled={totalFindings === 0}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Generate Prompt Packs For All Findings
          </button>
          <Link href="/prompt-packs" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-white/10">
            Open Prompt Packs
          </Link>
          <Link href="/duplicate-finder" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-white/10">
            Open Duplicate Finder Demo
          </Link>
        </div>
      </Card>
      <Card>
        <SectionTitle title="Launch plan from pasted paths" subtitle="Generated from this local scan result with the same score guardrails used by the full Launch Plan page." />
        <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-sm text-zinc-500">Next recommended fix</p>
            <p className="mt-2 font-medium text-white">
              {launchPlan?.nextRecommendedFix?.title ?? "No next fix selected."}
            </p>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              {launchPlan?.nextRecommendedFix?.recommendedFix ?? "Current evidence did not produce a prioritized launch fix."}
            </p>
          </div>
          <div className="space-y-3">
            {(launchPlan?.fixOrderPhases ?? [])
              .filter((phase) => phase.items.length > 0)
              .slice(0, 5)
              .map((phase, index) => (
                <div key={phase.phase} className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <span className="font-mono text-sm text-sky-300">0{index + 1}</span>
                  <div>
                    <p className="font-medium text-white">{phase.phase}</p>
                    <p className="mt-1 text-sm leading-6 text-zinc-400">{phase.summary}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
        {launchPlan && launchPlan.consistencyNotes.length > 0 ? (
          <div className="mt-4 space-y-2">
            {launchPlan.consistencyNotes.map((note) => (
              <p key={note} className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-sm leading-6 text-amber-100">
                {note}
              </p>
            ))}
          </div>
        ) : null}
      </Card>
      {prompts.length > 0 ? (
        <Card>
          <SectionTitle
            title="Generated prompt packs"
            subtitle={`${prompts.length} ${prompts.length === 1 ? "prompt" : "prompts"} generated from every scan issue, bug finding, and duplicate group.`}
          />
          <div className="space-y-3">
            {prompts.map((item) => (
              <details key={item.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <summary className="cursor-pointer text-sm font-semibold text-white">
                  {item.title} / {toolProfiles[item.targetTool].name}
                </summary>
                <pre className="mt-4 max-h-96 overflow-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-black/40 p-4 font-mono text-xs leading-6 text-zinc-200">
                  {item.prompt}
                </pre>
              </details>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-zinc-300">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-sky-300"
      />
    </label>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-zinc-300">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-sky-300"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function StackRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <span className="text-sm text-zinc-500">{label}</span>
      <span className="text-sm font-medium text-white">{value ?? "Not detected"}</span>
    </div>
  );
}

function ResultList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="font-medium text-white">{title}</p>
        {title.includes("Critical") ? <SeverityBadge severity="critical" /> : <StatusBadge status={{ label: `${items.length}`, icon: "#", tone: "blue" }} />}
      </div>
      <div className="space-y-2">
        {items.length > 0 ? (
          items.map((item) => (
            <p key={item} className="text-sm leading-6 text-zinc-400">
              {item}
            </p>
          ))
        ) : (
          <p className="text-sm text-zinc-500">None found.</p>
        )}
      </div>
    </div>
  );
}

function buildManualManifest(details: {
  framework: string;
  database: string;
  billingProvider: BillingProvider;
  aiProvider: BuilderTarget;
}): FileManifest {
  const files = ["package.json"];

  if (details.framework.toLowerCase().includes("next")) {
    files.push("app/page.tsx", "app/dashboard/page.tsx", "next.config.ts");
  }
  if (details.database.toLowerCase().includes("supabase")) {
    files.push("lib/supabase.ts", "supabase/schema.sql", "supabase/rls.sql");
  }
  if (details.billingProvider === "stripe") {
    files.push("lib/stripe.ts", "app/api/stripe/webhooks/route.ts");
  }
  if (details.aiProvider !== "generic") {
    files.push("app/api/ai/chat/route.ts");
  }

  return {
    files,
    packageJson: { scripts: { build: "next build", lint: "eslint" } },
    envExample: "NEXT_PUBLIC_APP_URL= SUPABASE_URL= STRIPE_SECRET_KEY= OPENAI_API_KEY=",
  };
}

function createPromptInputs(result: ScanResult, manifestFiles: string[]): PromptPackInput[] {
  const sharedConstraints = [
    "Use only the pasted file paths and any provided content previews as context.",
    "Do not assume access to private source files unless provided by the user.",
    "Do not implement unrelated systems.",
  ];
  const sharedVerification = [
    "Inspect the listed files or paths.",
    "Apply the smallest relevant fix in the target builder.",
    "Run build/typecheck if available.",
    "Re-scan using AppFinisher after changes.",
  ];
  const context =
    "This prompt was generated from user-provided file paths or manifest data, not from GitHub or uploaded source code.";

  return [
    ...result.issues.map<PromptPackInput>((issue) => ({
      id: issue.id,
      issueType: issuePromptType(issue.category, issue.title),
      title: issue.title,
      severity: issue.severity,
      targetTool: "cursor",
      filesToInspect: manifestFiles.slice(0, 8),
      knownIssue: issue.description,
      goal: issue.recommendedFix,
      constraints: sharedConstraints,
      successCriteria: [issue.recommendedFix],
      verificationSteps: sharedVerification,
      recommendedContext: context,
    })),
    ...result.bugFindings.map<PromptPackInput>((bug) => ({
      id: bug.id,
      issueType: "bug_fix",
      title: bug.title,
      severity: bug.severity,
      targetTool: "cursor",
      filesToInspect: [bug.filePath],
      knownIssue: bug.evidence,
      goal: bug.recommendedFix,
      constraints: sharedConstraints,
      successCriteria: [bug.successCriteria],
      verificationSteps: sharedVerification,
      recommendedContext: context,
    })),
    ...result.duplicateGroups.map<PromptPackInput>((group) => ({
      id: group.id,
      issueType: "duplicate_conflict_resolution",
      title: group.title,
      severity: group.severity,
      targetTool: "cursor",
      filesToInspect: group.files,
      knownIssue: group.conflictRisk,
      goal: group.recommendedAction,
      constraints: [
        ...sharedConstraints,
        "Do not delete or archive duplicate files until the canonical file is chosen and verification passes.",
      ],
      successCriteria: [group.canonicalRecommendation, group.recommendedAction],
      verificationSteps: sharedVerification,
      recommendedContext: context,
    })),
  ];
}

function issuePromptType(category: string, title: string): PromptPackInput["issueType"] {
  const value = `${category} ${title}`.toLowerCase();

  if (value.includes("stripe") || value.includes("billing") || value.includes("checkout")) return "stripe_billing_fix";
  if (value.includes("supabase") || value.includes("rls") || value.includes("database")) return "supabase_rls_fix";
  if (value.includes("auth") || value.includes("login") || value.includes("signup") || value.includes("onboarding")) return "auth_onboarding_fix";
  if (value.includes("ai") || value.includes("rate limit") || value.includes("usage")) return "ai_route_rate_limit_fix";
  if (value.includes("vercel") || value.includes("deploy") || value.includes("build")) return "deployment_vercel_fix";
  if (value.includes("privacy") || value.includes("terms") || value.includes("legal")) return "legal_trust_page_creation";
  if (value.includes("support") || value.includes("welcome") || value.includes("customer")) return "customer_onboarding_improvement";

  return "launch_readiness_fix";
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "manual-project";
}
