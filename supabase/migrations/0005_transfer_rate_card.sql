-- Transfer vehicle fleet + route rate card — masaar-client-data-round2.md,
-- Section 3.
--
-- `transfers` (0001_init.sql) modelled one price/one vehicle per route,
-- which doesn't fit a rate CARD (one route x five vehicle options, each
-- with its own price). This adds:
--   transfer_vehicles      — the fleet (Camry, Staria, GMC XL Yukon, ...)
--   transfer_route_rates   — price per (route, vehicle) pair — ADMIN ONLY,
--                            see RLS below. Haseeb does not want these
--                            numbers shown to visitors.
--   transfer_route_available_vehicles (view) — the public-safe read: which
--                            vehicles exist for a route, no price column.
--                            Views run with the view owner's privileges by
--                            default (bypassing the base tables' RLS), so
--                            this is safe to grant to anon precisely
--                            *because* it never selects price_aed — the
--                            protection is "the column isn't in the view
--                            definition", not just "the UI doesn't render
--                            it".

create table public.transfer_vehicles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique, -- e.g. "Toyota Camry"
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger transfer_vehicles_set_updated_at
  before update on public.transfer_vehicles
  for each row execute function public.set_updated_at();

create table public.transfer_route_rates (
  id uuid primary key default gen_random_uuid(),
  transfer_id uuid not null references public.transfers (id) on delete cascade,
  vehicle_id uuid not null references public.transfer_vehicles (id) on delete cascade,
  price_aed numeric(10, 2) not null check (price_aed >= 0),
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (transfer_id, vehicle_id)
);

create index transfer_route_rates_transfer_id_idx on public.transfer_route_rates (transfer_id);
create index transfer_route_rates_vehicle_id_idx on public.transfer_route_rates (vehicle_id);

create trigger transfer_route_rates_set_updated_at
  before update on public.transfer_route_rates
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────────────────
alter table public.transfer_vehicles enable row level security;
alter table public.transfer_route_rates enable row level security;

create policy "transfer_vehicles_public_read" on public.transfer_vehicles
  for select using (is_active);
create policy "transfer_vehicles_admin_all" on public.transfer_vehicles
  for all to authenticated using (true) with check (true);

-- No public select policy on transfer_route_rates at all — admin/internal
-- reference data only, per the brief's explicit "don't show prices
-- publicly" instruction.
create policy "transfer_route_rates_admin_all" on public.transfer_route_rates
  for all to authenticated using (true) with check (true);

-- ─────────────────────────────────────────────────────────────────────────
-- Public-safe view: which vehicles are available per route, no price.
-- ─────────────────────────────────────────────────────────────────────────
create view public.transfer_route_available_vehicles as
select
  r.transfer_id,
  v.id as vehicle_id,
  v.name as vehicle_name,
  r.display_order
from public.transfer_route_rates r
join public.transfer_vehicles v on v.id = r.vehicle_id
where r.is_active and v.is_active;

grant select on public.transfer_route_available_vehicles to anon, authenticated;
