/** Local-only, read-only observation. This module must never be imported into browser code. */
import { constants } from "node:fs";
import { lstat, open, opendir, realpath } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { scanManifestEvidence } from "./evidence";
import type { EvidenceGateResult } from "./evidence-types";
import { MANIFEST_BUDGET, relativePosixPathError, validatePathCollection } from "./path-safety";
import type { FileManifest, ProjectConfig } from "./types";

const EXCLUDED_DIRECTORIES = new Set([
  ".git", ".next", ".vercel", ".turbo", ".cache", "node_modules", "coverage", "dist", "build", "out",
  ".ssh", ".aws", ".npm",
]);
const MAX_VISITED_ENTRIES = 10_000;
const MAX_DEPTH = 24;
const MAX_PACKAGE_BYTES = 256_000;

export type LocalEvidenceReceipt = {
  contract: "sandpaper.local-collection/v1";
  source: "authorized_local_folder";
  rootFingerprint: string;
  projectId: string;
  observedAt: string;
  coverage: { paths: "partial"; content: "package_metadata_only" | "none" };
  runtimeVerification: "not_performed";
  collection: {
    listedFiles: number;
    skippedEntries: number;
    skippedSensitiveFiles: number;
    packageMetadata: "parsed" | "absent";
    packageSha256?: string;
  };
  manifestFingerprint: string;
  gates: EvidenceGateResult[];
  summary: { passed: number; failed: number; unknown: number; notApplicable: number };
};

function digest(value: string | Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

function contained(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate);
  return relative === "" || (relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
}

function excludedEntry(name: string): boolean {
  return EXCLUDED_DIRECTORIES.has(name) || (name.startsWith(".") && name !== ".github");
}

function sensitiveFile(name: string): boolean {
  return /^\.env(?:\.|$)/i.test(name) || /(?:^|[._-])(?:secret|credential|private-key)(?:[._-]|$)/i.test(name) ||
    /\.(?:pem|key|p12|pfx|jks|keystore)$/i.test(name) ||
    /^(?:id_rsa|id_ed25519|\.npmrc|\.pypirc|\.netrc)$/i.test(name);
}

async function checkedRoot(input: string): Promise<string> {
  if (!path.isAbsolute(input)) throw new Error("Local collection requires an absolute authorized root.");
  const resolved = path.resolve(input);
  // Refuse symlinked ancestors as well as a symlinked root.
  let current = path.parse(resolved).root;
  for (const segment of resolved.slice(current.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    const stat = await lstat(current);
    if (stat.isSymbolicLink()) throw new Error("Authorized root contains a symbolic link.");
  }
  if (!(await lstat(resolved)).isDirectory()) throw new Error("Authorized root must be a directory.");
  const canonical = await realpath(resolved);
  if (canonical !== resolved) throw new Error("Authorized root changed during validation.");
  return canonical;
}

async function readPackageMetadata(root: string): Promise<{ metadata: FileManifest["packageJson"]; sha256: string }> {
  const candidate = path.join(root, "package.json");
  const before = await lstat(candidate);
  if (!before.isFile() || before.isSymbolicLink() || before.size > MAX_PACKAGE_BYTES) {
    throw new Error("Package metadata is not a bounded regular file.");
  }
  if (!contained(root, await realpath(candidate))) throw new Error("Package metadata escaped the authorized root.");
  const handle = await open(candidate, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const stat = await handle.stat();
    if (!stat.isFile() || stat.dev !== before.dev || stat.ino !== before.ino || stat.size > MAX_PACKAGE_BYTES) {
      throw new Error("Package metadata changed or exceeded its budget.");
    }
    // A file can grow after fstat. Read at most budget + 1 byte from its pinned descriptor.
    const buffer = Buffer.alloc(MAX_PACKAGE_BYTES + 1);
    let length = 0;
    while (length < buffer.length) {
      const { bytesRead } = await handle.read(buffer, length, buffer.length - length, length);
      if (bytesRead === 0) break;
      length += bytesRead;
    }
    if (length > MAX_PACKAGE_BYTES || length !== stat.size) {
      throw new Error("Package metadata changed or exceeded its byte budget.");
    }
    const bytes = buffer.subarray(0, length);
    let parsed: unknown;
    try { parsed = JSON.parse(bytes.toString("utf8")); } catch { throw new Error("Package metadata is not valid JSON."); }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Package metadata must be an object.");
    }
    const record = parsed as Record<string, unknown>;
    const metadata: NonNullable<FileManifest["packageJson"]> = {};
    for (const field of ["scripts", "dependencies", "devDependencies"] as const) {
      const value = record[field];
      if (value === undefined) continue;
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new Error("Package metadata has an invalid field.");
      }
      const entries = Object.entries(value);
      if (entries.length > 500 || entries.some(([key, item]) => key.length > 256 || typeof item !== "string" || item.length > 10_000)) {
        throw new Error("Package metadata exceeds its field budget.");
      }
      metadata[field] = Object.fromEntries(entries) as Record<string, string>;
    }
    return { metadata, sha256: digest(bytes) };
  } finally {
    await handle.close();
  }
}

export async function collectLocalEvidence(rootInput: string, projectConfig: ProjectConfig): Promise<LocalEvidenceReceipt> {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(projectConfig.projectId)) {
    throw new Error("Project ID must be a short alphanumeric identifier.");
  }
  const root = await checkedRoot(rootInput);
  const files: string[] = [];
  let visited = 0;
  let skippedEntries = 0;
  let skippedSensitiveFiles = 0;
  const pending = [{ directory: root, depth: 0 }];

  while (pending.length > 0) {
    const { directory, depth } = pending.pop()!;
    if (depth > MAX_DEPTH) throw new Error("Local collection exceeded its depth budget.");
    // opendir streams entries instead of materializing an unbounded directory.
    for await (const entry of await opendir(directory)) {
      const name = entry.name;
      if (++visited > MAX_VISITED_ENTRIES) throw new Error("Local collection exceeded its traversal budget.");
      const candidate = path.join(directory, name);
      const relative = path.relative(root, candidate).split(path.sep).join("/");
      if (!contained(root, candidate) || relativePosixPathError(relative)) {
        throw new Error("Local collection encountered an unsafe relative path.");
      }
      const stat = await lstat(candidate);
      if (stat.isSymbolicLink() || (!stat.isDirectory() && !stat.isFile())) {
        throw new Error("Local collection encountered a link or nonregular entry.");
      }
      if (sensitiveFile(name)) { skippedSensitiveFiles++; continue; }
      if (excludedEntry(name)) { skippedEntries++; continue; }
      if (!contained(root, await realpath(candidate))) {
        throw new Error("Local collection encountered an entry outside the authorized root.");
      }
      if (stat.isDirectory()) {
        if (depth === MAX_DEPTH) throw new Error("Local collection exceeded its depth budget.");
        pending.push({ directory: candidate, depth: depth + 1 });
      } else {
        files.push(relative);
        if (files.length > MANIFEST_BUDGET.maxFiles) throw new Error("Local collection exceeded its file budget.");
      }
    }
  }

  const pathErrors = validatePathCollection(files, "files", MANIFEST_BUDGET.maxFiles);
  if (pathErrors.length > 0) throw new Error(`Local collection paths failed validation: ${pathErrors.join(" ")}`);
  files.sort();
  let packageSha256: string | undefined;
  let packageJson: FileManifest["packageJson"];
  if (files.includes("package.json")) {
    const read = await readPackageMetadata(root);
    packageJson = read.metadata;
    packageSha256 = read.sha256;
  }
  const scan = await scanManifestEvidence({ files, packageJson }, projectConfig);
  return {
    contract: "sandpaper.local-collection/v1",
    source: "authorized_local_folder",
    rootFingerprint: digest(root),
    projectId: projectConfig.projectId,
    observedAt: scan.observedAt,
    coverage: { paths: "partial", content: packageJson ? "package_metadata_only" : "none" },
    runtimeVerification: "not_performed",
    collection: {
      listedFiles: files.length,
      skippedEntries,
      skippedSensitiveFiles,
      packageMetadata: packageJson ? "parsed" : "absent",
      ...(packageSha256 ? { packageSha256 } : {}),
    },
    manifestFingerprint: scan.inputFingerprint,
    gates: scan.gates,
    summary: {
      passed: scan.summary.passed,
      failed: scan.summary.failed,
      unknown: scan.summary.unknown,
      notApplicable: scan.summary.notApplicable,
    },
  };
}
