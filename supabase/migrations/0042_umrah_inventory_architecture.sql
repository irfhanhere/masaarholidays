-- Migration: 0042_umrah_inventory_architecture.sql
-- Implements Phase 2: Data Architecture for the Umrah System Rebuild.
-- Introduces relational inventory configurations (linking Package Tier, Journey Type,
-- Month, Duration, Makkah/Madinah Primary & Alternate Hotels, Room Occupancy Rates,
-- Structured Itineraries, Inclusions Overrides, and Add-on Private Trips),
-- alongside master Ziyarat & Vehicle Pricing tables.
--
-- Note on Enum Values: Postgres enum public.package_tier uses ('essential', 'signature', 'exclusive')
-- (renamed from 'prive' in migration 0021_rename_prive_to_exclusive.sql).
--
-- Apply manually in Supabase SQL Editor.

-- ─────────────────────────────────────────────────────────────────────────
-- 1. umrah_inventory_configurations
-- Primary inventory table linking a Tier master (packages) to a specific
-- Journey, Month, Duration, Hotel options, and Itinerary.
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.umrah_inventory_configurations (
  id uuid primary key default gen_random_uuid(),
  
  -- Foreign Key to Package Tier Master (packages.id representing Essential, Signature, or Exclusive)
  package_id uuid not null references public.packages(id) on delete cascade,
  
  -- Journey Type ('makkah_only' | 'makkah_madinah')
  journey_type text not null check (journey_type in ('makkah_only', 'makkah_madinah')),
  
  -- Foreign Key to Departure Month (umrah_departure_months.id)
  month_id uuid references public.umrah_departure_months(id) on delete set null,
  
  -- Duration parameters
  duration_nights integer not null check (duration_nights > 0),
  duration_days integer not null check (duration_days > 0),
  duration_label text not null, -- e.g. "2 Nights / 3 Days" or "4 Nights / 5 Days"
  
  -- Primary Hotel Option (Option A) — Makkah & Madinah
  makkah_hotel_id uuid references public.hotels(id) on delete set null,
  makkah_allow_similar boolean not null default true,
  makkah_custom_note text,
  
  madinah_hotel_id uuid references public.hotels(id) on delete set null,
  madinah_allow_similar boolean not null default true,
  madinah_custom_note text,
  
  -- Alternate Hotel Option (Option B) — Makkah & Madinah
  makkah_hotel_id_alt uuid references public.hotels(id) on delete set null,
  makkah_allow_similar_alt boolean not null default true,
  makkah_custom_note_alt text,
  
  madinah_hotel_id_alt uuid references public.hotels(id) on delete set null,
  madinah_allow_similar_alt boolean not null default true,
  madinah_custom_note_alt text,
  
  -- Duration-specific structured day-by-day itinerary JSONB array: [{ day: 1, title: "Arrival", items: [...] }]
  itinerary jsonb not null default '[]'::jsonb,
  
  -- Nullable inclusions override — when set, overrides the tier's default packages.inclusions_text
  inclusions_override text,
  
  -- Visibility & Display Order
  status public.publish_status not null default 'published',
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Column Comments for umrah_inventory_configurations
comment on column public.umrah_inventory_configurations.package_id is
  'References the parent package tier master in packages.id (Essential, Signature, or Exclusive).';
comment on column public.umrah_inventory_configurations.journey_type is
  'Specifies the journey coverage: makkah_only or makkah_madinah.';
comment on column public.umrah_inventory_configurations.month_id is
  'References the departure month in umrah_departure_months.id.';
comment on column public.umrah_inventory_configurations.duration_nights is
  'Total nights for this inventory configuration.';
comment on column public.umrah_inventory_configurations.duration_days is
  'Total days for this inventory configuration.';
comment on column public.umrah_inventory_configurations.duration_label is
  'Display string e.g. "2 Nights / 3 Days".';
comment on column public.umrah_inventory_configurations.makkah_hotel_id is
  'References Option A Makkah hotel in hotels.id.';
comment on column public.umrah_inventory_configurations.makkah_allow_similar is
  'Flag to display "(or similar)" badge for Option A Makkah hotel.';
comment on column public.umrah_inventory_configurations.makkah_custom_note is
  'Configuration-specific proximity/shuttle note for Option A Makkah stay.';
comment on column public.umrah_inventory_configurations.madinah_hotel_id is
  'References Option A Madinah hotel in hotels.id.';
comment on column public.umrah_inventory_configurations.madinah_allow_similar is
  'Flag to display "(or similar)" badge for Option A Madinah hotel.';
comment on column public.umrah_inventory_configurations.madinah_custom_note is
  'Configuration-specific proximity/shuttle note for Option A Madinah stay.';
comment on column public.umrah_inventory_configurations.makkah_hotel_id_alt is
  'References Option B alternate Makkah hotel in hotels.id.';
comment on column public.umrah_inventory_configurations.makkah_allow_similar_alt is
  'Flag to display "(or similar)" badge for Option B Makkah hotel.';
comment on column public.umrah_inventory_configurations.makkah_custom_note_alt is
  'Configuration-specific note for Option B Makkah stay.';
comment on column public.umrah_inventory_configurations.madinah_hotel_id_alt is
  'References Option B alternate Madinah hotel in hotels.id.';
comment on column public.umrah_inventory_configurations.madinah_allow_similar_alt is
  'Flag to display "(or similar)" badge for Option B Madinah hotel.';
comment on column public.umrah_inventory_configurations.madinah_custom_note_alt is
  'Configuration-specific note for Option B Madinah stay.';
comment on column public.umrah_inventory_configurations.itinerary is
  'Duration-specific day-by-day itinerary JSONB array e.g. [{ day: 1, title: "...", items: [...] }].';
comment on column public.umrah_inventory_configurations.inclusions_override is
  'Nullable text — when present, overrides packages.inclusions_text for this specific duration configuration.';
comment on column public.umrah_inventory_configurations.status is
  'Publish status (draft | published).';

-- Indexes & Triggers
create index if not exists idx_umrah_inv_config_package_id on public.umrah_inventory_configurations (package_id);
create index if not exists idx_umrah_inv_config_month_id on public.umrah_inventory_configurations (month_id);
create index if not exists idx_umrah_inv_config_journey_type on public.umrah_inventory_configurations (journey_type);

create trigger umrah_inventory_configurations_set_updated_at
  before update on public.umrah_inventory_configurations
  for each row execute function public.set_updated_at();

-- RLS Policies
alter table public.umrah_inventory_configurations enable row level security;
create policy "umrah_inventory_configurations_public_read" on public.umrah_inventory_configurations
  for select using (true);
create policy "umrah_inventory_configurations_admin_write" on public.umrah_inventory_configurations
  for all to authenticated using (true) with check (true);

-- ─────────────────────────────────────────────────────────────────────────
-- 2. umrah_configuration_room_prices
-- Room occupancy price records linked to a specific inventory configuration.
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.umrah_configuration_room_prices (
  id uuid primary key default gen_random_uuid(),
  configuration_id uuid not null references public.umrah_inventory_configurations(id) on delete cascade,
  occupancy_type text not null, -- 'Double', 'Triple', 'Quad', 'Single'
  price_aed numeric(10, 2) not null check (price_aed >= 0),
  display_order integer not null default 0,
  constraint umrah_config_room_prices_unique unique (configuration_id, occupancy_type)
);

-- Column Comments for umrah_configuration_room_prices
comment on column public.umrah_configuration_room_prices.configuration_id is
  'References parent inventory configuration in umrah_inventory_configurations.id.';
comment on column public.umrah_configuration_room_prices.occupancy_type is
  'Room occupancy type e.g. Double, Triple, Quad, Single.';
comment on column public.umrah_configuration_room_prices.price_aed is
  'Per-person price in AED for this room occupancy type.';

-- Indexes & RLS Policies
create index if not exists idx_umrah_config_room_prices_config_id on public.umrah_configuration_room_prices (configuration_id);

alter table public.umrah_configuration_room_prices enable row level security;
create policy "umrah_config_room_prices_public_read" on public.umrah_configuration_room_prices
  for select using (true);
create policy "umrah_config_room_prices_admin_write" on public.umrah_configuration_room_prices
  for all to authenticated using (true) with check (true);

-- ─────────────────────────────────────────────────────────────────────────
-- 3. umrah_configuration_private_trips
-- Junction table linking inventory configurations to recommended Private Trips.
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.umrah_configuration_private_trips (
  id uuid primary key default gen_random_uuid(),
  configuration_id uuid not null references public.umrah_inventory_configurations(id) on delete cascade,
  private_trip_id uuid not null references public.private_trips(id) on delete cascade,
  display_order integer not null default 0,
  constraint umrah_config_private_trips_unique unique (configuration_id, private_trip_id)
);

-- Column Comments for umrah_configuration_private_trips
comment on column public.umrah_configuration_private_trips.configuration_id is
  'References parent inventory configuration in umrah_inventory_configurations.id.';
comment on column public.umrah_configuration_private_trips.private_trip_id is
  'References an available add-on private trip in private_trips.id.';

-- Indexes & RLS Policies
create index if not exists idx_umrah_config_private_trips_config_id on public.umrah_configuration_private_trips (configuration_id);
create index if not exists idx_umrah_config_private_trips_trip_id on public.umrah_configuration_private_trips (private_trip_id);

alter table public.umrah_configuration_private_trips enable row level security;
create policy "umrah_config_private_trips_public_read" on public.umrah_configuration_private_trips
  for select using (true);
create policy "umrah_config_private_trips_admin_write" on public.umrah_configuration_private_trips
  for all to authenticated using (true) with check (true);

-- ─────────────────────────────────────────────────────────────────────────
-- 4. ziyarat_vehicle_types
-- Master catalog of vehicle types available for Ziyarat and private tours.
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.ziyarat_vehicle_types (
  id uuid primary key default gen_random_uuid(),
  name text not null, -- e.g. 'Sedan', 'Staria', 'GMC Yukon / Suburban'
  slug text not null unique,
  capacity_label text not null, -- e.g. 'Up to 4 passengers'
  description text,
  image_url text,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Column Comments for ziyarat_vehicle_types
comment on column public.ziyarat_vehicle_types.name is
  'Vehicle type name e.g. Sedan, Staria, GMC Yukon.';
comment on column public.ziyarat_vehicle_types.capacity_label is
  'Passenger capacity text e.g. "Up to 4 passengers".';
comment on column public.ziyarat_vehicle_types.image_url is
  'Vehicle thumbnail image URL.';

create trigger ziyarat_vehicle_types_set_updated_at
  before update on public.ziyarat_vehicle_types
  for each row execute function public.set_updated_at();

alter table public.ziyarat_vehicle_types enable row level security;
create policy "ziyarat_vehicle_types_public_read" on public.ziyarat_vehicle_types
  for select using (true);
create policy "ziyarat_vehicle_types_admin_write" on public.ziyarat_vehicle_types
  for all to authenticated using (true) with check (true);

-- ─────────────────────────────────────────────────────────────────────────
-- 5. ziyarat_pricing
-- Pricing matrix per city and vehicle type for Ziyarat tours.
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.ziyarat_pricing (
  id uuid primary key default gen_random_uuid(),
  city text not null check (city in ('Makkah', 'Madinah')),
  vehicle_type_id uuid not null references public.ziyarat_vehicle_types(id) on delete cascade,
  price_aed numeric(10, 2) not null check (price_aed >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ziyarat_pricing_city_vehicle_unique unique (city, vehicle_type_id)
);

-- Column Comments for ziyarat_pricing
comment on column public.ziyarat_pricing.city is
  'Target city for Ziyarat tour (Makkah or Madinah).';
comment on column public.ziyarat_pricing.vehicle_type_id is
  'References vehicle type in ziyarat_vehicle_types.id.';
comment on column public.ziyarat_pricing.price_aed is
  'Fixed tour price in AED for this vehicle type.';

create trigger ziyarat_pricing_set_updated_at
  before update on public.ziyarat_pricing
  for each row execute function public.set_updated_at();

alter table public.ziyarat_pricing enable row level security;
create policy "ziyarat_pricing_public_read" on public.ziyarat_pricing
  for select using (true);
create policy "ziyarat_pricing_admin_write" on public.ziyarat_pricing
  for all to authenticated using (true) with check (true);

-- ─────────────────────────────────────────────────────────────────────────
-- Seed initial vehicle types & Ziyarat pricing matching reference screen (ADMIN -VEHICLE.png)
-- ─────────────────────────────────────────────────────────────────────────
insert into public.ziyarat_vehicle_types (name, slug, capacity_label, description, display_order)
values
  ('Sedan', 'sedan', 'Up to 4', 'Comfortable for small families', 1),
  ('Staria', 'staria', 'Up to 7', 'Spacious and comfortable', 2),
  ('GMC Yukon / Suburban', 'gmc-yukon-suburban', 'Up to 6', 'Premium and luxurious', 3)
on conflict (slug) do nothing;

insert into public.ziyarat_pricing (city, vehicle_type_id, price_aed)
select 'Makkah', id, case slug when 'sedan' then 300 when 'staria' then 400 when 'gmc-yukon-suburban' then 600 end
from public.ziyarat_vehicle_types
on conflict (city, vehicle_type_id) do nothing;

insert into public.ziyarat_pricing (city, vehicle_type_id, price_aed)
select 'Madinah', id, case slug when 'sedan' then 300 when 'staria' then 400 when 'gmc-yukon-suburban' then 600 end
from public.ziyarat_vehicle_types
on conflict (city, vehicle_type_id) do nothing;
