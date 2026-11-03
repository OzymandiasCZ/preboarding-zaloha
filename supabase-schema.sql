create table if not exists public.pb_hires (
  id bigint generated always as identity primary key,
  name text not null,
  position text not null,
  start_date date not null,
  created_at timestamptz not null default now()
);

create table if not exists public.pb_tasks (
  id bigint generated always as identity primary key,
  hire_id bigint not null references public.pb_hires(id) on delete cascade,
  category text not null check (category in ('documents', 'equipment', 'access', 'first_day')),
  title text not null,
  done boolean not null default false,
  sort int not null default 0
);

alter table public.pb_hires enable row level security;
alter table public.pb_tasks enable row level security;

grant usage on schema public to service_role;
grant all on table public.pb_hires, public.pb_tasks to service_role;
grant usage, select on all sequences in schema public to service_role;

-- Data nováčků jsou osobní údaje. Aplikace k nim přistupuje výhradně serverově
-- přes service_role (obchází RLS). Role anon/authenticated (publishable/anon klíč,
-- Data API) k tabulkám nesmí mít žádná práva. RLS je zapnuté a záměrně bez policies
-- (deny-all) jako druhá vrstva ochrany.
revoke all on table public.pb_hires, public.pb_tasks from anon, authenticated;

-- Keepalive pro Supabase Free plán: GitHub Action ji volá 1× denně přes anon klíč.
-- Nevrací žádná data, běží s právy volajícího (SECURITY INVOKER), pevný search_path.
create or replace function public.keepalive()
returns timestamptz
language sql
stable
security invoker
set search_path = ''
as $$
  select now();
$$;

revoke all on function public.keepalive() from public;
grant execute on function public.keepalive() to anon, authenticated;
