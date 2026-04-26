import Link from "next/link";
import {
  dashboardStats,
  formatBuilderTarget,
  formatRelativeDate,
  getProjectStatus,
  getScanStatus,
  mockProjects,
  mockPromptPacks,
  mockScanIssues,
  mockScans,
} from "@/lib/mock";
import { SeverityBadge, StatusBadge } from "@/components/status-badge";
import { Card, MetricCard, PageHeader, SectionTitle } from "@/components/ui";

export function Dashboard() {
  const launchBlockers = mockScanIssues.filter(
    (issue) => issue.severity === "critical" || issue.severity === "high",
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Finish AI-built apps with launch discipline"
        subtitle="AppFinisher AI is a deterministic launch-completion demo that helps identify detected risks, prioritize recommended fixes, and generate builder-ready prompts before production review."
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/new-project"
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              New Project
            </Link>
            <Link
              href="/scan"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-950/40 transition hover:bg-blue-500"
            >
              Run Mock Scan
            </Link>
            <Link
              href="/launch-os"
              className="inline-flex items-center justify-center rounded-xl border border-sky-300/30 bg-blue-500/10 px-4 py-2.5 text-sm font-semibold text-sky-100 transition hover:bg-blue-500/20"
            >
              Open Launch OS
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-medium text-white">Mock data loaded</p>
              <p className="mt-1 text-sm text-zinc-500">
                Dashboard is using deterministic demo data, not live repository scans.
              </p>
            </div>
            <StatusBadge status={{ label: "Ready", icon: "+", tone: "green" }} />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-medium text-white">No live scan running</p>
              <p className="mt-1 text-sm text-zinc-500">
                Use Project Scan to run the mocked ShipGuard Engine.
              </p>
            </div>
            <StatusBadge status={{ label: "Idle", icon: "-", tone: "blue" }} />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-medium text-white">No integration errors</p>
              <p className="mt-1 text-sm text-zinc-500">
                GitHub, auth, billing, and Supabase are intentionally not connected.
              </p>
            </div>
            <StatusBadge status={{ label: "Mock Only", icon: "!", tone: "amber" }} />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <MetricCard
          label="Projects"
          value={dashboardStats.totalProjects}
          detail="Tracked SaaS builds in mock workspace"
        />
        <MetricCard
          label="Avg readiness"
          value={`${dashboardStats.averageLaunchReadinessScore}%`}
          detail="Deterministic mock launch score"
          tone="green"
        />
        <MetricCard
          label="Critical blockers"
          value={dashboardStats.criticalBlockersCount}
          detail="Needs founder attention before ship"
          tone="red"
        />
        <MetricCard
          label="Bugs"
          value={dashboardStats.bugsFoundCount}
          detail="Mock issues grouped by severity"
          tone="amber"
        />
        <MetricCard
          label="Duplicates"
          value={dashboardStats.duplicateConflictsCount}
          detail="Route and file conflicts found"
          tone="blue"
        />
        <MetricCard
          label="Prompt packs"
          value={dashboardStats.promptPacksGeneratedCount}
          detail="AI builder fixes generated"
          tone="blue"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Card>
          <SectionTitle
            title="Recent scans"
            subtitle="Current evidence from deterministic ShipGuard checks; review before production."
          />
          <div className="overflow-hidden rounded-xl border border-white/10">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-white/[0.03] text-xs uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Project</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Findings</th>
                  <th className="px-4 py-3">Scanned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {mockScans.map((scan) => {
                  const project = mockProjects.find((item) => item.id === scan.projectId);

                  return (
                    <tr key={scan.id}>
                      <td className="px-4 py-4 font-medium text-white">
                        {project?.name ?? "Unknown project"}
                      </td>
                      <td className="px-4 py-4 font-mono text-zinc-200">
                        {scan.overallScore}%
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={getScanStatus(scan.status)} />
                      </td>
                      <td className="px-4 py-4 text-zinc-400">{scan.summary}</td>
                      <td className="px-4 py-4 text-zinc-500">
                        {formatRelativeDate(scan.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <SectionTitle title="Launch blockers" subtitle="Prioritized detected risks from current scan evidence." />
          <div className="space-y-3">
            {launchBlockers.map((blocker) => {
              const project = mockProjects.find((item) => item.id === blocker.projectId);

              return (
                <div
                  key={blocker.id}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-xs text-zinc-500">
                      {project?.name ?? "Unknown project"}
                    </p>
                    <SeverityBadge severity={blocker.severity} />
                  </div>
                  <p className="text-sm font-medium leading-6 text-white">
                    {blocker.title}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionTitle
            title="Projects at a glance"
            subtitle="Use these deterministic examples to validate the navigation and layout."
          />
          <div className="space-y-3">
            {mockProjects.map((project) => (
              <Link
                href={`/projects/${project.id}`}
                key={project.id}
                className="block rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-sky-300/40 hover:bg-blue-500/10"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-white">{project.name}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {formatBuilderTarget(project.aiProvider)} / {project.framework}
                    </p>
                  </div>
                  <StatusBadge status={getProjectStatus(project.status)} />
                </div>
                <div className="mt-4 h-2 rounded-full bg-zinc-800">
                  <div
                    className="h-2 rounded-full bg-sky-400"
                    style={{ width: `${project.launchReadinessScore}%` }}
                  />
                </div>
              </Link>
            ))}
          </div>
        </Card>

        <Card>
          <SectionTitle
            title="Prompt pack preview"
            subtitle="AI-generated content is labeled and still mock-only."
          />
          <div className="space-y-3">
            {mockPromptPacks.map((pack) => (
              <div
                key={pack.id}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-mono text-xs text-zinc-500">
                    {formatBuilderTarget(pack.targetTool)}
                  </p>
                  <StatusBadge status={{ label: "AI Generated", icon: "*", tone: "accent" }} />
                </div>
                <p className="mt-3 text-sm font-medium text-white">{pack.title}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
