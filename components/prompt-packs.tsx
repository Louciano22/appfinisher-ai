"use client";

import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/status-badge";
import { Card, MetricCard, PageHeader, SectionTitle } from "@/components/ui";
import { mockPromptPackInputs } from "@/lib/mock";
import {
  generatePromptPack,
  issueTypeLabels,
  targetToolOptions,
  toolProfiles,
  type PromptPackOutput,
} from "@/lib/promptpack";
import type { BuilderTarget } from "@/lib/types";

export function PromptPacks() {
  const [selectedInputId, setSelectedInputId] = useState(mockPromptPackInputs[0].id);
  const [targetTool, setTargetTool] = useState<BuilderTarget>("cursor");
  const [currentPrompt, setCurrentPrompt] = useState<PromptPackOutput | null>(null);
  const [history, setHistory] = useState<PromptPackOutput[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const selectedInput = useMemo(
    () => mockPromptPackInputs.find((input) => input.id === selectedInputId) ?? mockPromptPackInputs[0],
    [selectedInputId],
  );

  function generatePrompt() {
    setCurrentPrompt(generatePromptPack({ ...selectedInput, targetTool }));
  }

  async function copyPrompt(prompt: PromptPackOutput) {
    await navigator.clipboard.writeText(prompt.prompt);
    setCopiedId(prompt.id);
    window.setTimeout(() => setCopiedId(null), 1600);
  }

  function savePrompt() {
    if (!currentPrompt) return;

    setHistory((existing) => [currentPrompt, ...existing]);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Prompt Packs"
        subtitle="Generate deterministic, builder-ready prompts from structured AppFinisher issue data. No LLM calls or external providers are used."
        action={<StatusBadge status={{ label: "Template Generated", icon: "*", tone: "accent" }} />}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Sample issues"
          value={mockPromptPackInputs.length}
          detail="Structured prompt inputs"
        />
        <MetricCard
          label="Target tools"
          value={targetToolOptions.length}
          detail="Cursor, Lovable, Claude Code, Replit, Bolt, Windsurf, Generic"
          tone="blue"
        />
        <MetricCard
          label="Saved prompts"
          value={history.length}
          detail="Mock local UI state only"
          tone="green"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <SectionTitle
            title="Generate prompt"
            subtitle="Select a structured issue and target builder."
          />
          <div className="space-y-5">
            <label className="block">
              <span className="text-sm font-medium text-zinc-300">Issue / finding</span>
              <select
                value={selectedInputId}
                onChange={(event) => {
                  setSelectedInputId(event.target.value);
                  setCurrentPrompt(null);
                }}
                className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-sky-300"
              >
                {mockPromptPackInputs.map((input) => (
                  <option key={input.id} value={input.id}>
                    {input.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-zinc-300">Target tool</span>
              <select
                value={targetTool}
                onChange={(event) => {
                  setTargetTool(event.target.value as BuilderTarget);
                  setCurrentPrompt(null);
                }}
                className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-sky-300"
              >
                {targetToolOptions.map((tool) => (
                  <option key={tool.id} value={tool.id}>
                    {tool.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-3 flex flex-wrap gap-2">
                <StatusBadge
                  status={{
                    label: issueTypeLabels[selectedInput.issueType],
                    icon: "P",
                    tone: "blue",
                  }}
                />
                <StatusBadge
                  status={{ label: toolProfiles[targetTool].name, icon: "T", tone: "accent" }}
                />
              </div>
              <p className="font-medium text-white">{selectedInput.title}</p>
              <p className="mt-2 text-sm leading-6 text-zinc-500">{selectedInput.knownIssue}</p>
            </div>

            <button
              type="button"
              onClick={generatePrompt}
              className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-950/40 transition hover:bg-blue-500"
            >
              Generate Prompt
            </button>
          </div>
        </Card>

        <Card>
          <SectionTitle
            title="Generated prompt"
            subtitle="Copy/paste markdown optimized for the selected builder."
          />
          {currentPrompt ? (
            <PromptPreview
              prompt={currentPrompt}
              copied={copiedId === currentPrompt.id}
              onCopy={() => copyPrompt(currentPrompt)}
              onSave={savePrompt}
            />
          ) : (
            <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center">
              <p className="font-medium text-white">No prompt generated yet</p>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-zinc-500">
                Choose an issue and target tool, then generate a deterministic PromptPack.
              </p>
            </div>
          )}
        </Card>
      </div>

      <Card>
        <SectionTitle
          title="Previous generated prompts"
          subtitle="Saved in local UI state only for this session."
        />
        {history.length > 0 ? (
          <div className="space-y-3">
            {history.map((prompt) => (
              <div
                key={`${prompt.id}-${prompt.createdAt}`}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-white">{prompt.title}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {toolProfiles[prompt.targetTool].name} / {new Date(prompt.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyPrompt(prompt)}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
                  >
                    {copiedId === prompt.id ? "Copied" : "Copy Prompt"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-6 text-sm text-zinc-500">
            Saved prompt history will appear here after you generate and save a prompt.
          </div>
        )}
      </Card>
    </div>
  );
}

function PromptPreview({
  prompt,
  copied,
  onCopy,
  onSave,
}: {
  prompt: PromptPackOutput;
  copied: boolean;
  onCopy: () => void;
  onSave: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium text-white">{prompt.title}</p>
          <p className="mt-1 text-xs text-zinc-500">{toolProfiles[prompt.targetTool].name}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCopy}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
          >
            {copied ? "Copied" : "Copy Prompt"}
          </button>
          <button
            type="button"
            onClick={onSave}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
          >
            Save Prompt Pack
          </button>
        </div>
      </div>
      <pre className="max-h-[580px] overflow-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-black/40 p-4 font-mono text-xs leading-6 text-zinc-200">
        {prompt.prompt}
      </pre>
    </div>
  );
}
