import Link from "next/link";
import { notFound } from "next/navigation";
import {
  formatBuilderTarget,
  formatRelativeDate,
  getProjectStatus,
  mockBugFindings,
  mockDuplicateGroups,
  mockProjects,
  mockPromptPacks,
  mockScans,
} from "@/lib/mock";
import { StatusBadge } from "@/components/status-badge";
import { Card, MetricCard, PageHeader, SectionTitle } from "@/components/ui";

export function ProjectDetail({ id }: { id: string }) {
  const project = mockProjects.find((item) => item.id === id);

  if (!project) {
    notFound();
  }

  const scan = mockScans.find((item) => item.projectId === project.id);
  const bugs = mockBugFindings.filter((item) => item.projectId === project.id);
  const duplicates = mockDuplicateGroups.filter((item) => item.projectId === project.id);
  const prompts = mockPromptPacks.filter((item) => item.projectId === project.id);

  return (
    <div className="space-y-8">
      <PageHeader
        title={project.name}
        subtitle={project.description}
        action={<StatusBadge status={getProjectStatus(project.status)} />}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Readiness"
          value={`${project.launchReadinessScore}%`}
          detail="Mock launch score"
        />
        <MetricCard
          label="Scan score"
          value={`${scan?.overallScore ?? project.launchReadinessScore}%`}
          detail="Latest deterministic scan"
          tone="green"
        />
        <MetricCard label="Bugs" value={bugs.length} detail="Detected bug placeholders" tone="amber" />
        <MetricCard label="Duplicates" value={duplicates.length} detail="Conflict placeholders" tone="blue" />
        <MetricCard label="Prompts" value={prompts.length} detail="Generated mock fixes" tone="blue" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <SectionTitle
            title="Launch readiness snapshot"
            subtitle="Deterministic mock state for validating page structure."
          />
          <div className="space-y-4">
            {[
              ["Scan status", scan?.status ?? "No scan"],
              ["AI builder", formatBuilderTarget(project.aiProvider)],
              ["Framework", project.framework],
              ["Stack", project.stack.join(", ")],
              ["Database", project.database],
              ["Updated", formatRelativeDate(project.updatedAt)],
              ["Next action", "Apply generated prompts, then re-scan"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-4"
              >
                <span className="text-sm text-zinc-500">{label}</span>
                <span className="text-sm font-medium text-white">{value}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionTitle title="Mock fix workflow" subtitle="No real builder prompts are generated yet." />
          <div className="space-y-3">
            {["Inspect before editing", "Make surgical fixes", "Verify success criteria"].map(
              (item, index) => (
                <div key={item} className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <span className="font-mono text-sm text-sky-300">0{index + 1}</span>
                  <p className="text-sm text-zinc-300">{item}</p>
                </div>
              ),
            )}
          </div>
        </Card>
      </div>

      <Link href="/projects" className="text-sm font-medium text-sky-300 hover:text-sky-200">
        Back to projects
      </Link>
    </div>
  );
}
