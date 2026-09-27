import type { FileManifest, ProjectConfig } from "@/lib/shipguard-engine/types";
import type {
  EvidenceGateResult,
  EvidenceReference,
} from "@/lib/shipguard-engine/evidence-types";

const lockfilePattern = /(?:^|\/)(?:package-lock\.json|npm-shrinkwrap\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb?)$/;
const stripeWebhookPattern = /^(?:(?:src\/)?app\/api\/(?:stripe\/webhooks?|webhooks?\/stripe)\/route\.(?:[cm]?[jt]s)|(?:src\/)?pages\/api\/(?:stripe\/webhooks?|webhooks?\/stripe)\.(?:[cm]?[jt]s))$/i;
const signatureVerificationPattern =
  /(?:stripe\.)?webhooks?\.constructEvent\s*\(|verify(?:Stripe|Webhook)Signature\s*\(/i;

function normalizePath(value: string): string {
  return value.replace(/\\/g, "/").replace(/^\.\//, "").replace(/\/{2,}/g, "/").replace(/\/$/, "").trim();
}

function reference(params: EvidenceReference): EvidenceReference {
  return params;
}

function buildScriptGate(manifest: FileManifest): EvidenceGateResult {
  const buildScript = manifest.packageJson?.scripts?.build;
  const packageMetadataProvided = Boolean(manifest.packageJson);
  const hasBuildScript = typeof buildScript === "string" && buildScript.trim().length > 0;

  return {
    gateId: "production-build-command",
    title: "Production build command",
    severity: "critical",
    includedInSupportedCheckSummary: true,
    status: hasBuildScript ? "pass" : packageMetadataProvided ? "fail" : "unknown",
    evidence: [
      reference({
        kind: "manifest_field",
        field: "packageJson.scripts.build",
        assertion: "A non-empty production build command is declared.",
        observed: hasBuildScript,
      }),
    ],
    explanation: hasBuildScript
      ? "The supplied package metadata declares a production build command."
      : packageMetadataProvided
        ? "Package metadata was supplied, but it does not declare a production build command."
        : "Package metadata was not supplied, so this manifest check is unknown.",
  };
}

function packageManagerGate(manifest: FileManifest): EvidenceGateResult {
  const lockfiles = [...new Set(manifest.files.map(normalizePath).filter((path) => lockfilePattern.test(path)))].sort();
  const status = lockfiles.length > 1 ? "fail" : "unknown";

  return {
    gateId: "single-package-manager",
    title: "Single package manager lockfile",
    severity: "high",
    includedInSupportedCheckSummary: true,
    status,
    evidence:
      lockfiles.length > 0
        ? lockfiles.map((path) =>
            reference({
              kind: "path",
              path,
              assertion: "Recognized package manager lockfile is present.",
              observed: true,
            }),
          )
        : [
            reference({
              kind: "path",
              assertion: "At least one recognized package manager lockfile is present.",
              observed: false,
            }),
          ],
    explanation:
      lockfiles.length > 1
        ? `The manifest declares multiple lockfiles: ${lockfiles.join(", ")}.`
        : lockfiles.length === 1
          ? `The manifest declares ${lockfiles[0]}, but a pasted path list cannot establish that no other lockfile exists.`
          : "The pasted path list cannot establish that a lockfile is absent.",
  };
}

function stripeDetected(manifest: FileManifest, projectConfig: ProjectConfig): boolean {
  if (projectConfig.billingProvider === "stripe") return true;
  const packageText = JSON.stringify(manifest.packageJson ?? {}).toLowerCase();
  return packageText.includes("stripe") || manifest.files.some((path) => normalizePath(path).toLowerCase().includes("stripe"));
}

function stripeWebhookGate(
  manifest: FileManifest,
  projectConfig: ProjectConfig,
): EvidenceGateResult {
  const detected = stripeDetected(manifest, projectConfig);
  const explicitlyNotStripe = projectConfig.billingProvider === "none" || projectConfig.billingProvider === "paddle";
  if (!detected && explicitlyNotStripe) {
    return {
      gateId: "stripe-webhook-signature",
      title: "Stripe webhook signature check",
      severity: "critical",
      includedInSupportedCheckSummary: true,
      status: "not_applicable",
      evidence: [],
      explanation: "Project configuration explicitly selects a non-Stripe billing provider and the manifest declares no Stripe path or dependency.",
    };
  }

  const webhookPaths = [...new Set(manifest.files.map(normalizePath).filter((path) => stripeWebhookPattern.test(path)))].sort();
  if (webhookPaths.length === 0) {
    return {
      gateId: "stripe-webhook-signature",
      title: "Stripe webhook signature check",
      severity: "critical",
      includedInSupportedCheckSummary: true,
      status: "unknown",
      evidence: [
        reference({
          kind: "path",
          assertion: "A Stripe webhook route is present.",
          observed: false,
        }),
      ],
      explanation: "Stripe is configured, but a pasted path list cannot establish whether a webhook route is absent.",
    };
  }

  const routeEvidence = webhookPaths.map((path) => {
    const preview = manifest.contentPreviews?.[path];
    return {
      path,
      hasPreview: typeof preview === "string" && preview.length > 0,
      markerObserved: typeof preview === "string" && signatureVerificationPattern.test(preview),
    };
  });
  const missingPreview = routeEvidence.filter((item) => !item.hasPreview);

  return {
    gateId: "stripe-webhook-signature",
    title: "Stripe webhook signature check",
    severity: "critical",
    includedInSupportedCheckSummary: true,
    status: "unknown",
    evidence: routeEvidence.map((item) =>
      reference({
        kind: "content_marker",
        path: item.path,
        assertion: "A heuristic signature-check marker appears in the supplied preview; this marker is not execution evidence.",
        observed: item.markerObserved,
      }),
    ),
    explanation:
      missingPreview.length > 0
        ? `Webhook preview content was not supplied for: ${missingPreview.map((item) => item.path).join(", ")}.`
        : "Static text markers cannot establish that signature validation executes correctly, so this check remains unknown.",
  };
}

function appRoute(path: string): string | null {
  const normalized = normalizePath(path);
  if (/^app\/page\.(tsx?|jsx?)$/.test(normalized)) return "/";
  const match = normalized.match(/^app\/(.+)\/page\.(tsx?|jsx?)$/);
  if (!match?.[1]) return null;
  const segments = match[1].split("/").filter((segment) => !/^\(.+\)$/.test(segment));
  return `/${segments.join("/")}`;
}

function pagesRoute(path: string): string | null {
  const normalized = normalizePath(path);
  const match = normalized.match(/^pages\/(.+)\.(tsx?|jsx?)$/);
  if (!match?.[1] || match[1].startsWith("_")) return null;
  if (match[1] === "index") return "/";
  const withoutIndex = match[1].replace(/\/index$/, "");
  return `/${withoutIndex}`;
}

function routeOwnershipGate(manifest: FileManifest): EvidenceGateResult {
  const routeOwners = new Map<string, { app: string[]; pages: string[] }>();
  for (const rawPath of manifest.files) {
    const path = normalizePath(rawPath);
    const app = appRoute(path);
    const pages = pagesRoute(path);
    const route = app ?? pages;
    if (!route) continue;
    const owners = routeOwners.get(route) ?? { app: [], pages: [] };
    if (app) owners.app.push(path);
    if (pages) owners.pages.push(path);
    routeOwners.set(route, owners);
  }

  const conflicts = [...routeOwners.entries()]
    .filter(([, owners]) => owners.app.length > 0 && owners.pages.length > 0)
    .sort(([left], [right]) => left.localeCompare(right));
  const conflictPaths = conflicts.flatMap(([, owners]) => [...owners.app, ...owners.pages]).sort();
  const status = conflicts.length > 0 ? "fail" : "unknown";

  return {
    gateId: "single-route-family-ownership",
    title: "Single route-family ownership",
    severity: "high",
    includedInSupportedCheckSummary: true,
    status,
    evidence:
      conflictPaths.length > 0
        ? conflictPaths.map((path) =>
            reference({
              kind: "path",
              path,
              assertion: "This declared route conflicts with the other router family.",
              observed: false,
            }),
          )
        : [
            reference({
              kind: "path",
            assertion: "No equivalent App Router and Pages Router routes appear in the supplied paths; absence is not established.",
            observed: false,
            }),
          ],
    explanation:
      status === "fail"
        ? `Conflicting router ownership was found for: ${conflicts.map(([route]) => route).join(", ")}.`
        : "No declared conflict was found, but a pasted path list cannot establish that another route owner is absent.",
  };
}

export function evaluateEvidenceGates(
  manifest: FileManifest,
  projectConfig: ProjectConfig,
): EvidenceGateResult[] {
  return [
    buildScriptGate(manifest),
    packageManagerGate(manifest),
    stripeWebhookGate(manifest, projectConfig),
    routeOwnershipGate(manifest),
  ];
}
