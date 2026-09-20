-- Migration: 0041_package_alternate_hotel_fields.sql
-- Adds tier-level alternate hotel fields to the packages table so each
-- package tier can offer a choice of two verified hotels per city.
-- All fields are nullable free text, admin-editable via /admin/packages,
-- and synced across duration-variant siblings like primary hotel fields.

alter table public.packages
  add column if not exists makkah_hotel_name_alt text,
  add column if not exists makkah_hotel_note_alt text,
  add column if not exists makkah_hotel_access_tag_alt text,
  add column if not exists madinah_hotel_name_alt text,
  add column if not exists madinah_hotel_note_alt text,
  add column if not exists madinah_hotel_access_tag_alt text;

comment on column public.packages.makkah_hotel_name_alt is
  'Alternate (Option B) hotel name for the Makkah stay, e.g. "Al Kiswah Towers Makkah (or similar)". Tier-level — synced.';

comment on column public.packages.makkah_hotel_note_alt is
  'Proximity/access note for the alternate Makkah hotel. Tier-level — synced.';

comment on column public.packages.makkah_hotel_access_tag_alt is
  'Short access badge for the alternate Makkah hotel. Tier-level — synced.';

comment on column public.packages.madinah_hotel_name_alt is
  'Alternate (Option B) hotel name for the Madinah stay. Tier-level — synced.';

comment on column public.packages.madinah_hotel_note_alt is
  'Proximity/access note for the alternate Madinah hotel. Tier-level — synced.';

comment on column public.packages.madinah_hotel_access_tag_alt is
  'Short access badge for the alternate Madinah hotel. Tier-level — synced.';

-- Seed alternate hotel option notes & access tags for all three Umrah tiers.

-- Essential — Primary: VOCO Makkah / Zowar International Madinah; Alternate: Al Kiswah Towers / Emaar Mektan
update public.packages
set
  makkah_hotel_name_alt        = 'Al Kiswah Towers Makkah (or similar)',
  makkah_hotel_note_alt        = '10 mins via 24/7 hotel shuttle service',
  makkah_hotel_access_tag_alt  = 'Step-free access & 24/7 hotel shuttle service',
  madinah_hotel_name_alt       = 'Emaar Mektan Madinah (or similar)',
  madinah_hotel_note_alt       = '5-min flat walk to King Saud Gate',
  madinah_hotel_access_tag_alt = 'Pedestrian commercial strip approach'
where type = 'umrah' and tier = 'essential';

-- Signature — Primary: Anjum Hotel / Saja by Warwick; Alternate: Jabal Omar Marriott / Crowne Plaza Madinah
update public.packages
set
  makkah_hotel_name_alt        = 'Jabal Omar Marriott (or similar)',
  makkah_hotel_note_alt        = '4-min walk via level pedestrian walkway',
  makkah_hotel_access_tag_alt  = 'Step-free walk through Jabal Omar',
  madinah_hotel_name_alt       = 'Crowne Plaza Madinah (or similar)',
  madinah_hotel_note_alt       = '3-min walk to Bab Al-Malik Fahd',
  madinah_hotel_access_tag_alt = 'Wide, vehicle-free plaza entrance'
where type = 'umrah' and tier = 'signature';

-- Exclusive — Primary: Swissôtel Makkah / Dar Al Taqwa; Alternate: Raffles Makkah Palace / Madinah Hilton
update public.packages
set
  makkah_hotel_name_alt        = 'Raffles Makkah Palace (or similar)',
  makkah_hotel_note_alt        = 'Direct Haram courtyard access, front-row view',
  makkah_hotel_access_tag_alt  = 'Step-free direct courtyard elevators',
  madinah_hotel_name_alt       = 'Madinah Hilton (or similar)',
  madinah_hotel_note_alt       = '2-min flat walk to King Fahd Gate & Gate 25',
  madinah_hotel_access_tag_alt = 'Front-line Bab As-Salam courtyard access'
where type = 'umrah' and (tier = 'exclusive' or tier = 'prive');
