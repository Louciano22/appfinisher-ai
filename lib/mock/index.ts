import type { IssueSeverity, ProjectStatus, ScanStatus } from "@/lib/types";
import { mockProjects } from "@/lib/mock/projects";
import {
  mockBugFindings,
  mockDuplicateGroups,
  mockPromptPacks,
  mockScanIssues,
} from "@/lib/mock/scans";

export * from "@/lib/mock/projects";
export * from "@/lib/mock/scans";
export * from "@/lib/mock/file-trees";
export * from "@/lib/mock/bug-finder";
export * from "@/lib/mock/duplicate-finder";
export * from "@/lib/mock/promptpack";

export type StatusTone = "green" | "red" | "amber" | "blue" | "accent" | "zinc";

export type UiStatus = {
  label: string;
  icon: string;
  tone: StatusTone;
};

export const routeContent = {
  "/projects": {
    title: "Projects",
    subtitle: "Track unfinished AI-built SaaS apps with deterministic demo readiness status.",
  },
  "/new-project": {
    title: "New Project",
    subtitle: "Create a local scan from manual details, a pasted file tree, or manifest JSON.",
  },
  "/scan": {
    title: "Scan Results",
    subtitle: "Deterministic scan summaries that preview the launch-blocker workflow.",
  },
  "/bug-finder": {
    title: "Bug Finder",
    subtitle: "Deterministic bug findings grouped by severity and launch impact.",
  },
  "/duplicate-finder": {
    title: "Duplicate Finder",
    subtitle: "A deterministic view for duplicate files, conflicting routes, and copied components.",
  },
  "/launch-plan": {
    title: "Launch Plan",
    subtitle: "A generated launch sequence preview with clear next steps and verification gates.",
  },
  "/launch-os": {
    title: "Launch OS",
    subtitle: "The premium command-center vision for readiness, fixes, prompts, risk analysis, and final launch verification.",
  },
  "/prompt-packs": {
    title: "Prompt Packs",
    subtitle: "Builder-ready prompt packs for Cursor, Lovable, Claude Code, Replit, and Bolt.",
  },
  "/reports": {
    title: "Reports",
    subtitle: "Exportable readiness reports for founders and technical reviewers.",
  },
  "/settings": {
    title: "Settings",
    subtitle: "Workspace, deployment, billing, and integration settings will live here later.",
  },
};

export const dashboardStats = {
  totalProjects: mockProjects.length,
  averageLaunchReadinessScore: Math.round(
    mockProjects.reduce((total, project) => total + project.launchReadinessScore, 0) /
      mockProjects.length,
  ),
  criticalBlockersCount: mockScanIssues.filter(
    (issue) => issue.severity === "critical" && issue.status === "open",
  ).length,
  bugsFoundCount: mockBugFindings.length,
  duplicateConflictsCount: mockDuplicateGroups.length,
  promptPacksGeneratedCount: mockPromptPacks.length,
};

export function getProjectStatus(status: ProjectStatus): UiStatus {
  const statuses: Record<ProjectStatus, UiStatus> = {
    draft: { label: "Draft", icon: "-", tone: "zinc" },
    needs_scan: { label: "Needs scan", icon: "?", tone: "blue" },
    scanned: { label: "Scanned", icon: "+", tone: "blue" },
    needs_fixes: { label: "Needs fixes", icon: "!", tone: "amber" },
    ready: { label: "Launch ready", icon: "+", tone: "green" },
    archived: { label: "Archived", icon: "-", tone: "zinc" },
  };

  return statuses[status];
}

export function getScanStatus(status: ScanStatus): UiStatus {
  const statuses: Record<ScanStatus, UiStatus> = {
    queued: { label: "Queued", icon: "-", tone: "zinc" },
    running: { label: "Running", icon: ">", tone: "blue" },
    completed: { label: "Completed", icon: "+", tone: "green" },
    failed: { label: "Failed", icon: "x", tone: "red" },
  };

  return statuses[status];
}

export function getSeverityStatus(severity: IssueSeverity): UiStatus {
  const statuses: Record<IssueSeverity, UiStatus> = {
    critical: { label: "Critical", icon: "!", tone: "red" },
    high: { label: "High", icon: "!", tone: "amber" },
    medium: { label: "Medium", icon: "-", tone: "blue" },
    low: { label: "Low", icon: "+", tone: "green" },
  };

  return statuses[severity];
}

export function formatBuilderTarget(target: string) {
  return target
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function formatRelativeDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
