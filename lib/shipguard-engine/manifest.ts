import type {
  DetectedStack,
  FileManifest,
  FileTree,
  FileTreeParseResult,
  ProjectConfig,
  ScanResult,
} from "@/lib/shipguard-engine/types";
import { scanProject } from "@/lib/shipguard-engine/scanner";
import { scanManifestEvidence } from "@/lib/shipguard-engine/evidence";
import type { EvidenceScanOptions, ManifestCoverage } from "@/lib/shipguard-engine/evidence-types";
import {
  MANIFEST_BUDGET,
  relativePosixPathError,
  validatePathCollection,
  validatePreviewBudget,
} from "@/lib/shipguard-engine/path-safety";

function normalizePath(path: string) {
  return path
    .replace(/\\/g, "/")
    .replace(/^\.?\//, "")
    .replace(/\/+/g, "/")
    .replace(/\/$/, "")
    .trim();
}

function cleanTreeLine(line: string) {
  return line
    .trim()
    .replace(/^[├└│─\-\s]+/, "")
    .trim();
}

export function parsePastedFileTree(input: string): FileTreeParseResult {
  const errors: string[] = [];
  const files: string[] = [];
  const stack: { indent: number; path: string }[] = [];
  const lines = input.split(/\r?\n/);

  if (new TextEncoder().encode(input).byteLength > MANIFEST_BUDGET.maxInputBytes) {
    return {
      manifest: { files: [], coverage: { paths: "partial", contentPreviews: "none" } },
      errors: [`Pasted file tree exceeds the ${MANIFEST_BUDGET.maxInputBytes}-byte input limit.`],
    };
  }

  lines.forEach((line, index) => {
    if (!line.trim()) return;

    const indent = line.match(/^\s*/)?.[0].length ?? 0;
    const cleaned = cleanTreeLine(line);

    if (!cleaned || cleaned === "." || cleaned === "/") return;
    if (cleaned.includes("{") || cleaned.includes("}")) {
      errors.push(`Line ${index + 1}: this looks like JSON, not an indented file tree.`);
      return;
    }

    const isDirectory = cleaned.endsWith("/");
    const segment = cleaned.replace(/\/$/, "");

    if (!segment) {
      errors.push(`Line ${index + 1}: path segment is empty.`);
      return;
    }

    while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    const parent = stack[stack.length - 1]?.path;
    const path = parent ? `${parent}/${segment}` : segment;
    const pathError = relativePosixPathError(path);
    if (pathError) {
      errors.push(`Line ${index + 1}: invalid relative POSIX path (${pathError}).`);
      return;
    }

    if (isDirectory) {
      stack.push({ indent, path });
      return;
    }

    files.push(path);
  });

  errors.push(...validatePathCollection(files, "files", MANIFEST_BUDGET.maxFiles));

  return {
    manifest: {
      files: Array.from(new Set(files)),
      coverage: { paths: "partial", contentPreviews: "none" },
    },
    errors,
  };
}

function parseCoverage(value: unknown): ManifestCoverage | undefined {
  if (!isRecord(value)) return undefined;
  if (Object.keys(value).some((field) => field !== "paths" && field !== "contentPreviews")) return undefined;
  const coverage = value as Partial<ManifestCoverage>;
  if (!(["complete", "partial"] as const).includes(coverage.paths as "complete" | "partial")) return undefined;
  if (!(["complete", "selected", "none"] as const).includes(coverage.contentPreviews as "complete" | "selected" | "none")) {
    return undefined;
  }
  return {
    paths: "partial",
    contentPreviews: coverage.contentPreviews === "none" ? "none" : "selected",
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return isRecord(value) && Object.values(value).every((item) => typeof item === "string");
}

function manifestShapeErrors(value: unknown): string[] {
  if (!isRecord(value)) return ["Manifest JSON must be an object."];
  const errors: string[] = [];
  const allowedFields = new Set([
    "files",
    "contentPreviews",
    "packageJson",
    "envExample",
    "frameworkHints",
    "routeList",
    "coverage",
  ]);
  const unknownFields = Object.keys(value).filter((field) => !allowedFields.has(field));
  if (unknownFields.length > 0) errors.push(`Manifest JSON contains unsupported fields: ${unknownFields.join(", ")}.`);
  if (!Array.isArray(value.files) || !value.files.every((item) => typeof item === "string")) {
    errors.push("Manifest JSON must include a files array containing only strings.");
  } else {
    errors.push(...validatePathCollection(value.files, "files", MANIFEST_BUDGET.maxFiles));
  }
  if (value.contentPreviews !== undefined && !isStringRecord(value.contentPreviews)) {
    errors.push("contentPreviews must be an object whose values are strings.");
  } else if (value.contentPreviews !== undefined) {
    errors.push(...validatePreviewBudget(value.contentPreviews));
    if (Array.isArray(value.files) && value.files.every((item) => typeof item === "string")) {
      const declaredFiles = new Set(value.files.map((path) => path.toLocaleLowerCase("en-US")));
      const orphanedPreviewCount = Object.keys(value.contentPreviews).filter(
        (path) => !declaredFiles.has(path.toLocaleLowerCase("en-US")),
      ).length;
      if (orphanedPreviewCount > 0) {
        errors.push(`contentPreviews contains ${orphanedPreviewCount} key(s) that are not declared in files.`);
      }
    }
  }
  if (value.packageJson !== undefined) {
    if (!isRecord(value.packageJson)) {
      errors.push("packageJson must be an object.");
    } else {
      const packageFields = new Set(["scripts", "dependencies", "devDependencies"]);
      const unknownPackageFields = Object.keys(value.packageJson).filter((field) => !packageFields.has(field));
      if (unknownPackageFields.length > 0) errors.push("packageJson contains unsupported fields.");
      for (const field of ["scripts", "dependencies", "devDependencies"] as const) {
        if (value.packageJson[field] !== undefined && !isStringRecord(value.packageJson[field])) {
          errors.push(`packageJson.${field} must be an object whose values are strings.`);
        } else if (isStringRecord(value.packageJson[field])) {
          const entries = Object.entries(value.packageJson[field]);
          if (entries.length > 500 || entries.some(([key, item]) => key.length > 256 || item.length > 10_000)) {
            errors.push(`packageJson.${field} exceeds its entry or string budget.`);
          }
        }
      }
    }
  }
  if (value.envExample !== undefined && typeof value.envExample !== "string") {
    errors.push("envExample must be a string.");
  } else if (typeof value.envExample === "string" && value.envExample.length > 100_000) {
    errors.push("envExample exceeds the 100000-character limit.");
  }
  for (const field of ["frameworkHints", "routeList"] as const) {
    if (value[field] !== undefined && (!Array.isArray(value[field]) || !value[field].every((item) => typeof item === "string"))) {
      errors.push(`${field} must be an array containing only strings.`);
    } else if (field === "routeList" && Array.isArray(value[field])) {
      errors.push(...validatePathCollection(value[field], "routeList", MANIFEST_BUDGET.maxRoutes));
    } else if (field === "frameworkHints" && Array.isArray(value[field])) {
      if (value[field].length > 100 || value[field].some((item) => item.length > 500)) {
        errors.push("frameworkHints exceeds its entry or string budget.");
      }
    }
  }
  if (value.coverage !== undefined && !parseCoverage(value.coverage)) {
    errors.push('coverage must declare paths as "complete" or "partial" and contentPreviews as "complete", "selected", or "none".');
  }
  return errors;
}

export function parseManifestJson(input: string): FileTreeParseResult {
  if (new TextEncoder().encode(input).byteLength > MANIFEST_BUDGET.maxInputBytes) {
    return {
      manifest: { files: [] },
      errors: [`Manifest JSON exceeds the ${MANIFEST_BUDGET.maxInputBytes}-byte input limit.`],
    };
  }
  try {
    const raw = JSON.parse(input) as unknown;
    const errors = manifestShapeErrors(raw);
    if (errors.length > 0) {
      return {
        manifest: { files: [] },
        errors,
      };
    }
    const parsed = raw as FileManifest;

    return {
      manifest: {
        files: parsed.files.map(normalizePath).filter(Boolean),
        contentPreviews: parsed.contentPreviews
          ? Object.fromEntries(
              Object.entries(parsed.contentPreviews).map(([path, content]) => [normalizePath(path), content]),
            )
          : undefined,
        packageJson: parsed.packageJson,
        envExample: parsed.envExample,
        frameworkHints: parsed.frameworkHints,
        routeList: parsed.routeList?.map(normalizePath).filter(Boolean),
        coverage: parseCoverage(parsed.coverage),
      },
      errors: [],
    };
  } catch {
    return {
      manifest: { files: [] },
      errors: ["Manifest JSON could not be parsed. Check for trailing commas or invalid quotes."],
    };
  }
}

export function manifestToFileTree(manifest: FileManifest): FileTree {
  const children: FileTree[] = manifest.files.map((file) => ({
    path: normalizePath(file),
    type: "file",
    contentPreview: manifest.contentPreviews?.[file],
  }));

  if (manifest.packageJson) {
    children.push({
      path: "package.json",
      type: "file",
      contentPreview: JSON.stringify(manifest.packageJson),
    });
  }

  if (manifest.envExample) {
    children.push({
      path: ".env.example",
      type: "file",
      contentPreview: manifest.envExample,
    });
  }

  for (const route of manifest.routeList ?? []) {
    children.push({
      path: normalizePath(route),
      type: "file",
      contentPreview: "route from manifest",
    });
  }

  return {
    path: ".",
    type: "directory",
    children,
  };
}

export function detectStackFromManifest(manifest: FileManifest): DetectedStack {
  const files = manifest.files.map(normalizePath);
  const allText = [
    ...files,
    manifest.envExample ?? "",
    JSON.stringify(manifest.packageJson ?? {}),
    ...(manifest.frameworkHints ?? []),
    ...(manifest.routeList ?? []),
    ...Object.values(manifest.contentPreviews ?? {}),
  ]
    .join("\n")
    .toLowerCase();

  const confidenceNotes: string[] = [];
  const detected: DetectedStack = { confidenceNotes };

  if (files.some((file) => file === "next.config.ts" || file === "next.config.js" || file.startsWith("app/"))) {
    detected.framework = "Next.js App Router";
    detected.deploymentProvider = "vercel";
    confidenceNotes.push("Detected Next.js from next.config or app/ routes.");
    confidenceNotes.push("Assuming Vercel-ready deployment because this is a Next.js app.");
  }

  if (files.some((file) => file.startsWith("supabase/") || /supabase(client)?\.ts$/.test(file)) || allText.includes("supabase")) {
    detected.database = "Supabase Postgres";
    confidenceNotes.push("Detected Supabase from folder, client file, env, or content preview.");
  }

  if (allText.includes("stripe") || allText.includes("stripe_")) {
    detected.billingProvider = "stripe";
    confidenceNotes.push("Detected Stripe from paths, env references, or package metadata.");
  }

  if (allText.includes("anthropic")) {
    detected.aiProvider = "claude_code";
    confidenceNotes.push("Detected Anthropic/Claude references.");
  } else if (allText.includes("openai")) {
    detected.aiProvider = "generic";
    confidenceNotes.push("Detected OpenAI references.");
  } else if (allText.includes("gemini")) {
    detected.aiProvider = "generic";
    confidenceNotes.push("Detected Gemini references.");
  }

  if (!detected.framework) confidenceNotes.push("Framework could not be confidently detected.");
  if (!detected.database) confidenceNotes.push("Database provider could not be confidently detected.");
  if (!detected.billingProvider) confidenceNotes.push("Billing provider not detected from current input.");
  if (!detected.aiProvider) confidenceNotes.push("AI provider not detected from current input.");

  return detected;
}

export async function scanFileManifest(
  manifest: FileManifest,
  projectConfig: ProjectConfig,
  options: EvidenceScanOptions = {},
): Promise<ScanResult> {
  const detected = detectStackFromManifest(manifest);
  const resolvedConfig = {
    ...projectConfig,
    framework: projectConfig.framework ?? detected.framework,
    database: projectConfig.database ?? detected.database,
    billingProvider: projectConfig.billingProvider ?? detected.billingProvider,
    deploymentProvider: projectConfig.deploymentProvider ?? detected.deploymentProvider,
    aiProvider: projectConfig.aiProvider ?? detected.aiProvider,
  };
  const evidence = await scanManifestEvidence(manifest, resolvedConfig, options);
  const result = scanProject(manifestToFileTree(manifest), resolvedConfig);

  return {
    ...result,
    scanId: evidence.scanId,
    createdAt: evidence.observedAt,
    evidence,
  };
}
