import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { collectLocalEvidence } from "../lib/shipguard-engine/local-evidence";

async function fixture(run: (root: string) => Promise<void>) {
  const root = await mkdtemp(path.join(tmpdir(), "sandpaper-local-"));
  try { await run(root); } finally { await rm(root, { recursive: true, force: true }); }
}

const config = { projectId: "local-test", name: "Local Test", billingProvider: "stripe" as const };

test("local receipt records bounded static observations without exposing source, env, or claiming runtime verification", async () => {
  await fixture(async (root) => {
    await mkdir(path.join(root, "app", "api", "stripe", "webhooks"), { recursive: true });
    await mkdir(path.join(root, "node_modules"));
    const secret = "SUPER_SECRET_DO_NOT_PRINT_123";
    await writeFile(path.join(root, ".env.local"), `TOKEN=${secret}`);
    await writeFile(path.join(root, "app", "api", "stripe", "webhooks", "route.ts"), `// ${secret}\n`);
    await writeFile(path.join(root, "package.json"), JSON.stringify({
      scripts: { build: "next build" }, dependencies: { stripe: "latest" },
      description: secret,
    }));
    const receipt = await collectLocalEvidence(root, config);
    assert.equal(receipt.contract, "sandpaper.local-collection/v1");
    assert.equal(receipt.source, "authorized_local_folder");
    assert.equal(receipt.runtimeVerification, "not_performed");
    assert.deepEqual(receipt.coverage, { paths: "partial", content: "package_metadata_only" });
    assert.equal(receipt.collection.listedFiles, 2);
    assert.equal(receipt.collection.skippedSensitiveFiles, 1);
    assert.equal(receipt.gates.find((gate) => gate.gateId === "production-build-command")?.status, "pass");
    assert.equal(receipt.gates.find((gate) => gate.gateId === "stripe-webhook-signature")?.status, "unknown");
    assert.equal(receipt.gates.find((gate) => gate.gateId === "single-package-manager")?.status, "unknown");
    assert.equal(JSON.stringify(receipt).includes(secret), false);
    assert.equal(JSON.stringify(receipt).includes(root), false);
    assert.equal(JSON.stringify(receipt).includes("route.ts"), true);
  });
});

test("package hash tracks bytes actually parsed and changes with metadata", async () => {
  await fixture(async (root) => {
    await writeFile(path.join(root, "package.json"), '{"scripts":{"build":"next build"}}');
    const first = await collectLocalEvidence(root, config);
    await writeFile(path.join(root, "package.json"), '{"scripts":{"build":""}}');
    const second = await collectLocalEvidence(root, config);
    assert.notEqual(first.collection.packageSha256, second.collection.packageSha256);
    assert.notEqual(first.manifestFingerprint, second.manifestFingerprint);
    assert.equal(second.gates.find((gate) => gate.gateId === "production-build-command")?.status, "fail");
    assert.equal(first.rootFingerprint, second.rootFingerprint);
  });
});

test("symlinked files, directories, and roots are rejected without reading targets", async () => {
  await fixture(async (root) => {
    await symlink(path.join(root, "missing"), path.join(root, "linked.ts"));
    await assert.rejects(collectLocalEvidence(root, config), /link or nonregular entry/);
    await rm(path.join(root, "linked.ts"));
    await symlink(tmpdir(), path.join(root, "linked-directory"));
    await assert.rejects(collectLocalEvidence(root, config), /link or nonregular entry/);
    await rm(path.join(root, "linked-directory"));
    await symlink(path.join(root, "missing"), path.join(root, ".env.local"));
    await assert.rejects(collectLocalEvidence(root, config), /link or nonregular entry/);
    await rm(path.join(root, ".env.local"));
    const linkedRoot = `${root}-link`;
    await symlink(root, linkedRoot);
    try { await assert.rejects(collectLocalEvidence(linkedRoot, config), /symbolic link/); }
    finally { await rm(linkedRoot); }
  });
});

test("CLI failures do not print the authorized root or native filesystem paths", () => {
  const missingRoot = path.join(tmpdir(), "sandpaper-nonexistent-private-path");
  const result = spawnSync(process.execPath, [
    "--import", "tsx", "scripts/collect-local-evidence.ts", "--root", missingRoot, "--project-id", "local-test",
  ], { encoding: "utf8", cwd: process.cwd() });
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.equal(result.stderr.includes(missingRoot), false);
});

test("invalid package data and nonregular entries fail closed", async () => {
  await fixture(async (root) => {
    await writeFile(path.join(root, "package.json"), "not-json");
    await assert.rejects(collectLocalEvidence(root, config), /not valid JSON/);
    await writeFile(path.join(root, "package.json"), "x".repeat(256_001));
    await assert.rejects(collectLocalEvidence(root, config), /bounded regular file/);
  });
});

test("paths, depth, and project identifiers are bounded", async () => {
  await fixture(async (root) => {
    await assert.rejects(collectLocalEvidence("relative/path", config), /absolute authorized root/);
    await assert.rejects(collectLocalEvidence(root, { ...config, projectId: "../../bad" }), /Project ID/);
    let directory = root;
    for (let index = 0; index < 25; index++) {
      directory = path.join(directory, `level${index}`);
      await mkdir(directory);
    }
    await assert.rejects(collectLocalEvidence(root, config), /depth budget/);
  });
});
