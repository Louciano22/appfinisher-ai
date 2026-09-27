export const MANIFEST_BUDGET = {
  maxInputBytes: 2_000_000,
  maxFiles: 5_000,
  maxRoutes: 1_000,
  maxPreviews: 500,
  maxPathBytes: 512,
  maxTotalPathBytes: 1_000_000,
  maxPreviewBytes: 32_000,
  maxTotalPreviewBytes: 2_000_000,
} as const;

const controlOrBidiPattern = /[\u0000-\u001f\u007f-\u009f\u061c\u200e\u200f\u202a-\u202e\u2066-\u2069]/u;
const windowsDrivePattern = /^[a-z]:/i;
const urlSchemePattern = /^[a-z][a-z0-9+.-]*:/i;
const encodedPathSyntaxPattern = /%(?:2e|2f|5c)/i;
const windowsDevicePattern = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i;

function utf8Length(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

export function relativePosixPathError(path: string): string | null {
  if (!path) return "path is empty";
  if (path !== path.trim()) return "leading or trailing whitespace is not allowed";
  if (utf8Length(path) > MANIFEST_BUDGET.maxPathBytes) return "path exceeds the 512-byte limit";
  if (controlOrBidiPattern.test(path)) return "control and bidirectional formatting characters are not allowed";
  if (path.startsWith("/") || windowsDrivePattern.test(path)) return "path must be relative";
  if (urlSchemePattern.test(path)) return "URL-like schemes are not allowed";
  if (encodedPathSyntaxPattern.test(path)) return "encoded traversal or separator syntax is not allowed";
  if (path.includes("\\")) return "backslashes are not allowed; use POSIX separators";
  if (path.includes("//")) return "empty path segments are not allowed";
  if (path.endsWith("/")) return "trailing separators are not allowed";
  if (path !== path.normalize("NFC")) return "path must use NFC Unicode normalization";
  const segments = path.split("/");
  if (segments.some((segment) => segment === "." || segment === ".." || segment.length === 0)) {
    return '"." and ".." path segments are not allowed';
  }
  if (segments.some((segment) => windowsDevicePattern.test(segment))) {
    return "Windows reserved device names are not allowed";
  }
  return null;
}

function collisionKey(path: string): string {
  return path.normalize("NFC").toLocaleLowerCase("en-US");
}

export function validatePathCollection(paths: string[], label: string, maximum: number): string[] {
  const errors: string[] = [];
  if (paths.length > maximum) errors.push(`${label} exceeds the ${maximum}-entry limit.`);
  let totalBytes = 0;
  const seen = new Map<string, string>();

  for (const [index, path] of paths.slice(0, maximum + 1).entries()) {
    totalBytes += utf8Length(path);
    const pathError = relativePosixPathError(path);
    if (pathError) errors.push(`${label}[${index}] is invalid: ${pathError}.`);
    const key = collisionKey(path);
    const prior = seen.get(key);
    if (prior !== undefined) {
      errors.push(`${label}[${index}] collides with an earlier path entry.`);
    } else {
      seen.set(key, path);
    }
  }

  if (totalBytes > MANIFEST_BUDGET.maxTotalPathBytes) {
    errors.push(`${label} exceeds the ${MANIFEST_BUDGET.maxTotalPathBytes}-byte path budget.`);
  }
  return errors;
}

export function validatePreviewBudget(previews: Record<string, string>): string[] {
  const entries = Object.entries(previews);
  const errors = validatePathCollection(entries.map(([path]) => path), "contentPreviews", MANIFEST_BUDGET.maxPreviews);
  let totalBytes = 0;
  for (const [index, [, content]] of entries.slice(0, MANIFEST_BUDGET.maxPreviews + 1).entries()) {
    const bytes = utf8Length(content);
    totalBytes += bytes;
    if (bytes > MANIFEST_BUDGET.maxPreviewBytes) {
      errors.push(`contentPreviews value at index ${index} exceeds the ${MANIFEST_BUDGET.maxPreviewBytes}-byte limit.`);
    }
  }
  if (totalBytes > MANIFEST_BUDGET.maxTotalPreviewBytes) {
    errors.push(`contentPreviews exceeds the ${MANIFEST_BUDGET.maxTotalPreviewBytes}-byte content budget.`);
  }
  return errors;
}
