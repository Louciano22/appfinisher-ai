import { agentRules, issueTypeLabels, listSection } from "@/lib/promptpack/templates";
import { toolProfiles } from "@/lib/promptpack/toolProfiles";
import type { PromptPackInput, PromptPackOutput } from "@/lib/promptpack/types";
import { normalizePromptPackInput } from "@/lib/trust";

const defaultConstraints = [
  "Do not call external AI providers.",
  "Do not add live secrets or credentials.",
  "Do not implement unrelated features.",
  "Preserve the existing project structure and style.",
];

export function generatePromptPack(input: PromptPackInput): PromptPackOutput {
  const normalized = normalizePromptPackInput(input);
  const profile = toolProfiles[normalized.targetTool];
  const constraints = [...defaultConstraints, ...(normalized.constraints ?? [])];
  const severityLine = normalized.severity ? `\nSeverity: ${normalized.severity}` : "";
  const context = normalized.recommendedContext
    ? normalized.recommendedContext
    : `This is a deterministic AppFinisher AI PromptPack for a ${issueTypeLabels[input.issueType].toLowerCase()}.`;

  const prompt = `# ${normalized.title}

Target tool: ${profile.name}
Prompt type: ${issueTypeLabels[normalized.issueType]}${severityLine}

## Context
${context}

## Agent Rules
${agentRules.map((rule, index) => `${index + 1}. ${rule}`).join("\n")}

## Tool Behavior Rules
${listSection(profile.behaviorRules)}

## Files to Inspect
${listSection(normalized.filesToInspect)}

## Known Issue
${normalized.knownIssue}

## Goal
${normalized.goal}

## Constraints
${listSection(constraints)}

## Success Criteria
${listSection(normalized.successCriteria)}

## Verification Steps
${normalized.verificationSteps.map((step, index) => `${index + 1}. ${step}`).join("\n")}

## Stop Condition
${profile.stopCondition}`;

  return {
    id: `prompt-${normalized.id}-${normalized.targetTool}`,
    inputId: normalized.id,
    title: normalized.title,
    targetTool: normalized.targetTool,
    prompt,
    createdAt: new Date().toISOString(),
  };
}

export function withTargetTool(
  input: PromptPackInput,
  targetTool: PromptPackInput["targetTool"],
): PromptPackInput {
  return { ...input, targetTool };
}
