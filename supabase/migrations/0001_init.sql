-- Masaar Holidays — initial schema
-- Covers: packages (tiers + Plus upgrades), hotels, transfers, visa content
-- (4 document-set contexts), testimonials (draft/published), enquiries,
-- currency_rates.
--
-- Source of truth for these decisions:
--   masaar-holidays-website-brief.md            (Parts 1, 2, 3, 4, Part 7)
--   masaar-holidays-content-seo-starter-kit.md  (Section 4, item 6)
--
-- Run via `supabase db push`, the Supabase SQL editor, or as a CLI
-- migration once `supabase init` has been run against your project.

-- ─────────────────────────────────────────────────────────────────────────
-- Extensions
-- ─────────────────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ─────────────────────────────────────────────────────────────────────────
-- Shared helpers
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- Enums
-- ─────────────────────────────────────────────────────────────────────────
create type public.package_type as enum ('umrah', 'hajj');

-- Final tier names — brief Part 1 ("replaces all earlier Essential/
-- Signature/Exclusive placeholder language"). "Plus" is an upgrade
-- attached to essential/signature, not its own tier — see package_upgrades.
create type public.package_tier as enum ('essential', 'signature', 'prive');

create type public.publish_status as enum ('draft', 'published');

create type public.enquiry_status as enum ('new', 'viewed', 'contacted', 'closed');

-- The 4 distinct document-set contexts required by brief Part 2 — Umrah
-- package / standalone Umrah visa / Hotel / Hajj each need their own
-- checklist, not one shared list.
create type public.visa_document_context_key as enum (
  'umrah_package',
  'standalone_umrah_visa',
  'hotel',
  'hajj'
);

create type public.testimonial_source as enum ('admin', 'passenger');

create type public.currency_code as enum ('AED', 'INR', 'USD', 'EUR', 'GBP', 'SAR');

-- ─────────────────────────────────────────────────────────────────────────
-- packages
-- ─────────────────────────────────────────────────────────────────────────
create table public.packages (
  id uuid primary key default gen_random_uuid(),
  type public.package_type not null,
  tier public.package_tier not null,
  title text not null,
  slug text not null unique,
  city_destination text, -- e.g. "Makkah", "Makkah / Madinah"
  duration_days integer not null check (duration_days > 0),
  itinerary jsonb not null default '[]'::jsonb, -- [{ day: 1, items: ["..."] }, ...]
  hero_image_url text,
  starting_price_aed numeric(10, 2), -- cached min(package_room_prices.price_aed)
  is_featured boolean not null default false, -- "Most Chosen" emphasis (Signature)
  is_active boolean not null default true, -- Publishing Controls -> Visibility
  show_on_website boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index packages_type_idx on public.packages (type);
create index packages_tier_idx on public.packages (tier);

create trigger packages_set_updated_at
  before update on public.packages
  for each row execute function public.set_updated_at();

-- Room-type pricing for the base package (Quad / Triple / Double, in AED).
create table public.package_room_prices (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.packages (id) on delete cascade,
  room_type text not null, -- e.g. "Quad", "Triple", "Double"
  price_aed numeric(10, 2) not null check (price_aed >= 0),
  is_active boolean not null default true,
  display_order integer not null default 0
);

create index package_room_prices_package_id_idx on public.package_room_prices (package_id);

-- "Essential Plus" / "Signature Plus": an add-on/upgrade attached to a
-- package (brief Part 1) — NOT a separate package_type/tier value, so
-- Haseeb prices and toggles it per package instead of maintaining a
-- duplicate listing.
create table public.package_upgrades (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.packages (id) on delete cascade,
  label text not null, -- e.g. "Essential Plus"
  nights_makkah integer,
  nights_madinah integer,
  transport_note text, -- e.g. "Private Transport"
  support_note text,
  is_active boolean not null default false, -- Haseeb's per-package toggle
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index package_upgrades_one_per_package_idx on public.package_upgrades (package_id);

create trigger package_upgrades_set_updated_at
  before update on public.package_upgrades
  for each row execute function public.set_updated_at();

create table public.package_upgrade_room_prices (
  id uuid primary key default gen_random_uuid(),
  upgrade_id uuid not null references public.package_upgrades (id) on delete cascade,
  room_type text not null,
  price_aed numeric(10, 2) not null check (price_aed >= 0),
  is_active boolean not null default true,
  display_order integer not null default 0
);

create index package_upgrade_room_prices_upgrade_id_idx on public.package_upgrade_room_prices (upgrade_id);

-- ─────────────────────────────────────────────────────────────────────────
-- hotels — sellable standalone AND attachable inside Umrah/Hajj packages
-- (brief Part 3)
-- ─────────────────────────────────────────────────────────────────────────
create table public.hotels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  city text not null, -- "Makkah" | "Madinah" (free text, not enum — extensible)
  category text, -- e.g. "Near-Haram Premium", "Family Suites", "Standard / Budget"
  star_rating smallint check (star_rating between 1 and 5),
  distance_from_haram_meters integer,
  walk_time_minutes integer,
  room_type text,
  board_basis text,
  price_from_aed numeric(10, 2),
  description text,
  image_url text,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index hotels_city_idx on public.hotels (city);

create trigger hotels_set_updated_at
  before update on public.hotels
  for each row execute function public.set_updated_at();

-- Join table: which hotels are attached inside which package's itinerary.
create table public.package_hotels (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.packages (id) on delete cascade,
  hotel_id uuid not null references public.hotels (id) on delete restrict,
  nights integer not null check (nights > 0),
  display_order integer not null default 0,
  unique (package_id, hotel_id)
);

create index package_hotels_package_id_idx on public.package_hotels (package_id);
create index package_hotels_hotel_id_idx on public.package_hotels (hotel_id);

-- ─────────────────────────────────────────────────────────────────────────
-- transfers
-- ─────────────────────────────────────────────────────────────────────────
create table public.transfers (
  id uuid primary key default gen_random_uuid(),
  route_name text not null, -- e.g. "Jeddah Airport -> Makkah"
  slug text not null unique,
  transfer_type text not null default 'other', -- 'airport' | 'train' | 'intercity' | 'other'
  vehicle_type text,
  vehicle_capacity text, -- e.g. "4 Passengers"
  price_from_aed numeric(10, 2),
  description text,
  image_url text,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger transfers_set_updated_at
  before update on public.transfers
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────
-- Visa content — two related but distinct concerns (brief Part 2):
--   1. visa_document_contexts / visa_documents: the document CHECKLISTS,
--      which differ by product (Umrah package / standalone visa / Hotel /
--      Hajj) — do not merge into one generic list.
--   2. visa_types: the six visa/document TYPES shown on the public Visa
--      page (Umrah, UAE, Global, Saudi Tourist, Emirates ID, Indian).
-- ─────────────────────────────────────────────────────────────────────────
create table public.visa_document_contexts (
  id uuid primary key default gen_random_uuid(),
  context_key public.visa_document_context_key not null unique,
  label text not null,
  caveat_text text, -- "Important Information / Caveat" rich text
  updated_at timestamptz not null default now()
);

create trigger visa_document_contexts_set_updated_at
  before update on public.visa_document_contexts
  for each row execute function public.set_updated_at();

create table public.visa_documents (
  id uuid primary key default gen_random_uuid(),
  context_id uuid not null references public.visa_document_contexts (id) on delete cascade,
  title text not null, -- e.g. "Valid Passport"
  description text, -- e.g. "Minimum 6 months validity from intended travel date"
  display_order integer not null default 0
);

create index visa_documents_context_id_idx on public.visa_documents (context_id);

create table public.visa_types (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique, -- e.g. "umrah-visa", "emirates-id"
  name text not null, -- e.g. "Emirates ID"
  description text,
  audience_text text, -- "who it's for"
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger visa_types_set_updated_at
  before update on public.visa_types
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────
-- testimonials (brief Part 4)
-- Hard rule enforced at the application layer, not the DB: no fake
-- testimonials, ever. status defaults to 'draft' so nothing goes live
-- without admin approval regardless of intake path.
-- ─────────────────────────────────────────────────────────────────────────
create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null, -- name format (full/first-name/initials) TBC — brief open item #2
  location text,
  photo_url text,
  rating smallint not null check (rating between 1 and 5),
  testimonial_text text not null,
  service text not null, -- 'Umrah' | 'Hajj' | 'Hotels' | 'Transfers' | 'Visa' | 'General'
  package_id uuid references public.packages (id) on delete set null,
  status public.publish_status not null default 'draft',
  is_featured boolean not null default false,
  display_order integer not null default 0,
  consent_given boolean not null default false,
  consent_notes text,
  submitted_via public.testimonial_source not null default 'admin',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint testimonials_consent_required_to_publish
    check (status <> 'published' or consent_given)
);

create index testimonials_status_idx on public.testimonials (status);

create trigger testimonials_set_updated_at
  before update on public.testimonials
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────
-- enquiries
-- ─────────────────────────────────────────────────────────────────────────
create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  enquiry_type text not null, -- 'Umrah' | 'Hajj' | 'Hotels' | 'Transfers' | 'Visa' | 'General'
  message text,
  number_of_travellers text,
  travel_date text,
  page_source text, -- e.g. "Umrah Packages Page"
  referring_url text,
  status public.enquiry_status not null default 'new',
  internal_notes text,
  received_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index enquiries_status_idx on public.enquiries (status);
create index enquiries_received_at_idx on public.enquiries (received_at desc);

create trigger enquiries_set_updated_at
  before update on public.enquiries
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────
-- currency_rates
-- AED is the base currency; all package/hotel/transfer prices are entered
-- in AED and converted for display using these rates (brief Part 7 — free
-- FX API, daily scheduled Edge Function pull, admin manual-override).
-- ─────────────────────────────────────────────────────────────────────────
create table public.currency_rates (
  currency_code public.currency_code primary key,
  rate_to_aed numeric(12, 6) not null check (rate_to_aed > 0),
  is_base boolean not null default false,
  updated_at timestamptz not null default now()
);

create trigger currency_rates_set_updated_at
  before update on public.currency_rates
  for each row execute function public.set_updated_at();

insert into public.currency_rates (currency_code, rate_to_aed, is_base) values
  ('AED', 1, true),
  ('INR', 22.4820, false),
  ('USD', 0.2723, false),
  ('EUR', 0.2365, false),
  ('GBP', 0.2014, false),
  ('SAR', 1.0000, false);

-- ─────────────────────────────────────────────────────────────────────────
-- Row Level Security
--
-- Phase 1 model (per brief Part 7): only admin/staff sign in via Supabase
-- Auth — there is no public account system yet — so "authenticated" is
-- treated as "admin" for write access. When Phase 2 adds public user
-- accounts (loyalty, user reviews), tighten these write policies to check
-- an explicit admin role/claim instead of auth.uid() alone.
-- ─────────────────────────────────────────────────────────────────────────

-- Public read helper pattern used below:
--   anon + authenticated can SELECT published/active rows
--   only authenticated (admin) can INSERT/UPDATE/DELETE

alter table public.packages enable row level security;
alter table public.package_room_prices enable row level security;
alter table public.package_upgrades enable row level security;
alter table public.package_upgrade_room_prices enable row level security;
alter table public.hotels enable row level security;
alter table public.package_hotels enable row level security;
alter table public.transfers enable row level security;
alter table public.visa_document_contexts enable row level security;
alter table public.visa_documents enable row level security;
alter table public.visa_types enable row level security;
alter table public.testimonials enable row level security;
alter table public.enquiries enable row level security;
alter table public.currency_rates enable row level security;

-- packages
create policy "packages_public_read" on public.packages
  for select using (show_on_website and is_active);
create policy "packages_admin_read" on public.packages
  for select to authenticated using (true);
create policy "packages_admin_write" on public.packages
  for all to authenticated using (true) with check (true);

-- package_room_prices (readable if parent package is publicly visible)
create policy "package_room_prices_public_read" on public.package_room_prices
  for select using (
    is_active and exists (
      select 1 from public.packages p
      where p.id = package_room_prices.package_id
        and p.show_on_website and p.is_active
    )
  );
create policy "package_room_prices_admin_all" on public.package_room_prices
  for all to authenticated using (true) with check (true);

-- package_upgrades
create policy "package_upgrades_public_read" on public.package_upgrades
  for select using (
    is_active and exists (
      select 1 from public.packages p
      where p.id = package_upgrades.package_id
        and p.show_on_website and p.is_active
    )
  );
create policy "package_upgrades_admin_all" on public.package_upgrades
  for all to authenticated using (true) with check (true);

-- package_upgrade_room_prices
create policy "package_upgrade_room_prices_public_read" on public.package_upgrade_room_prices
  for select using (
    is_active and exists (
      select 1 from public.package_upgrades u
      where u.id = package_upgrade_room_prices.upgrade_id and u.is_active
    )
  );
create policy "package_upgrade_room_prices_admin_all" on public.package_upgrade_room_prices
  for all to authenticated using (true) with check (true);

-- hotels
create policy "hotels_public_read" on public.hotels
  for select using (is_active);
create policy "hotels_admin_all" on public.hotels
  for all to authenticated using (true) with check (true);

-- package_hotels
create policy "package_hotels_public_read" on public.package_hotels
  for select using (
    exists (
      select 1 from public.packages p
      where p.id = package_hotels.package_id
        and p.show_on_website and p.is_active
    )
  );
create policy "package_hotels_admin_all" on public.package_hotels
  for all to authenticated using (true) with check (true);

-- transfers
create policy "transfers_public_read" on public.transfers
  for select using (is_active);
create policy "transfers_admin_all" on public.transfers
  for all to authenticated using (true) with check (true);

-- visa content
create policy "visa_document_contexts_public_read" on public.visa_document_contexts
  for select using (true);
create policy "visa_document_contexts_admin_all" on public.visa_document_contexts
  for all to authenticated using (true) with check (true);

create policy "visa_documents_public_read" on public.visa_documents
  for select using (true);
create policy "visa_documents_admin_all" on public.visa_documents
  for all to authenticated using (true) with check (true);

create policy "visa_types_public_read" on public.visa_types
  for select using (is_active);
create policy "visa_types_admin_all" on public.visa_types
  for all to authenticated using (true) with check (true);

-- testimonials — public only ever sees published rows
create policy "testimonials_public_read" on public.testimonials
  for select using (status = 'published');
create policy "testimonials_admin_all" on public.testimonials
  for all to authenticated using (true) with check (true);

-- enquiries — public (anon) can submit but never read/list; only admin can
-- read/manage. This is the passenger-facing contact/enquiry form.
create policy "enquiries_public_insert" on public.enquiries
  for insert to anon, authenticated with check (true);
create policy "enquiries_admin_read" on public.enquiries
  for select to authenticated using (true);
create policy "enquiries_admin_update" on public.enquiries
  for update to authenticated using (true) with check (true);
create policy "enquiries_admin_delete" on public.enquiries
  for delete to authenticated using (true);

-- currency_rates — public read (needed for the currency switcher), admin
-- write; the scheduled daily FX pull runs as the service role and bypasses
-- RLS entirely (see lib/supabase/admin.ts).
create policy "currency_rates_public_read" on public.currency_rates
  for select using (true);
create policy "currency_rates_admin_write" on public.currency_rates
  for update to authenticated using (true) with check (true);
