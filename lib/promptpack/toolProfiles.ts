import type { BuilderTarget } from "@/lib/types";
import type { ToolProfile } from "@/lib/promptpack/types";

export const toolProfiles: Record<BuilderTarget, ToolProfile> = {
  cursor: {
    id: "cursor",
    name: "Cursor",
    behaviorRules: [
      "Be file-specific and codebase-aware.",
      "Inspect before editing.",
      "Run build/typecheck when available.",
      "Avoid unrelated refactors.",
      "Stop when success criteria are met.",
    ],
    stopCondition: "Stop after the scoped fix is verified and the success criteria are met.",
  },
  lovable: {
    id: "lovable",
    name: "Lovable",
    behaviorRules: [
      "Focus on clear UI and product changes.",
      "Preserve the existing visual style.",
      "Do not break navigation.",
      "Avoid backend expansion unless required for the requested fix.",
    ],
    stopCondition: "Stop after the page/component behavior matches the requested product outcome.",
  },
  claude_code: {
    id: "claude_code",
    name: "Claude Code",
    behaviorRules: [
      "Inspect the repo first.",
      "Make staged, reviewable changes.",
      "Run tests/build when available.",
      "Summarize changed files after verification.",
    ],
    stopCondition: "Stop after verification and a concise changed-file summary.",
  },
  replit: {
    id: "replit",
    name: "Replit",
    behaviorRules: [
      "Focus on deployment and runtime behavior.",
      "Explain required environment variables.",
      "Check server/build scripts.",
      "Verify startup and build flow.",
    ],
    stopCondition: "Stop after the app starts or builds with the documented environment expectations.",
  },
  bolt: {
    id: "bolt",
    name: "Bolt",
    behaviorRules: [
      "Use simple implementation instructions.",
      "Avoid complex backend changes unless needed.",
      "Keep fixes narrow and easy to review.",
    ],
    stopCondition: "Stop after the narrow implementation is complete and visibly works.",
  },
  windsurf: {
    id: "windsurf",
    name: "Windsurf",
    behaviorRules: [
      "Keep implementation scoped to the requested fix.",
      "Preserve the existing project structure.",
      "Avoid unrelated refactors.",
      "Verify the changed surface.",
    ],
    stopCondition: "Stop after the scoped change is verified in the existing structure.",
  },
  generic: {
    id: "generic",
    name: "Generic AI Builder",
    behaviorRules: [
      "Use platform-neutral instructions.",
      "Keep the scope explicit.",
      "Verify against success criteria.",
      "Avoid unrelated changes.",
    ],
    stopCondition: "Stop after the requested outcome is met and verified.",
  },
};

export const targetToolOptions = Object.values(toolProfiles);
