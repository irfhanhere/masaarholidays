-- Migration: 0043_inclusions_addons_catalog.sql
-- Master Inclusions & Add-ons catalog tables for Umrah & Hajj packages.
-- Connects to Screen 4 (Global Inclusions & Add-ons Catalog) and Screen 3 (Package Tier Master Edit).

create table if not exists public.package_inclusions_catalog (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('umrah', 'hajj')) default 'umrah',
  name text not null,
  icon text not null default '🏨',
  is_default_included boolean not null default true,
  status public.publish_status not null default 'published',
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.package_addons_catalog (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('umrah', 'hajj')) default 'umrah',
  name text not null,
  key_slug text not null unique,
  icon text not null default '📄',
  price_type_label text not null default 'Fixed / From Price',
  status public.publish_status not null default 'published',
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Triggers for updated_at
create trigger package_inclusions_catalog_set_updated_at
  before update on public.package_inclusions_catalog
  for each row execute function public.set_updated_at();

create trigger package_addons_catalog_set_updated_at
  before update on public.package_addons_catalog
  for each row execute function public.set_updated_at();

-- RLS Policies
alter table public.package_inclusions_catalog enable row level security;
create policy "package_inclusions_catalog_public_read" on public.package_inclusions_catalog for select using (true);
create policy "package_inclusions_catalog_admin_write" on public.package_inclusions_catalog for all to authenticated using (true) with check (true);

alter table public.package_addons_catalog enable row level security;
create policy "package_addons_catalog_public_read" on public.package_addons_catalog for select using (true);
create policy "package_addons_catalog_admin_write" on public.package_addons_catalog for all to authenticated using (true) with check (true);

-- Seed Initial Data matching reference screen (ADMIN - INCLUSIONS.png)
insert into public.package_inclusions_catalog (category, name, icon, is_default_included, status, display_order)
values
  ('umrah', 'Accommodation', '🏨', true, 'published', 1),
  ('umrah', 'Private transfers', '🚗', true, 'published', 2),
  ('umrah', 'Haram shuttle', '🚌', true, 'published', 3),
  ('umrah', 'Guest support', '🎧', true, 'published', 4),
  ('umrah', 'Daily breakfast', '🍽', false, 'published', 5),
  ('umrah', 'Ziyarat (as per itinerary)', '🕌', false, 'published', 6)
on conflict do nothing;

insert into public.package_addons_catalog (category, name, key_slug, icon, price_type_label, status, display_order)
values
  ('umrah', 'Visa', 'visa', '📄', 'Fixed / From Price', 'published', 1),
  ('umrah', 'Makkah Ziyarat', 'makkah_ziyarat', '🕋', 'Fixed / From Price', 'published', 2),
  ('umrah', 'Madinah Ziyarat', 'madinah_ziyarat', '🕌', 'Fixed / From Price', 'published', 3),
  ('umrah', 'Flights', 'flights', '✈️', 'Fixed / From Price', 'published', 4),
  ('umrah', 'Private Trips', 'private_trips', '🗺', 'Fixed / From Price', 'published', 5),
  ('umrah', 'Extra Nights', 'extra_nights', '📅', 'Fixed / From Price', 'published', 6)
on conflict (key_slug) do nothing;
