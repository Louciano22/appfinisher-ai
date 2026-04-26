import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-sky-300">
          ShipGuard Engine
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
          {subtitle}
        </p>
      </div>
      {action}
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-white/10 bg-zinc-950/70 p-5 shadow-2xl shadow-black/20 ${className}`}
    >
      {children}
    </section>
  );
}

export function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-semibold text-white">{title}</h2>
      {subtitle ? <p className="mt-1 text-sm text-zinc-500">{subtitle}</p> : null}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  detail,
  tone = "blue",
}: {
  label: string;
  value: string | number;
  detail: string;
  tone?: "red" | "amber" | "green" | "blue";
}) {
  const tones = {
    red: "from-red-500/20 to-red-500/5 text-red-200",
    amber: "from-amber-500/20 to-amber-500/5 text-amber-200",
    green: "from-emerald-500/20 to-emerald-500/5 text-emerald-200",
    blue: "from-blue-500/20 via-sky-400/10 to-slate-950 text-blue-100",
  };

  return (
    <Card className={`bg-gradient-to-br ${tones[tone]}`}>
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="mt-3 font-mono text-3xl font-semibold tracking-tight text-white">
        {value}
      </p>
      <p className="mt-2 text-xs leading-5 text-zinc-500">{detail}</p>
    </Card>
  );
}
