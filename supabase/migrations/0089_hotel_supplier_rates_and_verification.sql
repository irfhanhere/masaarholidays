-- Migration: 0089_hotel_supplier_rates_and_verification.sql
-- Isolated supplier rates catalog, verified hotel physical locations, walking routes,
-- and GPS coordinates for Masaar Holidays Hotel Catalogue.

-- 1. Create hotel_supplier_rates table
create table if not exists public.hotel_supplier_rates (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels(id) on delete cascade,
  source_document text not null, -- 'Makkah Hotel Rates.pdf' | 'Madinah Hotel Rates 2026-2027.pdf'
  source_page integer not null,
  supplier_name text not null default 'Asfar Al Safwah',
  room_type text not null,
  occupancy text, -- 'Single' | 'Double' | 'Triple' | 'Quad' | 'Family' | 'Suite'
  view_type text, -- 'City View' | 'Haram View' | 'Partial Haram View' | 'Kaaba View'
  board_basis text not null, -- 'Room Only' | 'Breakfast Included' | 'Half Board'
  rate_currency text not null default 'SAR',
  rate_amount numeric(10, 2),
  valid_from date,
  valid_to date,
  period_label text not null,
  weekday_rate numeric(10, 2),
  weekend_rate numeric(10, 2),
  extra_bed_rate numeric(10, 2),
  meal_supplement text,
  rate_notes text,
  verification_status text not null default 'verified',
  last_verified_at timestamptz default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.hotel_supplier_rates is 'Internal B2B supplier rate sheets isolated from public retail hotel records.';
comment on column public.hotel_supplier_rates.rate_currency is 'Native supplier currency (SAR) preserved without automatic markup or currency conversion.';
comment on column public.hotel_supplier_rates.weekday_rate is 'Net weekday rate (Sat-Wed) in supplier currency';
comment on column public.hotel_supplier_rates.weekend_rate is 'Net weekend rate (Thu-Fri) in supplier currency';

create index if not exists idx_hotel_supplier_rates_hotel_id on public.hotel_supplier_rates (hotel_id);
create index if not exists idx_hotel_supplier_rates_source on public.hotel_supplier_rates (source_document, source_page);
create index if not exists idx_hotel_supplier_rates_dates on public.hotel_supplier_rates (valid_from, valid_to);

-- Row Level Security: supplier rates are internal commercial data, not publicly exposed
alter table public.hotel_supplier_rates enable row level security;

drop policy if exists "supplier_rates_admin_all" on public.hotel_supplier_rates;
create policy "supplier_rates_admin_all" on public.hotel_supplier_rates
  for all
  using (auth.role() = 'authenticated' or auth.role() = 'service_role');

-- 2. Add verified physical and location columns to public.hotels
alter table public.hotels
  add column if not exists official_name text,
  add column if not exists verified_address text,
  add column if not exists latitude numeric(10, 7),
  add column if not exists longitude numeric(10, 7),
  add column if not exists walking_route_description text,
  add column if not exists walking_route_incline text default 'flat',
  add column if not exists walking_route_crossings text default 'none',
  add column if not exists walking_route_covered boolean default false,
  add column if not exists walking_gate_destination text,
  add column if not exists hotel_entrance_used text,
  add column if not exists official_website text,
  add column if not exists research_source_url text,
  add column if not exists research_verified_at timestamptz;

comment on column public.hotels.official_name is 'Verified legal / official property name per hotel brand';
comment on column public.hotels.latitude is 'Verified GPS latitude coordinate';
comment on column public.hotels.longitude is 'Verified GPS longitude coordinate';
comment on column public.hotels.walking_route_description is 'Step-by-step route description between hotel entrance and destination mosque gate';
comment on column public.hotels.walking_route_incline is 'flat | gentle_incline | steep_hill | stairs_required';
comment on column public.hotels.walking_route_crossings is 'none | pedestrian_plaza | signalized_road | busy_street';

-- 3. Reload PostgREST schema cache
notify pgrst, 'reload schema';
