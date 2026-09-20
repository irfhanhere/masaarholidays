-- Migration: 0058_fix_addon_ziyarat_slug_backfill.sql
-- 0057's backfill checked key_slug = 'makkah-ziyarat' / 'madinah-ziyarat'
-- (hyphens), but the actual seeded rows (0043_inclusions_addons_catalog.sql)
-- use underscores: 'makkah_ziyarat' / 'madinah_ziyarat'. That mismatch meant
-- 0057 added the private_trip_id column but linked nothing. This corrects
-- the backfill with the real slugs.
--
-- Apply manually in Supabase SQL Editor.

update public.package_addons_catalog addon
set private_trip_id = trip.id
from public.private_trips trip
where addon.private_trip_id is null
  and (
    (addon.key_slug = 'makkah_ziyarat' and trip.destination = 'Makkah')
    or (addon.key_slug = 'madinah_ziyarat' and trip.destination = 'Madinah')
  );
