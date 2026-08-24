-- Real, shared vote counts per car (replaces the fake seeded baseVotes).
create table if not exists public.car_votes (
  car_slug text primary key,
  votes integer not null default 0
);

alter table public.car_votes enable row level security;

drop policy if exists "car_votes_public_read" on public.car_votes;
create policy "car_votes_public_read"
  on public.car_votes for select
  to anon, authenticated
  using (true);

grant select on public.car_votes to anon, authenticated;

-- Site-wide counters (currently just "visits" — replaces the fake
-- totalVotes*5.14 formula).
create table if not exists public.site_stats (
  key text primary key,
  value bigint not null default 0
);

insert into public.site_stats (key, value) values ('visits', 0)
on conflict (key) do nothing;

alter table public.site_stats enable row level security;

drop policy if exists "site_stats_public_read" on public.site_stats;
create policy "site_stats_public_read"
  on public.site_stats for select
  to anon, authenticated
  using (true);

grant select on public.site_stats to anon, authenticated;

-- Atomic increments, callable only from server code via the service role.
create or replace function public.increment_car_vote(p_car_slug text)
returns integer
language sql
as $$
  insert into public.car_votes (car_slug, votes) values (p_car_slug, 1)
  on conflict (car_slug) do update set votes = car_votes.votes + 1
  returning votes;
$$;

revoke execute on function public.increment_car_vote(text) from public;
grant execute on function public.increment_car_vote(text) to service_role;

create or replace function public.increment_site_visits()
returns bigint
language sql
as $$
  update public.site_stats set value = value + 1 where key = 'visits'
  returning value;
$$;

revoke execute on function public.increment_site_visits() from public;
grant execute on function public.increment_site_visits() to service_role;
