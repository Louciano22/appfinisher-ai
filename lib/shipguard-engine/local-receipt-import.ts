import { relativePosixPathError } from "./path-safety";

// Browser-safe parser. Local collection itself remains a separate Node-only CLI.
export const MAX_LOCAL_RECEIPT_BYTES = 128_000;
const HEX_256 = /^[a-f0-9]{64}$/i;
const PROJECT_ID = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/;
const GATES = {
  "production-build-command": { title: "Production build command", statuses: ["pass", "fail", "unknown"] },
  "single-package-manager": { title: "Single package manager lockfile", statuses: ["fail", "unknown"] },
  "stripe-webhook-signature": { title: "Stripe webhook signature check", statuses: ["unknown", "not_applicable"] },
  "single-route-family-ownership": { title: "Single route-family ownership", statuses: ["fail", "unknown"] },
} as const;
type GateId = keyof typeof GATES;
type GateStatus = "pass" | "fail" | "unknown" | "not_applicable";

export type LocalReceiptReview = {
  projectId: string;
  observedAt: string;
  manifestFingerprint: string;
  coverage: { paths: "partial"; content: "none" | "package_metadata_only" };
  collection: { listedFiles: number; skippedEntries: number; skippedSensitiveFiles: number; packageMetadata: "parsed" | "absent" };
  summary: { passed: number; failed: number; unknown: number; notApplicable: number };
  gates: { gateId: GateId; title: string; status: GateStatus }[];
};

function record(value: unknown, keys: string[], required = keys): value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const present = Object.keys(value);
  return present.every((key) => keys.includes(key) && key !== "__proto__" && key !== "constructor" && key !== "prototype") &&
    required.every((key) => Object.hasOwn(value, key));
}

function integer(value: unknown, maximum = 10_000): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0 && (value as number) <= maximum;
}

function shortText(value: unknown, maximum = 2_000): value is string {
  return typeof value === "string" && new TextEncoder().encode(value).byteLength <= maximum;
}

function validReference(value: unknown): boolean {
  if (!record(value, ["kind", "path", "field", "assertion", "observed"], ["kind", "assertion", "observed"])) return false;
  if (!["path", "manifest_field", "content_marker"].includes(String(value.kind)) ||
    typeof value.observed !== "boolean" || !shortText(value.assertion, 1_000)) return false;
  if (value.path !== undefined && (typeof value.path !== "string" || relativePosixPathError(value.path) !== null)) return false;
  if (value.field !== undefined && (!shortText(value.field, 256) || !/^[a-zA-Z0-9_.-]+$/.test(value.field))) return false;
  return true;
}

/** Parse a user-selected receipt as untrusted data; return only fields safe to review. */
export function parseLocalReceiptJson(text: string): LocalReceiptReview {
  const invalid = () => new Error("This is not a supported, bounded Sandpaper local receipt. No data was imported.");
  if (new TextEncoder().encode(text).byteLength > MAX_LOCAL_RECEIPT_BYTES) throw invalid();
  let value: unknown;
  try { value = JSON.parse(text); } catch { throw invalid(); }
  if (!record(value, ["contract", "source", "rootFingerprint", "projectId", "observedAt", "coverage", "runtimeVerification", "collection", "manifestFingerprint", "gates", "summary"]) ||
    value.contract !== "sandpaper.local-collection/v1" || value.source !== "authorized_local_folder" ||
    value.runtimeVerification !== "not_performed" || typeof value.rootFingerprint !== "string" || !HEX_256.test(value.rootFingerprint) ||
    typeof value.manifestFingerprint !== "string" || !HEX_256.test(value.manifestFingerprint) ||
    typeof value.projectId !== "string" || !PROJECT_ID.test(value.projectId) ||
    typeof value.observedAt !== "string" || value.observedAt.length > 40 ||
    !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value.observedAt) ||
    !Number.isFinite(Date.parse(value.observedAt))) throw invalid();
  const coverage = value.coverage;
  const collection = value.collection;
  const summary = value.summary;
  if (!record(coverage, ["paths", "content"]) || coverage.paths !== "partial" ||
    !["package_metadata_only", "none"].includes(String(coverage.content)) ||
    !record(collection, ["listedFiles", "skippedEntries", "skippedSensitiveFiles", "packageMetadata", "packageSha256"], ["listedFiles", "skippedEntries", "skippedSensitiveFiles", "packageMetadata"]) ||
    !integer(collection.listedFiles, 5_000) || !integer(collection.skippedEntries) || !integer(collection.skippedSensitiveFiles) ||
    collection.listedFiles + collection.skippedEntries + collection.skippedSensitiveFiles > 10_000 ||
    !["parsed", "absent"].includes(String(collection.packageMetadata)) ||
    (collection.packageMetadata === "parsed") !== (coverage.content === "package_metadata_only") ||
    (collection.packageMetadata === "parsed"
      ? typeof collection.packageSha256 !== "string" || !HEX_256.test(collection.packageSha256)
      : collection.packageSha256 !== undefined) ||
    !record(summary, ["passed", "failed", "unknown", "notApplicable"]) ||
    !integer(summary.passed, 4) || !integer(summary.failed, 4) || !integer(summary.unknown, 4) || !integer(summary.notApplicable, 4) ||
    !Array.isArray(value.gates) || value.gates.length !== 4) throw invalid();
  const seen = new Set<string>();
  const gates: LocalReceiptReview["gates"] = [];
  const counts = { passed: 0, failed: 0, unknown: 0, notApplicable: 0 };
  for (const gate of value.gates) {
    if (!record(gate, ["gateId", "title", "severity", "includedInSupportedCheckSummary", "status", "evidence", "explanation"]) ||
      typeof gate.gateId !== "string" || !Object.hasOwn(GATES, gate.gateId) || seen.has(gate.gateId)) throw invalid();
    const gateId = gate.gateId as GateId;
    if (gate.title !== GATES[gateId].title || gate.includedInSupportedCheckSummary !== true ||
      gate.severity !== (["production-build-command", "stripe-webhook-signature"].includes(gateId) ? "critical" : "high") ||
      !GATES[gateId].statuses.some((status) => status === gate.status) || !shortText(gate.explanation) ||
      !Array.isArray(gate.evidence) || gate.evidence.length > 100 || !gate.evidence.every(validReference)) throw invalid();
    seen.add(gateId);
    const status = gate.status as GateStatus;
    counts[status === "not_applicable" ? "notApplicable" : status === "pass" ? "passed" : status === "fail" ? "failed" : "unknown"]++;
    gates.push({ gateId, title: GATES[gateId].title, status });
  }
  if (Object.entries(counts).some(([key, count]) => summary[key] !== count)) throw invalid();
  return {
    projectId: value.projectId,
    observedAt: value.observedAt,
    manifestFingerprint: value.manifestFingerprint,
    coverage: { paths: "partial", content: coverage.content as LocalReceiptReview["coverage"]["content"] },
    collection: {
      listedFiles: collection.listedFiles as number,
      skippedEntries: collection.skippedEntries as number,
      skippedSensitiveFiles: collection.skippedSensitiveFiles as number,
      packageMetadata: collection.packageMetadata as "parsed" | "absent",
    },
    summary: counts,
    gates,
  };
}
