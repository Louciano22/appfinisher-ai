import assert from "node:assert/strict";
import test from "node:test";
import {
  compareEvidenceScans,
  fingerprintManifest,
  generateLaunchPlanFromScanResult,
  parseManifestJson,
  parsePastedFileTree,
  scanFileManifest,
  scanManifestEvidence,
  type FileManifest,
  type ProjectConfig,
} from "../lib/shipguard-engine/index";

const projectConfig: ProjectConfig = {
  projectId: "evidence-demo",
  name: "Evidence Demo",
  framework: "Next.js App Router",
  billingProvider: "stripe",
  deploymentProvider: "vercel",
};

function healthyManifest(): FileManifest {
  return {
    files: [
      "package.json",
      "package-lock.json",
      "app/page.tsx",
      "app/dashboard/page.tsx",
      "app/api/stripe/webhooks/route.ts",
    ],
    contentPreviews: {
      "app/api/stripe/webhooks/route.ts":
        "const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);",
    },
    packageJson: {
      scripts: { build: "next build", lint: "eslint" },
      dependencies: { next: "16.2.4", stripe: "latest" },
    },
    coverage: { paths: "partial", contentPreviews: "selected" },
  };
}

function brokenManifest(): FileManifest {
  const manifest = healthyManifest();
  return {
    ...manifest,
    files: [...manifest.files, "yarn.lock", "pages/dashboard.tsx"],
    contentPreviews: {
      "app/api/stripe/webhooks/route.ts": "return Response.json({ received: true });",
    },
    packageJson: {
      ...manifest.packageJson,
      scripts: { lint: "eslint" },
    },
  };
}

function gate(scan: Awaited<ReturnType<typeof scanManifestEvidence>>, gateId: string) {
  const result = scan.gates.find((item) => item.gateId === gateId);
  assert.ok(result, `Expected evidence gate ${gateId}.`);
  return result;
}

test("only positive manifest checks pass; absence-dependent checks remain unknown", async () => {
  const scan = await scanManifestEvidence(healthyManifest(), projectConfig, {
    observedAt: "2026-09-27T00:00:00.000Z",
  });

  assert.equal(gate(scan, "production-build-command").status, "pass");
  assert.equal(gate(scan, "single-package-manager").status, "unknown");
  assert.equal(gate(scan, "stripe-webhook-signature").status, "unknown");
  assert.equal(gate(scan, "single-route-family-ownership").status, "unknown");
  assert.equal(scan.summary.supportedManifestChecksPass, false);
});

test("evidence gates fail with direct evidence for four broken launch controls", async () => {
  const scan = await scanManifestEvidence(brokenManifest(), projectConfig);

  assert.equal(gate(scan, "production-build-command").status, "fail");
  assert.equal(gate(scan, "single-package-manager").status, "fail");
  assert.deepEqual(
    gate(scan, "single-package-manager").evidence.map((item) => item.path),
    ["package-lock.json", "yarn.lock"],
  );
  assert.equal(gate(scan, "stripe-webhook-signature").status, "unknown");
  assert.equal(gate(scan, "single-route-family-ownership").status, "fail");
  assert.deepEqual(
    gate(scan, "single-route-family-ownership").evidence.map((item) => item.path),
    ["app/dashboard/page.tsx", "pages/dashboard.tsx"],
  );
  assert.equal(scan.summary.supportedManifestChecksPass, false);
});

test("missing webhook content and partial path coverage remain unknown", async () => {
  const manifest = healthyManifest();
  const scan = await scanManifestEvidence(
    {
      ...manifest,
      contentPreviews: undefined,
      coverage: { paths: "partial", contentPreviews: "none" },
    },
    projectConfig,
  );

  assert.equal(gate(scan, "single-package-manager").status, "unknown");
  assert.equal(gate(scan, "stripe-webhook-signature").status, "unknown");
  assert.equal(gate(scan, "single-route-family-ownership").status, "unknown");
  assert.equal(scan.summary.supportedManifestChecksPass, false);
});

test("manifest parser rejects malformed coverage and unsafe field shapes", () => {
  const invalidCoverage = parseManifestJson(
    JSON.stringify({
      files: ["package.json"],
      coverage: { paths: "complete", contentPreviews: "everything" },
    }),
  );
  assert.ok(invalidCoverage.errors.some((error) => error.startsWith("coverage must declare")));

  const invalidFiles = parseManifestJson(
    JSON.stringify({ files: ["package.json", 42], contentPreviews: { "app/page.tsx": false } }),
  );
  assert.ok(invalidFiles.errors.some((error) => error.includes("files array containing only strings")));
  assert.ok(invalidFiles.errors.some((error) => error.includes("contentPreviews")));

  const unknownField = parseManifestJson(JSON.stringify({ files: ["package.json"], execute: "postinstall" }));
  assert.ok(unknownField.errors.some((error) => error.includes("unsupported fields")));

  const extraCoverageField = parseManifestJson(
    JSON.stringify({
      files: ["package.json"],
      coverage: { paths: "partial", contentPreviews: "none", trusted: true },
    }),
  );
  assert.ok(extraCoverageField.errors.some((error) => error.startsWith("coverage must declare")));

  const orphanedPreview = parseManifestJson(
    JSON.stringify({ files: ["app/page.tsx"], contentPreviews: { "app/admin/page.tsx": "secret" } }),
  );
  assert.ok(orphanedPreview.errors.some((error) => error.includes("not declared in files")));
  assert.equal(orphanedPreview.errors.join(" ").includes("app/admin/page.tsx"), false);
});

test("manifest and tree parsers reject unsafe, colliding, and over-budget paths without echoing them", () => {
  const unsafePaths = [
    "../secret.ts",
    "/absolute.ts",
    "C:\\windows.ts",
    "https://example.test/file.ts",
    "app/%2e%2e/secret.ts",
    "app/CON.txt",
    "app/evil\u202Ets.ts",
  ];
  for (const path of unsafePaths) {
    const result = parseManifestJson(JSON.stringify({ files: [path] }));
    assert.ok(result.errors.length > 0, `Expected rejection for unsafe path class.`);
    assert.equal(result.errors.join(" ").includes(path), false);
  }

  const collision = parseManifestJson(JSON.stringify({ files: ["App/page.tsx", "app/page.tsx"] }));
  assert.ok(collision.errors.some((error) => error.includes("collides")));

  const overBudget = parseManifestJson(
    JSON.stringify({ files: Array.from({ length: 5_001 }, (_, index) => `src/file-${index}.ts`) }),
  );
  assert.ok(overBudget.errors.some((error) => error.includes("5000-entry limit")));

  const tree = parsePastedFileTree("app/\n  ../secret.ts\n  C:\\windows.ts");
  assert.ok(tree.errors.length >= 2);
  assert.equal(tree.errors.join(" ").includes("secret.ts"), false);
});

test("self-declared complete coverage is downgraded to partial", () => {
  const result = parseManifestJson(
    JSON.stringify({
      files: ["package.json"],
      coverage: { paths: "complete", contentPreviews: "complete" },
    }),
  );
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.manifest.coverage, { paths: "partial", contentPreviews: "selected" });
});

test("lockfiles are detected at any depth and Stripe route matching is anchored in both orderings", async () => {
  const manifest = healthyManifest();
  manifest.files = [
    ...manifest.files.filter((path) => !path.includes("stripe/webhooks")),
    "apps/web/package-lock.json",
    "vendor/yarn.lock",
    "app/api/stripe/webhook/route.ts",
    "app/api/webhooks/stripe/route.ts",
    "nested/app/api/stripe/webhook/route.ts",
  ];
  manifest.contentPreviews = {
    "app/api/stripe/webhook/route.ts": "stripe.webhooks.constructEvent(body, sig, secret)",
    "app/api/webhooks/stripe/route.ts": "stripe.webhooks.constructEvent(body, sig, secret)",
  };
  const scan = await scanManifestEvidence(manifest, projectConfig);

  assert.equal(gate(scan, "single-package-manager").status, "fail");
  assert.deepEqual(
    gate(scan, "stripe-webhook-signature").evidence.map((item) => item.path),
    ["app/api/stripe/webhook/route.ts", "app/api/webhooks/stripe/route.ts"],
  );
  assert.equal(gate(scan, "stripe-webhook-signature").status, "unknown");
});

test("signature text, including executable-looking markers, never satisfies the Stripe check", async () => {
  const manifest = healthyManifest();
  manifest.contentPreviews = {
    "app/api/stripe/webhooks/route.ts": "stripe webhook TODO: no signature verification yet",
  };
  const scan = await scanManifestEvidence(manifest, projectConfig);

  assert.equal(gate(scan, "stripe-webhook-signature").status, "unknown");

  manifest.contentPreviews = {
    "app/api/stripe/webhooks/route.ts":
      "// adversarial decoy\nstripe.webhooks.constructEvent(body, signature, secret);\nreturn Response.json({ ok: true });",
  };
  const adversarial = await scanManifestEvidence(manifest, projectConfig);
  assert.equal(gate(adversarial, "stripe-webhook-signature").status, "unknown");
  assert.equal(gate(adversarial, "stripe-webhook-signature").evidence[0]?.observed, true);
});

test("Stripe gate is not applicable when Stripe is not detected", async () => {
  const manifest = healthyManifest();
  const scan = await scanManifestEvidence(
    {
      ...manifest,
      files: manifest.files.filter((path) => !path.includes("stripe")),
      contentPreviews: undefined,
      packageJson: { ...manifest.packageJson, dependencies: { next: "16.2.4" } },
    },
    { ...projectConfig, billingProvider: "none" },
  );

  assert.equal(gate(scan, "stripe-webhook-signature").status, "not_applicable");
  assert.equal(scan.summary.supportedManifestChecksPass, false);
});

test("comparison labels manifest-declared changes without claiming runtime confirmation", async () => {
  const before = await scanManifestEvidence(brokenManifest(), projectConfig);
  const after = await scanManifestEvidence(healthyManifest(), projectConfig);
  const changed = compareEvidenceScans(before, after);

  assert.deepEqual(changed.declaredFixedGateIds, ["production-build-command"]);
  assert.deepEqual(changed.unassessableGateIds, [
    "single-package-manager",
    "single-route-family-ownership",
    "stripe-webhook-signature",
  ]);
  assert.equal(changed.supportedManifestChecksPass, false);

  const incompleteManifest = healthyManifest();
  const incomplete = await scanManifestEvidence(
    {
      ...incompleteManifest,
      contentPreviews: undefined,
      coverage: { paths: "partial", contentPreviews: "none" },
    },
    projectConfig,
  );
  const unassessable = compareEvidenceScans(before, incomplete);
  assert.ok(unassessable.unassessableGateIds.includes("stripe-webhook-signature"));
  assert.ok(unassessable.unassessableGateIds.includes("single-route-family-ownership"));
  assert.equal(unassessable.declaredFixedGateIds.includes("stripe-webhook-signature"), false);

  const regressed = compareEvidenceScans(after, before);
  assert.deepEqual(regressed.declaredRegressionGateIds, [
    "production-build-command",
    "single-package-manager",
    "single-route-family-ownership",
  ]);
  assert.equal(regressed.supportedManifestChecksPass, false);
});

test("comparison rejects scans from different projects", async () => {
  const before = await scanManifestEvidence(healthyManifest(), projectConfig);
  const after = await scanManifestEvidence(healthyManifest(), {
    ...projectConfig,
    projectId: "different-project",
  });

  assert.throws(() => compareEvidenceScans(before, after), /same project/);
});

test("comparison rejects incompatible rule and gate versions", async () => {
  const before = await scanManifestEvidence(healthyManifest(), projectConfig);
  const incompatibleRuleSet = {
    ...before,
    ruleSetVersion: "manifest-gates/999",
  } as unknown as typeof before;
  assert.throws(() => compareEvidenceScans(before, incompatibleRuleSet), /incompatible contract, engine, or rule-set/);

  const incompatibleGates = { ...before, gates: before.gates.slice(1) };
  assert.throws(() => compareEvidenceScans(before, incompatibleGates), /incompatible gate sets/);
});

test("fingerprint is canonical across object and file ordering", async () => {
  const first = healthyManifest();
  const second: FileManifest = {
    coverage: { contentPreviews: "selected", paths: "partial" },
    packageJson: {
      dependencies: { stripe: "latest", next: "16.2.4" },
      scripts: { lint: "eslint", build: "next build" },
    },
    contentPreviews: {
      "app/api/stripe/webhooks/route.ts":
        "const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);",
    },
    files: [...first.files].reverse(),
  };

  assert.equal(await fingerprintManifest(first), await fingerprintManifest(second));
  const changed = healthyManifest();
  changed.files = [...changed.files, "app/settings/page.tsx"];
  assert.notEqual(await fingerprintManifest(first), await fingerprintManifest(changed));

  const stripeFingerprint = await fingerprintManifest(first, projectConfig);
  const nonStripeFingerprint = await fingerprintManifest(first, { ...projectConfig, billingProvider: "none" });
  assert.notEqual(stripeFingerprint, nonStripeFingerprint);
  const stripeScan = await scanManifestEvidence(first, projectConfig);
  const nonStripeScan = await scanManifestEvidence(first, { ...projectConfig, billingProvider: "none" });
  assert.notEqual(stripeScan.scanId, nonStripeScan.scanId);
});

test("evidence receipts never serialize supplied secret content", async () => {
  const canary = "sk_live_NEVER_INCLUDE_THIS_CANARY";
  const manifest = healthyManifest();
  manifest.contentPreviews = {
    ...manifest.contentPreviews,
    "app/page.tsx": `const leaked = '${canary}';`,
  };
  const scan = await scanManifestEvidence(manifest, projectConfig);

  assert.equal(JSON.stringify(scan).includes(canary), false);
});

test("manifest scan attaches the evidence receipt and content-addressed scan id", async () => {
  const result = await scanFileManifest(healthyManifest(), projectConfig, {
    observedAt: "2026-09-27T00:00:00.000Z",
  });

  assert.ok(result.evidence);
  assert.equal(result.scanId, result.evidence.scanId);
  assert.equal(result.createdAt, "2026-09-27T00:00:00.000Z");
  assert.equal(result.evidence.summary.supportedManifestChecksPass, false);
});

test("launch plan records failed or unknown manifest checks without overclaiming", async () => {
  const manifest = healthyManifest();
  const result = await scanFileManifest(
    {
      ...manifest,
      contentPreviews: undefined,
      coverage: { paths: "partial", contentPreviews: "none" },
    },
    projectConfig,
  );
  const plan = generateLaunchPlanFromScanResult("Evidence Demo", result);

  assert.ok(plan.consistencyNotes.some((note) => note.includes("manifest check receipt")));
  assert.notEqual(plan.launchStatus, "Launch Ready");
});
