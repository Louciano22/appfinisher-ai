-- Placeholder for future database helpers.
-- Keep this file intentionally minimal until AppFinisher AI connects to live Supabase.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
