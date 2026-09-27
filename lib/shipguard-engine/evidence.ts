import { evaluateEvidenceGates } from "@/lib/shipguard-engine/evidence-rules";
import type {
  EvidenceScan,
  EvidenceScanOptions,
  ManifestCoverage,
} from "@/lib/shipguard-engine/evidence-types";
import type { FileManifest, ProjectConfig } from "@/lib/shipguard-engine/types";
import {
  MANIFEST_BUDGET,
  validatePathCollection,
  validatePreviewBudget,
} from "@/lib/shipguard-engine/path-safety";

export const EVIDENCE_RULE_SET_VERSION = "manifest-gates/2" as const;

function normalizePath(value: string): string {
  return value.replace(/\\/g, "/").replace(/^\.\//, "").replace(/\/{2,}/g, "/").replace(/\/$/, "").trim();
}

function sortRecord<T>(record: Record<string, T> | undefined): Record<string, T> | undefined {
  if (!record) return undefined;
  return Object.fromEntries(Object.entries(record).sort(([left], [right]) => left.localeCompare(right)));
}

function normalizedManifest(manifest: FileManifest): FileManifest {
  const contentPreviews = manifest.contentPreviews
    ? Object.fromEntries(
        Object.entries(manifest.contentPreviews)
          .map(([path, content]) => [normalizePath(path), content] as const)
          .sort(([left], [right]) => left.localeCompare(right)),
      )
    : undefined;

  return {
    files: [...new Set(manifest.files.map(normalizePath).filter(Boolean))].sort(),
    contentPreviews,
    packageJson: manifest.packageJson
      ? {
          scripts: sortRecord(manifest.packageJson.scripts),
          dependencies: sortRecord(manifest.packageJson.dependencies),
          devDependencies: sortRecord(manifest.packageJson.devDependencies),
        }
      : undefined,
    envExample: manifest.envExample,
    frameworkHints: manifest.frameworkHints ? [...manifest.frameworkHints].sort() : undefined,
    routeList: manifest.routeList ? [...new Set(manifest.routeList.map(normalizePath))].sort() : undefined,
    coverage: manifest.coverage,
  };
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .filter((key) => record[key] !== undefined)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
    .join(",")}}`;
}

async function sha256(value: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function resolveManifestCoverage(manifest: FileManifest): ManifestCoverage {
  return {
    paths: "partial",
    contentPreviews: manifest.contentPreviews && Object.keys(manifest.contentPreviews).length > 0 ? "selected" : "none",
  };
}

function assertEvidenceManifestSafe(manifest: FileManifest): void {
  const errors = [
    ...validatePathCollection(manifest.files, "files", MANIFEST_BUDGET.maxFiles),
    ...validatePathCollection(manifest.routeList ?? [], "routeList", MANIFEST_BUDGET.maxRoutes),
    ...validatePreviewBudget(manifest.contentPreviews ?? {}),
  ];
  if (errors.length > 0) throw new Error(`Unsafe manifest input: ${errors.join(" ")}`);
}

function gateRelevantConfig(projectConfig?: ProjectConfig): Record<string, string | null> {
  return {
    billingProvider: projectConfig?.billingProvider ?? null,
  };
}

export async function fingerprintManifest(manifest: FileManifest, projectConfig?: ProjectConfig): Promise<string> {
  assertEvidenceManifestSafe(manifest);
  return sha256(
    canonicalJson({
      ruleSetVersion: EVIDENCE_RULE_SET_VERSION,
      projectConfig: gateRelevantConfig(projectConfig),
      manifest: normalizedManifest(manifest),
    }),
  );
}

export async function scanManifestEvidence(
  manifest: FileManifest,
  projectConfig: ProjectConfig,
  options: EvidenceScanOptions = {},
): Promise<EvidenceScan> {
  const coverage = resolveManifestCoverage(manifest);
  const inputFingerprint = await fingerprintManifest(manifest, projectConfig);
  const gates = evaluateEvidenceGates(normalizedManifest(manifest), projectConfig);
  const supportedGates = gates.filter((gate) => gate.includedInSupportedCheckSummary);

  return {
    contract: "sandpaper.evidence/v2",
    scanId: `scan-${projectConfig.projectId}-${inputFingerprint.slice(0, 12)}`,
    projectId: projectConfig.projectId,
    engineVersion: "1",
    ruleSetVersion: EVIDENCE_RULE_SET_VERSION,
    inputFingerprint,
    observedAt: options.observedAt ?? new Date().toISOString(),
    coverage,
    gates,
    summary: {
      passed: gates.filter((gate) => gate.status === "pass").length,
      failed: gates.filter((gate) => gate.status === "fail").length,
      unknown: gates.filter((gate) => gate.status === "unknown").length,
      notApplicable: gates.filter((gate) => gate.status === "not_applicable").length,
      supportedManifestChecksPass: supportedGates.every(
        (gate) => gate.status === "pass" || gate.status === "not_applicable",
      ),
    },
  };
}
