import type {
  EvidenceGateStatus,
  EvidenceScan,
  EvidenceComparison,
  GateTransition,
} from "@/lib/shipguard-engine/evidence-types";

function transitionFor(
  previous: EvidenceGateStatus,
  current: EvidenceGateStatus,
): GateTransition {
  if (current === "unknown") return "unassessable";
  if (previous === "fail" && current === "pass") return "declared_fixed";
  if (previous === "fail" && current === "fail") return "declared_still_failing";
  if (previous === "fail" && current === "not_applicable") return "unassessable";
  if (previous === "pass" && current === "fail") return "declared_regression";
  if (previous === "pass" && current === "pass") return "unchanged_pass";
  if (previous === "pass" && current === "not_applicable") return "unassessable";
  if (previous === "unknown" && current === "pass") return "declared_new_pass";
  if (previous === "unknown" && current === "fail") return "declared_regression";
  if (previous === "not_applicable" && current === "fail") return "declared_regression";
  if (previous === "not_applicable" && current === "pass") return "declared_new_pass";
  if (current === "not_applicable") return "not_applicable";
  return "unassessable";
}

function gateMap(scan: EvidenceScan): Map<string, EvidenceScan["gates"][number]> {
  const result = new Map(scan.gates.map((gate) => [gate.gateId, gate]));
  if (result.size !== scan.gates.length) throw new Error("Evidence scan contains duplicate gate identifiers.");
  return result;
}

export function compareEvidenceScans(previous: EvidenceScan, current: EvidenceScan): EvidenceComparison {
  if (previous.projectId !== current.projectId) {
    throw new Error("Evidence scans must belong to the same project.");
  }
  if (
    previous.contract !== current.contract ||
    previous.engineVersion !== current.engineVersion ||
    previous.ruleSetVersion !== current.ruleSetVersion
  ) {
    throw new Error("Evidence scans use incompatible contract, engine, or rule-set versions.");
  }

  const previousById = gateMap(previous);
  const currentById = gateMap(current);
  const previousGateIds = [...previousById.keys()].sort();
  const currentGateIds = [...currentById.keys()].sort();
  if (previousGateIds.join("\0") !== currentGateIds.join("\0")) {
    throw new Error("Evidence scans use incompatible gate sets.");
  }

  const gateIds = currentGateIds;
  const transitions = gateIds.map((gateId) => {
    const previousGate = previousById.get(gateId)!;
    const currentGate = currentById.get(gateId)!;
    const previousStatus: EvidenceGateStatus = previousGate.status;
    const currentStatus: EvidenceGateStatus = currentGate.status;
    return {
      gateId,
      title: currentGate.title,
      transition: transitionFor(previousStatus, currentStatus),
      previousStatus,
      currentStatus,
    };
  });

  return {
    contract: "sandpaper.comparison/v2",
    previousScanId: previous.scanId,
    currentScanId: current.scanId,
    projectId: current.projectId,
    transitions,
    declaredFixedGateIds: transitions.filter((item) => item.transition === "declared_fixed").map((item) => item.gateId),
    declaredStillFailingGateIds: transitions
      .filter((item) => item.transition === "declared_still_failing")
      .map((item) => item.gateId),
    declaredRegressionGateIds: transitions
      .filter((item) => item.transition === "declared_regression")
      .map((item) => item.gateId),
    declaredNewPassGateIds: transitions
      .filter((item) => item.transition === "declared_new_pass")
      .map((item) => item.gateId),
    unassessableGateIds: transitions.filter((item) => item.transition === "unassessable").map((item) => item.gateId),
    supportedManifestChecksPass: current.summary.supportedManifestChecksPass,
  };
}
