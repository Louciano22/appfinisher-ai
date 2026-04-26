import Link from "next/link";
import {
  formatBuilderTarget,
  formatRelativeDate,
  getProjectStatus,
  getScanStatus,
  mockDuplicateGroups,
  mockProjects,
  mockPromptPacks,
  mockScanIssues,
  mockScans,
} from "@/lib/mock";
import { SeverityBadge, StatusBadge } from "@/components/status-badge";
import { Card, PageHeader, SectionTitle } from "@/components/ui";

type PlaceholderKind =
  | "projects"
  | "new-project"
  | "scan"
  | "bug-finder"
  | "duplicate-finder"
  | "launch-plan"
  | "prompt-packs"
  | "reports"
  | "settings";

export function PlaceholderPage({
  title,
  subtitle,
  kind,
}: {
  title: string;
  subtitle: string;
  kind: PlaceholderKind;
}) {
  return (
    <div className="space-y-8">
      <PageHeader title={title} subtitle={subtitle} />
      {renderContent(kind)}
    </div>
  );
}

function renderContent(kind: PlaceholderKind) {
  if (kind === "projects") return <ProjectsContent />;
  if (kind === "new-project") return <NewProjectContent />;
  if (kind === "scan") return <ScanContent />;
  if (kind === "bug-finder") return <BugFinderContent />;
  if (kind === "duplicate-finder") return <DuplicateFinderContent />;
  if (kind === "launch-plan") return <LaunchPlanContent />;
  if (kind === "prompt-packs") return <PromptPacksContent />;
  if (kind === "reports") return <ReportsContent />;
  return <SettingsContent />;
}

function ProjectsContent() {
  return (
    <Card>
      <SectionTitle title="Mock project inventory" subtitle="Sidebar links and detail pages are live." />
      <div className="grid gap-4 lg:grid-cols-3">
        {mockProjects.map((project) => (
          <div
            key={project.id}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="font-medium text-white">{project.name}</p>
              <StatusBadge status={getProjectStatus(project.status)} />
            </div>
            <p className="min-h-12 text-sm leading-6 text-zinc-400">{project.description}</p>
            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <Metric label="Readiness" value={`${project.launchReadinessScore}%`} />
              <Metric label="Framework" value={project.framework} />
              <Metric label="Stack" value={project.stack.slice(0, 3).join(", ")} />
              <Metric label="Updated" value={formatRelativeDate(project.updatedAt)} />
            </dl>
            <Link
              href={`/projects/${project.id}`}
              className="mt-5 inline-flex w-full justify-center rounded-xl border border-sky-300/30 bg-blue-500/10 px-4 py-2.5 text-sm font-semibold text-sky-100 transition hover:bg-blue-500/20"
            >
              View Project
            </Link>
          </div>
        ))}
      </div>
    </Card>
  );
}

function NewProjectContent() {
  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <Card>
        <SectionTitle
          title="Project intake demo"
          subtitle="Real repository upload and GitHub import are coming later. For this MVP, use the seeded demo project."
        />
        <div className="space-y-4">
          {["Project name", "AI builder used", "Deployment target", "Known issue summary"].map(
            (field) => (
              <div key={field}>
                <label className="text-sm font-medium text-zinc-300">{field}</label>
                <div className="mt-2 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-3 text-sm text-zinc-500">
                  Coming soon input field
                </div>
              </div>
            ),
          )}
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link
            href="/projects/demo-saas-app"
            className="inline-flex justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
          >
            Use Demo Project
          </Link>
          <Link
            href="/scan"
            className="inline-flex justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
          >
            Run Mock Scan
          </Link>
        </div>
      </Card>
      <ComingNext
        title="Coming soon"
        items={[
          "Connect repository or upload app bundle",
          "Store project metadata in Supabase",
          "Start first ShipGuard Engine scan",
        ]}
      />
    </div>
  );
}

function ScanContent() {
  return (
    <Card>
      <SectionTitle title="Recent mock scan results" subtitle="These rows are deterministic and do not run analysis." />
      <div className="space-y-3">
        {mockScans.map((scan) => {
          const project = mockProjects.find((item) => item.id === scan.projectId);

          return (
          <div
            key={scan.id}
            className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 md:grid-cols-[1fr_auto_auto]"
          >
            <div>
              <p className="font-medium text-white">{project?.name ?? "Unknown project"}</p>
              <p className="mt-1 text-sm text-zinc-500">{scan.summary}</p>
            </div>
            <p className="font-mono text-sm text-zinc-200">{scan.overallScore}% ready</p>
            <StatusBadge status={getScanStatus(scan.status)} />
          </div>
          );
        })}
      </div>
    </Card>
  );
}

function BugFinderContent() {
  return (
    <Card>
      <SectionTitle title="Mock bug queue" subtitle="Future bug detection will group findings by launch impact." />
      <div className="space-y-3">
        {mockScanIssues.map((item) => {
          const project = mockProjects.find((project) => project.id === item.projectId);

          return (
          <div key={item.title} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-xs text-zinc-500">{project?.name ?? "Unknown project"}</span>
              <SeverityBadge severity={item.severity} />
            </div>
            <p className="text-sm font-medium text-white">{item.title}</p>
          </div>
          );
        })}
      </div>
    </Card>
  );
}

function DuplicateFinderContent() {
  return (
    <Card>
      <SectionTitle title="Duplicate/conflict preview" subtitle="No real file scanning is implemented in this foundation step." />
      <div className="grid gap-4 md:grid-cols-3">
        {mockDuplicateGroups.map((group) => (
          <div key={group.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-zinc-500">{group.title}</p>
              <SeverityBadge severity={group.severity} />
            </div>
            <p className="mt-3 font-mono text-3xl font-semibold text-white">
              {group.files.length}
            </p>
            <p className="mt-2 text-sm text-zinc-500">{group.conflictRisk}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function LaunchPlanContent() {
  return (
    <Card>
      <SectionTitle title="Mock launch sequence" subtitle="Goal-driven execution with verification gates." />
      <div className="space-y-3">
        {[
          "Resolve critical blockers before feature work",
          "Remove duplicate routes and conflicting generated files",
          "Apply builder-ready prompts in the target tool",
          "Re-scan and verify launch readiness improved",
        ].map((step, index) => (
          <div key={step} className="flex gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <span className="font-mono text-sm text-sky-300">0{index + 1}</span>
            <p className="text-sm font-medium text-white">{step}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function PromptPacksContent() {
  return (
    <Card>
      <SectionTitle title="Builder-ready prompt placeholders" subtitle="Prompt generation logic comes later." />
      <div className="grid gap-4 lg:grid-cols-3">
        {mockPromptPacks.map((pack) => (
          <div key={pack.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-xs text-zinc-500">
                {formatBuilderTarget(pack.targetTool)}
              </p>
              <StatusBadge status={{ label: "AI Generated", icon: "*", tone: "accent" }} />
            </div>
            <p className="mt-4 font-medium text-white">{pack.title}</p>
            <p className="mt-3 text-sm leading-6 text-zinc-500">
              Mock prompt card. Future prompts will include success criteria, constraints, and verification steps.
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ReportsContent() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ComingNext
        title="Report exports"
        items={["Founder launch summary", "Technical risk report", "Builder prompt application log"]}
      />
      <Card>
        <SectionTitle title="Empty state" subtitle="No real report generation exists yet." />
        <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center">
          <p className="font-medium text-white">Mock report center</p>
          <p className="mt-2 text-sm text-zinc-500">
            Re-scan history and launch evidence will appear here after the engine exists.
          </p>
        </div>
      </Card>
    </div>
  );
}

function SettingsContent() {
  return (
    <Card>
      <SectionTitle
        title="Settings scaffold"
        subtitle="Supabase, Stripe, auth, and integrations are intentionally not wired in this demo."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {["Workspace profile", "Deployment target", "Billing placeholder", "Integrations placeholder"].map(
          (item) => (
            <div key={item} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="font-medium text-white">{item}</p>
              <p className="mt-2 text-sm text-zinc-500">Coming soon. Mock data only.</p>
            </div>
          ),
        )}
      </div>
    </Card>
  );
}

function ComingNext({ title, items }: { title: string; items: string[] }) {
  return (
    <Card>
      <SectionTitle title={title} subtitle="Foundation-only scope marker." />
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item} className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-300">
            <span className="font-mono text-sky-300">+</span>
            {item}
          </li>
        ))}
      </ul>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd className="mt-1 font-mono text-sm text-zinc-200">{value}</dd>
    </div>
  );
}
