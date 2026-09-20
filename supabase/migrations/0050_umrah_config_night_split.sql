-- Migration: 0050_umrah_config_night_split.sql
-- Adds explicit makkah_nights/madinah_nights columns to
-- umrah_inventory_configurations so the Makkah+Madinah journey page can
-- read the night split as structured data instead of parsing it out of
-- duration_label (per the new Umrah Journey page spec).
--
-- Backfills the 21 combined ("makkah_madinah") configurations seeded in
-- 0047_umrah_makkah_madinah_configs.sql, matched by their exact
-- duration_label (each total-nights value is unique across the 7 combos,
-- so this is an unambiguous one-time backfill, not a parsing routine).
--
-- Apply manually in Supabase SQL Editor.

alter table public.umrah_inventory_configurations
  add column if not exists makkah_nights integer,
  add column if not exists madinah_nights integer;

comment on column public.umrah_inventory_configurations.makkah_nights is
  'Nights spent in Makkah for a makkah_madinah journey — structured data, not derived from duration_label. Null for makkah_only configs.';
comment on column public.umrah_inventory_configurations.madinah_nights is
  'Nights spent in Madinah for a makkah_madinah journey — structured data, not derived from duration_label. Null for makkah_only configs.';

update public.umrah_inventory_configurations
set makkah_nights = 2, madinah_nights = 2
where journey_type = 'makkah_madinah' and duration_label like '4 Nights / 5 Days%';

update public.umrah_inventory_configurations
set makkah_nights = 3, madinah_nights = 2
where journey_type = 'makkah_madinah' and duration_label like '5 Nights / 6 Days%';

update public.umrah_inventory_configurations
set makkah_nights = 3, madinah_nights = 3
where journey_type = 'makkah_madinah' and duration_label like '6 Nights / 7 Days%';

update public.umrah_inventory_configurations
set makkah_nights = 4, madinah_nights = 3
where journey_type = 'makkah_madinah' and duration_label like '7 Nights / 8 Days%';

update public.umrah_inventory_configurations
set makkah_nights = 4, madinah_nights = 4
where journey_type = 'makkah_madinah' and duration_label like '8 Nights / 9 Days%';

update public.umrah_inventory_configurations
set makkah_nights = 5, madinah_nights = 4
where journey_type = 'makkah_madinah' and duration_label like '9 Nights / 10 Days%';

update public.umrah_inventory_configurations
set makkah_nights = 5, madinah_nights = 5
where journey_type = 'makkah_madinah' and duration_label like '10 Nights / 11 Days%';
