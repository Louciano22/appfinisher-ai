create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid null,
  name text not null,
  description text not null default '',
  repo_url text not null default '',
  stack text[] not null default '{}',
  framework text not null default '',
  database text not null default '',
  billing_provider text not null default 'unknown',
  deployment_provider text not null default 'unknown',
  ai_provider text not null default 'generic',
  status text not null default 'needs_scan',
  launch_readiness_score integer not null default 0 check (launch_readiness_score >= 0 and launch_readiness_score <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid null,
  project_id uuid not null references public.projects(id) on delete cascade,
  status text not null default 'queued',
  overall_score integer not null default 0 check (overall_score >= 0 and overall_score <= 100),
  summary text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz null
);

create table public.scan_issues (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid null,
  scan_id uuid not null references public.scans(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text not null default '',
  category text not null,
  severity text not null,
  file_path text not null default '',
  why_it_matters text not null default '',
  recommended_fix text not null default '',
  builder_prompt_available boolean not null default false,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.bug_findings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid null,
  scan_id uuid not null references public.scans(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  file_path text not null default '',
  bug_type text not null,
  severity text not null,
  evidence text not null default '',
  recommended_fix text not null default '',
  success_criteria text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.duplicate_groups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid null,
  scan_id uuid not null references public.scans(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  duplicate_type text not null,
  severity text not null,
  files text[] not null default '{}',
  canonical_recommendation text not null default '',
  conflict_risk text not null default '',
  recommended_action text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.launch_readiness_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid null,
  scan_id uuid not null references public.scans(id) on delete cascade,
  name text not null,
  score integer not null default 0 check (score >= 0 and score <= 100),
  status text not null,
  summary text not null default '',
  blockers text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.prompt_packs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid null,
  project_id uuid not null references public.projects(id) on delete cascade,
  issue_id uuid null references public.scan_issues(id) on delete set null,
  target_tool text not null default 'generic',
  title text not null,
  prompt text not null default '',
  success_criteria text[] not null default '{}',
  files_to_inspect text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid null,
  project_id uuid not null references public.projects(id) on delete cascade,
  scan_id uuid not null references public.scans(id) on delete cascade,
  type text not null,
  title text not null,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
