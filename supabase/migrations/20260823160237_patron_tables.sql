-- Patrons: current sponsor per car model (public read, server-only write)
create table if not exists public.patrons (
  car_slug text primary key,
  name text not null,
  tagline text not null default '',
  platform text not null,
  handle text not null,
  url text not null,
  price integer not null,
  updated_at timestamptz not null default now()
);

alter table public.patrons enable row level security;

drop policy if exists "patrons_public_read" on public.patrons;
create policy "patrons_public_read"
  on public.patrons for select
  to anon, authenticated
  using (true);

grant select on public.patrons to anon, authenticated;

-- Patron history: past sponsors per car model (public read, server-only write)
create table if not exists public.patron_history (
  id bigint generated always as identity primary key,
  car_slug text not null,
  name text not null,
  platform text not null,
  handle text not null,
  price integer not null,
  created_at timestamptz not null default now()
);

create index if not exists patron_history_car_slug_idx
  on public.patron_history (car_slug, created_at desc);

alter table public.patron_history enable row level security;

drop policy if exists "patron_history_public_read" on public.patron_history;
create policy "patron_history_public_read"
  on public.patron_history for select
  to anon, authenticated
  using (true);

grant select on public.patron_history to anon, authenticated;

-- Patron orders: pending/paid Shopier checkout attempts. Holds buyer PII
-- (email/phone), so no grants to anon/authenticated at all — only reachable
-- via the service role key from server-side API routes.
create table if not exists public.patron_orders (
  id uuid primary key default gen_random_uuid(),
  car_slug text not null,
  order_id text not null unique,
  name text not null,
  tagline text not null default '',
  platform text not null,
  handle text not null,
  url text not null,
  price integer not null,
  buyer_name text not null,
  buyer_email text not null,
  buyer_phone text not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists patron_orders_car_slug_idx on public.patron_orders (car_slug);

alter table public.patron_orders enable row level security;
