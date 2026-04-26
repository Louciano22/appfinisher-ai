import type { StatusTone, UiStatus } from "@/lib/mock";

const toneClasses: Record<StatusTone, string> = {
  green: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
  red: "border-red-400/25 bg-red-400/10 text-red-200",
  amber: "border-amber-400/25 bg-amber-400/10 text-amber-200",
  blue: "border-sky-400/25 bg-sky-400/10 text-sky-200",
  accent: "border-blue-300/30 bg-blue-500/10 text-blue-100 shadow-sm shadow-blue-950/30",
  zinc: "border-zinc-700 bg-zinc-900 text-zinc-300",
};

export function StatusBadge({ status }: { status: UiStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${toneClasses[status.tone]}`}
    >
      <span className="font-mono text-[11px]" aria-hidden="true">
        {status.icon}
      </span>
      {status.label}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: string }) {
  const status: UiStatus =
    severity === "critical"
      ? { label: "Critical", icon: "!", tone: "red" }
      : severity === "high"
        ? { label: "High", icon: "!", tone: "amber" }
        : severity === "medium"
          ? { label: "Medium", icon: "-", tone: "blue" }
          : { label: "Low", icon: "+", tone: "green" };

  return <StatusBadge status={status} />;
}
