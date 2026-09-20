-- Migration: 0040_package_hotel_route_fields.sql
-- Adds tier-level route line and per-hotel display fields to the packages table
-- for the redesigned package card (route strip + hotel proximity notes section).
-- All fields are nullable free text, admin-editable via /admin/packages,
-- and synced across duration-variant siblings exactly like tagline/short_description.
--
-- Apply in Supabase SQL Editor (do not auto-execute).

-- Schema additions
alter table public.packages
  add column if not exists route_line text,
  add column if not exists makkah_hotel_name text,
  add column if not exists makkah_hotel_note text,
  add column if not exists makkah_hotel_access_tag text,
  add column if not exists madinah_hotel_name text,
  add column if not exists madinah_hotel_note text,
  add column if not exists madinah_hotel_access_tag text;

comment on column public.packages.route_line is
  'Transfer route strip on the package card, e.g. "Jeddah Airport -> Makkah Hotel -> Madinah Hotel -> Madinah Airport". Tier-level — synced across duration variants.';

comment on column public.packages.makkah_hotel_name is
  'Hotel name shown in the package card hotel-notes section for the Makkah stay, e.g. "VOCO Makkah (or similar)". Tier-level — synced.';

comment on column public.packages.makkah_hotel_note is
  'Proximity/access note for the Makkah hotel. IMPORTANT: Never describe the hotel-to-Haram shuttle as "private" — it is a complimentary hotel facility shared by all guests. Use "complimentary shuttle" or "24/7 hotel shuttle service". Airport/hotel transfer legs ARE private and can be described as such. Tier-level — synced.';

comment on column public.packages.makkah_hotel_access_tag is
  'Short access badge for the Makkah hotel, e.g. "Step-free access & shuttle service". Tier-level — synced.';

comment on column public.packages.madinah_hotel_name is
  'Hotel name for the Madinah stay. Tier-level — synced.';

comment on column public.packages.madinah_hotel_note is
  'Proximity/access note for the Madinah hotel, e.g. "4-min flat walk to Northern Courtyard". Tier-level — synced.';

comment on column public.packages.madinah_hotel_access_tag is
  'Short access badge for the Madinah hotel, e.g. "Level, pedestrian-only pathway". Tier-level — synced.';

-- Known duplication note:
-- The hotels table already stores rich proximity data per hotel row
-- (walk_time_minutes, terrain_note, shuttle_note, accessibility_note, etc.).
-- These columns duplicate a subset of that at the package-tier level, meaning a
-- hotel access-policy change must be updated in two places. Future pass: add
-- packages.makkah_hotel_id -> hotels.id (and madinah_hotel_id) and derive the
-- card note from the hotel row to eliminate the duplication.

-- Seed route_line for all Umrah tiers (same airport legs for all tiers).
update public.packages
set route_line = 'Jeddah Airport -> Makkah Hotel -> Madinah Hotel -> Madinah Airport'
where type = 'umrah';

-- Seed hotel notes & access tags for all three Umrah tiers.

-- Essential — VOCO Makkah confirmed by client.
-- Per client instruction: the VOCO Makkah shuttle to the Haram is a complimentary
-- hotel facility for all guests, NOT a private/dedicated transfer. Use "complimentary
-- shuttle" or "24/7 hotel shuttle service" — never "private shuttle."
-- Airport-to-hotel and hotel-to-hotel legs are private cars and described as such.
update public.packages
set
  makkah_hotel_name        = 'VOCO Makkah (or similar)',
  makkah_hotel_note        = '8 mins via complimentary shuttle / 25-min walk',
  makkah_hotel_access_tag  = 'Step-free access & 24/7 hotel shuttle service',
  madinah_hotel_name       = 'Zowar International Madinah',
  madinah_hotel_note       = '4-min flat walk to Northern Courtyard',
  madinah_hotel_access_tag = 'Level, pedestrian-only pathway'
where type = 'umrah' and tier = 'essential';

-- Signature — Anjum Hotel Makkah & Saja by Warwick Madinah (Comfort & Convenience)
update public.packages
set
  makkah_hotel_name        = 'Anjum Hotel Makkah (or similar)',
  makkah_hotel_note        = '5-min walk via flat pedestrian bridge to King Fahd Gate',
  makkah_hotel_access_tag  = 'Direct pedestrian bridge access to Haram plaza',
  madinah_hotel_name       = 'Saja by Warwick Madinah (or similar)',
  madinah_hotel_note       = '5-min flat walk to Gate 328',
  madinah_hotel_access_tag = 'Level, vehicle-free courtyard approach'
where type = 'umrah' and tier = 'signature';

-- Exclusive — Swissôtel Makkah & Dar Al Taqwa Madinah (Luxury & Proximity)
update public.packages
set
  makkah_hotel_name        = 'Swissôtel Makkah (or similar)',
  makkah_hotel_note        = 'Direct Haram courtyard access via Abraj Al Bait',
  makkah_hotel_access_tag  = 'Zero-distance elevators to Haram plaza',
  madinah_hotel_name       = 'Dar Al Taqwa Madinah (or similar)',
  madinah_hotel_note       = '2-min walk directly opposite King Fahd Gate (23)',
  madinah_hotel_access_tag = 'Front-line Haram courtyard entrance'
where type = 'umrah' and (tier = 'exclusive' or tier = 'prive');