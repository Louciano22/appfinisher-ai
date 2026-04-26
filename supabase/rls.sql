alter table public.projects enable row level security;
alter table public.scans enable row level security;
alter table public.scan_issues enable row level security;
alter table public.bug_findings enable row level security;
alter table public.duplicate_groups enable row level security;
alter table public.launch_readiness_categories enable row level security;
alter table public.prompt_packs enable row level security;
alter table public.reports enable row level security;

create policy "Project owners can read projects"
on public.projects for select
using (auth.uid() = user_id);

create policy "Project owners can insert projects"
on public.projects for insert
with check (auth.uid() = user_id);

create policy "Project owners can update projects"
on public.projects for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Project owners can delete projects"
on public.projects for delete
using (auth.uid() = user_id);

create policy "Owners can read scans"
on public.scans for select
using (auth.uid() = user_id);

create policy "Owners can insert scans"
on public.scans for insert
with check (auth.uid() = user_id);

create policy "Owners can update scans"
on public.scans for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Owners can delete scans"
on public.scans for delete
using (auth.uid() = user_id);

create policy "Owners can read scan issues"
on public.scan_issues for select
using (auth.uid() = user_id);

create policy "Owners can insert scan issues"
on public.scan_issues for insert
with check (auth.uid() = user_id);

create policy "Owners can update scan issues"
on public.scan_issues for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Owners can delete scan issues"
on public.scan_issues for delete
using (auth.uid() = user_id);

create policy "Owners can read bug findings"
on public.bug_findings for select
using (auth.uid() = user_id);

create policy "Owners can insert bug findings"
on public.bug_findings for insert
with check (auth.uid() = user_id);

create policy "Owners can update bug findings"
on public.bug_findings for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Owners can delete bug findings"
on public.bug_findings for delete
using (auth.uid() = user_id);

create policy "Owners can read duplicate groups"
on public.duplicate_groups for select
using (auth.uid() = user_id);

create policy "Owners can insert duplicate groups"
on public.duplicate_groups for insert
with check (auth.uid() = user_id);

create policy "Owners can update duplicate groups"
on public.duplicate_groups for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Owners can delete duplicate groups"
on public.duplicate_groups for delete
using (auth.uid() = user_id);

create policy "Owners can read launch readiness categories"
on public.launch_readiness_categories for select
using (auth.uid() = user_id);

create policy "Owners can insert launch readiness categories"
on public.launch_readiness_categories for insert
with check (auth.uid() = user_id);

create policy "Owners can update launch readiness categories"
on public.launch_readiness_categories for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Owners can delete launch readiness categories"
on public.launch_readiness_categories for delete
using (auth.uid() = user_id);

create policy "Owners can read prompt packs"
on public.prompt_packs for select
using (auth.uid() = user_id);

create policy "Owners can insert prompt packs"
on public.prompt_packs for insert
with check (auth.uid() = user_id);

create policy "Owners can update prompt packs"
on public.prompt_packs for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Owners can delete prompt packs"
on public.prompt_packs for delete
using (auth.uid() = user_id);

create policy "Owners can read reports"
on public.reports for select
using (auth.uid() = user_id);

create policy "Owners can insert reports"
on public.reports for insert
with check (auth.uid() = user_id);

create policy "Owners can update reports"
on public.reports for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Owners can delete reports"
on public.reports for delete
using (auth.uid() = user_id);
