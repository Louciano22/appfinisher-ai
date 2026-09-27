import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { collectLocalEvidence } from "../lib/shipguard-engine/local-evidence";
import { MAX_LOCAL_RECEIPT_BYTES, parseLocalReceiptJson } from "../lib/shipguard-engine/local-receipt-import";

async function receipt() {
  const root = await mkdtemp(path.join(tmpdir(), "sandpaper-receipt-"));
  try {
    await writeFile(path.join(root, "package.json"), JSON.stringify({ scripts: { build: "next build" } }));
    await writeFile(path.join(root, ".env.local"), "CANARY_SECRET=do-not-display");
    return await collectLocalEvidence(root, { projectId: "receipt-test", name: "Receipt Test", billingProvider: "none" });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test("local CLI receipt imports as curated, separate, unverified review without raw evidence", async () => {
  const raw = await receipt();
  const review = parseLocalReceiptJson(JSON.stringify(raw));
  assert.equal(review.projectId, "receipt-test");
  assert.equal(review.coverage.paths, "partial");
  assert.equal(review.summary.unknown, 2);
  assert.equal(review.gates.find((gate) => gate.gateId === "stripe-webhook-signature")?.status, "not_applicable");
  assert.equal(JSON.stringify(review).includes("package.json"), false);
  assert.equal(JSON.stringify(review).includes("rootFingerprint"), false);
  assert.equal(JSON.stringify(review).includes("CANARY_SECRET"), false);
});

test("rejects tampering, incompatible versions, extra fields, duplicate gates and unsupported pass claims", async () => {
  const original = await receipt();
  const cases: unknown[] = [
    { ...original, contract: "sandpaper.evidence/v2" },
    { ...original, runtimeVerification: "passed" },
    { ...original, rootFingerprint: "not-a-hash" },
    { ...original, observedAt: "2026-99-99T12:00:00.000Z" },
    { ...original, surprise: "secret" },
    { ...original, coverage: { paths: "complete", content: "package_metadata_only" } },
    { ...original, summary: { ...original.summary, passed: 4 } },
    { ...original, gates: original.gates.slice(0, 3) },
    { ...original, gates: [original.gates[0], original.gates[0], original.gates[2], original.gates[3]] },
    { ...original, gates: original.gates.map((gate) => gate.gateId === "stripe-webhook-signature" ? { ...gate, status: "pass" } : gate) },
    { ...original, gates: original.gates.map((gate) => gate.gateId === "single-package-manager" ? { ...gate, evidence: [{ ...gate.evidence[0], path: "../secret" }] } : gate) },
    { ...original, gates: original.gates.map((gate) => gate.gateId === "production-build-command" ? { ...gate, evidence: [{ ...gate.evidence[0], assertion: "SECRET".repeat(1000) }] } : gate) },
  ];
  for (const value of cases) assert.throws(() => parseLocalReceiptJson(JSON.stringify(value)), /not a supported, bounded/);
});

test("a schema-valid forged receipt remains importable data, not authenticated proof", async () => {
  const forged = await receipt();
  forged.rootFingerprint = "a".repeat(64);
  forged.manifestFingerprint = "b".repeat(64);
  forged.observedAt = "2026-09-27T00:00:00.000Z";
  const review = parseLocalReceiptJson(JSON.stringify(forged));
  assert.equal(review.manifestFingerprint, "b".repeat(64));
  assert.equal(Object.hasOwn(review, "verified"), false);
  assert.equal(Object.hasOwn(review, "rootFingerprint"), false);
});

test("rejects malformed, deep, oversized and prototype-key JSON without echoing it", () => {
  for (const text of ["{secret", "[".repeat(1000) + "]".repeat(1000), "x".repeat(MAX_LOCAL_RECEIPT_BYTES + 1), '{"__proto__":{"secret":"CANARY"}}']) {
    assert.throws(() => parseLocalReceiptJson(text), (error: unknown) => {
      assert.equal(error instanceof Error && error.message.includes("CANARY"), false);
      return true;
    });
  }
});
