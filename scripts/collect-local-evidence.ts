import { collectLocalEvidence } from "../lib/shipguard-engine/local-evidence";
import type { ProjectConfig } from "../lib/shipguard-engine/types";

function argumentsFrom(commandLine: string[]): { root: string; config: ProjectConfig } {
  const values = new Map<string, string>();
  for (let index = 0; index < commandLine.length; index += 2) {
    const flag = commandLine[index];
    const value = commandLine[index + 1];
    if (!flag || !value || !["--root", "--project-id", "--billing-provider"].includes(flag) || values.has(flag)) {
      throw new Error("Usage: npm run evidence:local -- --root /absolute/authorized/repo --project-id ID [--billing-provider stripe|paddle|none|unknown]");
    }
    values.set(flag, value);
  }
  const root = values.get("--root");
  const projectId = values.get("--project-id");
  const billingProvider = values.get("--billing-provider") ?? "unknown";
  if (!root || !projectId || !["stripe", "paddle", "none", "unknown"].includes(billingProvider)) {
    throw new Error("An absolute root and project ID are required; billing provider must be stripe, paddle, none, or unknown.");
  }
  return {
    root,
    config: { projectId, name: projectId, billingProvider: billingProvider as ProjectConfig["billingProvider"] },
  };
}

async function main() {
  try {
    const { root, config } = argumentsFrom(process.argv.slice(2));
    const receipt = await collectLocalEvidence(root, config);
    process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`);
  } catch {
    // Native filesystem errors contain absolute paths; never echo them or input contents.
    process.stderr.write("Local collection failed. Check the authorized root, permissions, symlinks, and input budgets.\n");
    process.exitCode = 1;
  }
}

void main();
