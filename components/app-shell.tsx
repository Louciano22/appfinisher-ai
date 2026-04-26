"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { getProjectStatus, mockProjects, routeContent } from "@/lib/mock";
import { StatusBadge } from "@/components/status-badge";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "D" },
  { href: "/projects", label: "Projects", icon: "P" },
  { href: "/new-project", label: "New Project", icon: "+" },
  { href: "/scan", label: "Scan Results", icon: "S" },
  { href: "/bug-finder", label: "Bug Finder", icon: "B" },
  { href: "/duplicate-finder", label: "Duplicate Finder", icon: "F" },
  { href: "/launch-plan", label: "Launch Plan", icon: "L" },
  { href: "/launch-os", label: "Launch OS", icon: "O" },
  { href: "/prompt-packs", label: "Prompt Packs", icon: "A" },
  { href: "/reports", label: "Reports", icon: "R" },
  { href: "/settings", label: "Settings", icon: "G" },
];

const defaultProject = mockProjects[0];

function getTitle(pathname: string) {
  if (pathname === "/") return "Home";
  if (pathname.startsWith("/projects/")) return "Project Detail";
  return routeContent[pathname as keyof typeof routeContent]?.title ?? "Dashboard";
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full flex-col border-r border-white/10 bg-zinc-950/95">
      <div className="border-b border-white/10 p-5">
        <Link href="/" onClick={onNavigate} className="group block">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-300/30 bg-blue-500/15 font-mono text-sm font-semibold text-sky-100 shadow-sm shadow-blue-950/40">
              AF
            </div>
            <div>
              <p className="font-semibold tracking-tight text-white">AppFinisher AI</p>
              <p className="text-xs text-zinc-500">ShipGuard Engine</p>
            </div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href === "/projects" && pathname.startsWith("/projects/"));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                active
                  ? "border border-sky-300/25 bg-blue-500/15 text-white"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/5 font-mono text-[11px]">
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-zinc-400">Active project</p>
            <StatusBadge status={getProjectStatus(defaultProject.status)} />
          </div>
          <p className="font-medium text-white">{defaultProject.name}</p>
          <p className="mt-1 text-xs text-zinc-500">
            Readiness{" "}
            <span className="font-mono text-zinc-300">
              {defaultProject.launchReadinessScore}%
            </span>
          </p>
        </div>
      </div>
    </aside>
  );
}

function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();
  const title = useMemo(() => getTitle(pathname), [pathname]);

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-zinc-950/85 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white lg:hidden"
            aria-label="Open navigation"
          >
            Menu
          </button>
          <div>
            <p className="text-xs text-zinc-500">Current view</p>
            <p className="font-semibold text-white">{title}</p>
          </div>
        </div>

        <div className="hidden items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 sm:flex">
          <span className="text-xs text-zinc-500">Project context</span>
          <span className="font-mono text-xs text-zinc-200">{defaultProject.id}</span>
          <StatusBadge status={getProjectStatus(defaultProject.status)} />
        </div>
      </div>
    </header>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  if (pathname === "/") {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#0f3b63_0,transparent_32rem),#070b12] text-zinc-100">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#0f3b63_0,transparent_32rem),#070b12] text-zinc-100">
      <div className="fixed inset-y-0 left-0 z-40 hidden w-72 lg:block">
        <Sidebar />
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/70"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
          />
          <div className="relative h-full w-80 max-w-[85vw]">
            <Sidebar onNavigate={() => setOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="lg:pl-72">
        <Topbar onMenuClick={() => setOpen(true)} />
        <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
