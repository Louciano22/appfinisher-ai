import type { LaunchPlan, LaunchPlanItem, LaunchStatus } from "@/lib/launch-plan";
import type { PromptPackInput } from "@/lib/promptpack";
import type { ScanResult } from "@/lib/shipguard-engine";

export type GuardrailResult = {
  guardedScore: number;
  guardedStatus: LaunchStatus;
  notes: string[];
};

export type ConsistencyIssue = {
  id: string;
  severity: "warning" | "error";
  message: string;
};

export type ConsistencyInput = {
  scanResult?: ScanResult;
  launchPlan?: LaunchPlan;
  bugCount?: number;
  duplicateGroupCount?: number;
  promptRecommendationItemIds?: string[];
};

export type PromptQualityResult = {
  valid: boolean;
  missingSections: string[];
  warnings: string[];
};

export type NextFixInput = {
  items: LaunchPlanItem[];
};

export type SmokeTestOptions = {
  billingEnabled?: boolean;
  aiEnabled?: boolean;
  supabaseEnabled?: boolean;
};

export type NormalizedPromptInput = PromptPackInput;
