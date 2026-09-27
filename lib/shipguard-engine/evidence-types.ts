import type { IssueSeverity } from "@/lib/types";

export type ManifestCoverage = {
  paths: "partial";
  contentPreviews: "selected" | "none";
};

export type EvidenceReference = {
  kind: "path" | "manifest_field" | "content_marker";
  path?: string;
  field?: string;
  assertion: string;
  observed: boolean;
};

export type EvidenceGateStatus = "pass" | "fail" | "unknown" | "not_applicable";

export type EvidenceGateResult = {
  gateId: string;
  title: string;
  severity: IssueSeverity;
  includedInSupportedCheckSummary: boolean;
  status: EvidenceGateStatus;
  evidence: EvidenceReference[];
  explanation: string;
};

export type EvidenceScan = {
  contract: "sandpaper.evidence/v2";
  scanId: string;
  projectId: string;
  engineVersion: "1";
  ruleSetVersion: "manifest-gates/2";
  inputFingerprint: string;
  observedAt: string;
  coverage: ManifestCoverage;
  gates: EvidenceGateResult[];
  summary: {
    passed: number;
    failed: number;
    unknown: number;
    notApplicable: number;
    supportedManifestChecksPass: boolean;
  };
};

export type GateTransition =
  | "declared_fixed"
  | "declared_still_failing"
  | "declared_regression"
  | "declared_new_pass"
  | "unchanged_pass"
  | "unassessable"
  | "not_applicable";

export type EvidenceComparison = {
  contract: "sandpaper.comparison/v2";
  previousScanId: string;
  currentScanId: string;
  projectId: string;
  transitions: Array<{
    gateId: string;
    title: string;
    transition: GateTransition;
    previousStatus: EvidenceGateStatus;
    currentStatus: EvidenceGateStatus;
  }>;
  declaredFixedGateIds: string[];
  declaredStillFailingGateIds: string[];
  declaredRegressionGateIds: string[];
  declaredNewPassGateIds: string[];
  unassessableGateIds: string[];
  supportedManifestChecksPass: boolean;
};

export type EvidenceScanOptions = {
  observedAt?: string;
};
