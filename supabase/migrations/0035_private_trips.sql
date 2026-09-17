-- Private Trips & Sightseeing system
-- Allows Masaar administrators to create, edit, publish/draft and manage
-- private trips (Makkah, Madinah, Other) and repeatable itinerary stops.

create table if not exists public.private_trips (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  destination text not null check (destination in ('Makkah', 'Madinah', 'Other')),
  short_description text not null default '',
  duration text not null default '2 – 2.5 hrs',
  trip_type text not null default 'Private Sightseeing',
  featured_image_url text,
  hero_image_url text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  pickup_point text not null default 'hotel_lobby' check (pickup_point in ('hotel_lobby', 'custom', 'both')),
  time_slots jsonb not null default '["7:00 AM", "8:00 AM", "9:00 AM", "2:00 PM", "3:00 PM", "4:00 PM"]'::jsonb,
  important_note text default 'Please be ready in your hotel lobby 10 minutes before the trip starts. Driver will meet you in the lobby.',
  whatsapp_template_key text default 'privateTripEnquiry',
  meta_title text,
  meta_description text,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.private_trips is
  'Private sightseeing experiences and add-on trips available for Masaar travellers.';

create table if not exists public.private_trip_stops (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.private_trips (id) on delete cascade,
  stop_number integer not null,
  stop_name text not null,
  image_url text,
  visit_duration text,
  visit_type text not null default 'Visit' check (visit_type in ('Visit', 'Pass By', 'Pickup', 'Drop Off')),
  short_description text,
  why_it_matters text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.private_trip_stops is
  'Repeatable ordered sightseeing stops belonging to a private trip.';

create index if not exists private_trips_slug_idx on public.private_trips (slug);
create index if not exists private_trips_status_idx on public.private_trips (status);
create index if not exists private_trips_destination_idx on public.private_trips (destination);
create index if not exists private_trip_stops_trip_id_idx on public.private_trip_stops (trip_id, stop_number);

-- Enable RLS
alter table public.private_trips enable row level security;
alter table public.private_trip_stops enable row level security;

-- Public can read only published private trips
create policy "private_trips_public_read" on public.private_trips
  for select
  using (status = 'published');

-- Authenticated admins can manage all private trips
create policy "private_trips_admin_all" on public.private_trips
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Public can read stops for published private trips
create policy "private_trip_stops_public_read" on public.private_trip_stops
  for select
  using (
    exists (
      select 1 from public.private_trips t
      where t.id = private_trip_stops.trip_id
      and t.status = 'published'
    )
  );

-- Authenticated admins can manage all private trip stops
create policy "private_trip_stops_admin_all" on public.private_trip_stops
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
