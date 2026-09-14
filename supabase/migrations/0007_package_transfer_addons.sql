-- Transfer routes/vehicles as a selectable add-on inside Package Edit —
-- masaar-client-data-round2.md, Section 3 ("these same vehicle/route
-- combinations should be selectable as an add-on inside Umrah/Hajj
-- package configuration ... not confined to a standalone Transfers
-- page").
--
-- vehicle_id is nullable: an admin can attach just a route ("Jeddah
-- Airport -> Makkah Hotel", any vehicle) or a specific route+vehicle
-- combination.
create table public.package_transfer_addons (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.packages (id) on delete cascade,
  transfer_id uuid not null references public.transfers (id) on delete restrict,
  vehicle_id uuid references public.transfer_vehicles (id) on delete restrict,
  is_active boolean not null default true,
  display_order integer not null default 0,
  unique (package_id, transfer_id, vehicle_id)
);

create index package_transfer_addons_package_id_idx on public.package_transfer_addons (package_id);
create index package_transfer_addons_transfer_id_idx on public.package_transfer_addons (transfer_id);

alter table public.package_transfer_addons enable row level security;

-- Public read follows the same rule as package_hotels: visible only if
-- the parent package is publicly visible. Never exposes price (this
-- table doesn't carry one — the route/vehicle names are public-safe
-- exactly like transfer_route_available_vehicles).
create policy "package_transfer_addons_public_read" on public.package_transfer_addons
  for select using (
    is_active and exists (
      select 1 from public.packages p
      where p.id = package_transfer_addons.package_id
        and p.show_on_website and p.is_active
    )
  );
create policy "package_transfer_addons_admin_all" on public.package_transfer_addons
  for all to authenticated using (true) with check (true);
