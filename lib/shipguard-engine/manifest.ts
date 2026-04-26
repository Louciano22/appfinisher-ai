import type {
  DetectedStack,
  FileManifest,
  FileTree,
  FileTreeParseResult,
  ProjectConfig,
  ScanResult,
} from "@/lib/shipguard-engine/types";
import { scanProject } from "@/lib/shipguard-engine/scanner";

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

    if (!segment || segment.includes("..")) {
      errors.push(`Line ${index + 1}: invalid path segment "${cleaned}".`);
      return;
    }

    while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    const parent = stack[stack.length - 1]?.path;
    const path = normalizePath(parent ? `${parent}/${segment}` : segment);

    if (isDirectory) {
      stack.push({ indent, path });
      return;
    }

    files.push(path);
  });

  return {
    manifest: { files: Array.from(new Set(files)) },
    errors,
  };
}

export function parseManifestJson(input: string): FileTreeParseResult {
  try {
    const parsed = JSON.parse(input) as Partial<FileManifest>;

    if (!Array.isArray(parsed.files)) {
      return {
        manifest: { files: [] },
        errors: ["Manifest JSON must include a files array."],
      };
    }

    return {
      manifest: {
        files: parsed.files.map(normalizePath).filter(Boolean),
        contentPreviews: parsed.contentPreviews,
        packageJson: parsed.packageJson,
        envExample: parsed.envExample,
        frameworkHints: parsed.frameworkHints,
        routeList: parsed.routeList,
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

export function scanFileManifest(
  manifest: FileManifest,
  projectConfig: ProjectConfig,
): ScanResult {
  const detected = detectStackFromManifest(manifest);

  return scanProject(manifestToFileTree(manifest), {
    ...projectConfig,
    framework: projectConfig.framework ?? detected.framework,
    database: projectConfig.database ?? detected.database,
    billingProvider: projectConfig.billingProvider ?? detected.billingProvider,
    deploymentProvider: projectConfig.deploymentProvider ?? detected.deploymentProvider,
    aiProvider: projectConfig.aiProvider ?? detected.aiProvider,
  });
}
