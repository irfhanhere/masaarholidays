-- Migration: 0047_umrah_makkah_madinah_configs.sql
-- Adds "Zowar International Hotel" and "Millennium Taiba Hotel" as minimal
-- hotel records (name/slug/city only -- no verified distance, terrain or
-- star-rating data exists for either, so none is invented; seeded inactive
-- like other not-yet-reviewed hotels, e.g. 0003_seed_makkah_hotels.sql),
-- then seeds the Makkah + Madinah combined inventory configurations for all
-- three Umrah tiers using the exact figures from the client's spec (item 9,
-- "Detailed pricing page" table).
--
-- Exclusive's Madinah hotel (InterContinental Dar Al Hijra Madinah) already
-- exists and is reused as-is.
--
-- Idempotent: hotel inserts use ON CONFLICT (slug) DO NOTHING; inventory
-- configuration inserts only fire if a matching package_id + journey_type +
-- duration_label doesn't already exist.
--
-- Apply manually in Supabase SQL Editor.

-- ─────────────────────────────────────────────────────────────────────────
-- New Madinah hotel records (minimal — no invented walk/terrain/rating data)
-- ─────────────────────────────────────────────────────────────────────────
insert into public.hotels (name, slug, city, is_active) values
  ('Zowar International Hotel', 'zowar-international', 'Madinah', false),
  ('Millennium Taiba Hotel', 'millennium-taiba', 'Madinah', false)
on conflict (slug) do nothing;

-- ─────────────────────────────────────────────────────────────────────────
-- ESSENTIAL — Makkah + Madinah Combined Package
-- ─────────────────────────────────────────────────────────────────────────

-- 2+2 (4N/5D)
with cfg as (
  insert into public.umrah_inventory_configurations
    (package_id, journey_type, duration_nights, duration_days, duration_label, makkah_hotel_id, makkah_allow_similar, madinah_hotel_id, madinah_allow_similar, makkah_custom_note, madinah_custom_note, status, display_order)
  select
    (select id from public.packages where type = 'umrah' and slug = 'umrah-essential-placeholder'),
    'makkah_madinah', 4, 5, '4 Nights / 5 Days (2N Makkah + 2N Madinah)',
    (select id from public.hotels where slug = 'voco-makkah'),
    true,
    (select id from public.hotels where slug = 'zowar-international'),
    true,
    '2 nights in Makkah', '2 nights in Madinah',
    'published', 30
  where not exists (
    select 1 from public.umrah_inventory_configurations c
    join public.packages p on p.id = c.package_id
    where p.slug = 'umrah-essential-placeholder' and c.journey_type = 'makkah_madinah' and c.duration_label = '4 Nights / 5 Days (2N Makkah + 2N Madinah)'
  )
  returning id
)
insert into public.umrah_configuration_room_prices (configuration_id, occupancy_type, price_aed, display_order)
select cfg.id, v.occupancy_type, v.price_aed, v.display_order
from cfg, (values ('Double', 1763, 1), ('Triple', 1390, 2), ('Quad', 1141, 3)) as v(occupancy_type, price_aed, display_order)
on conflict (configuration_id, occupancy_type) do nothing;

-- 3+2 (5N/6D)
with cfg as (
  insert into public.umrah_inventory_configurations
    (package_id, journey_type, duration_nights, duration_days, duration_label, makkah_hotel_id, makkah_allow_similar, madinah_hotel_id, madinah_allow_similar, makkah_custom_note, madinah_custom_note, status, display_order)
  select
    (select id from public.packages where type = 'umrah' and slug = 'umrah-essential-placeholder'),
    'makkah_madinah', 5, 6, '5 Nights / 6 Days (3N Makkah + 2N Madinah)',
    (select id from public.hotels where slug = 'voco-makkah'),
    true,
    (select id from public.hotels where slug = 'zowar-international'),
    true,
    '3 nights in Makkah', '2 nights in Madinah',
    'published', 31
  where not exists (
    select 1 from public.umrah_inventory_configurations c
    join public.packages p on p.id = c.package_id
    where p.slug = 'umrah-essential-placeholder' and c.journey_type = 'makkah_madinah' and c.duration_label = '5 Nights / 6 Days (3N Makkah + 2N Madinah)'
  )
  returning id
)
insert into public.umrah_configuration_room_prices (configuration_id, occupancy_type, price_aed, display_order)
select cfg.id, v.occupancy_type, v.price_aed, v.display_order
from cfg, (values ('Double', 1913, 1), ('Triple', 1490, 2), ('Quad', 1216, 3)) as v(occupancy_type, price_aed, display_order)
on conflict (configuration_id, occupancy_type) do nothing;

-- 3+3 (6N/7D)
with cfg as (
  insert into public.umrah_inventory_configurations
    (package_id, journey_type, duration_nights, duration_days, duration_label, makkah_hotel_id, makkah_allow_similar, madinah_hotel_id, madinah_allow_similar, makkah_custom_note, madinah_custom_note, status, display_order)
  select
    (select id from public.packages where type = 'umrah' and slug = 'umrah-essential-placeholder'),
    'makkah_madinah', 6, 7, '6 Nights / 7 Days (3N Makkah + 3N Madinah)',
    (select id from public.hotels where slug = 'voco-makkah'),
    true,
    (select id from public.hotels where slug = 'zowar-international'),
    true,
    '3 nights in Makkah', '3 nights in Madinah',
    'published', 32
  where not exists (
    select 1 from public.umrah_inventory_configurations c
    join public.packages p on p.id = c.package_id
    where p.slug = 'umrah-essential-placeholder' and c.journey_type = 'makkah_madinah' and c.duration_label = '6 Nights / 7 Days (3N Makkah + 3N Madinah)'
  )
  returning id
)
insert into public.umrah_configuration_room_prices (configuration_id, occupancy_type, price_aed, display_order)
select cfg.id, v.occupancy_type, v.price_aed, v.display_order
from cfg, (values ('Double', 2263, 1), ('Triple', 1743, 2), ('Quad', 1416, 3)) as v(occupancy_type, price_aed, display_order)
on conflict (configuration_id, occupancy_type) do nothing;

-- 4+3 (7N/8D)
with cfg as (
  insert into public.umrah_inventory_configurations
    (package_id, journey_type, duration_nights, duration_days, duration_label, makkah_hotel_id, makkah_allow_similar, madinah_hotel_id, madinah_allow_similar, makkah_custom_note, madinah_custom_note, status, display_order)
  select
    (select id from public.packages where type = 'umrah' and slug = 'umrah-essential-placeholder'),
    'makkah_madinah', 7, 8, '7 Nights / 8 Days (4N Makkah + 3N Madinah)',
    (select id from public.hotels where slug = 'voco-makkah'),
    true,
    (select id from public.hotels where slug = 'zowar-international'),
    true,
    '4 nights in Makkah', '3 nights in Madinah',
    'published', 33
  where not exists (
    select 1 from public.umrah_inventory_configurations c
    join public.packages p on p.id = c.package_id
    where p.slug = 'umrah-essential-placeholder' and c.journey_type = 'makkah_madinah' and c.duration_label = '7 Nights / 8 Days (4N Makkah + 3N Madinah)'
  )
  returning id
)
insert into public.umrah_configuration_room_prices (configuration_id, occupancy_type, price_aed, display_order)
select cfg.id, v.occupancy_type, v.price_aed, v.display_order
from cfg, (values ('Double', 2413, 1), ('Triple', 1843, 2), ('Quad', 1491, 3)) as v(occupancy_type, price_aed, display_order)
on conflict (configuration_id, occupancy_type) do nothing;

-- 4+4 (8N/9D)
with cfg as (
  insert into public.umrah_inventory_configurations
    (package_id, journey_type, duration_nights, duration_days, duration_label, makkah_hotel_id, makkah_allow_similar, madinah_hotel_id, madinah_allow_similar, makkah_custom_note, madinah_custom_note, status, display_order)
  select
    (select id from public.packages where type = 'umrah' and slug = 'umrah-essential-placeholder'),
    'makkah_madinah', 8, 9, '8 Nights / 9 Days (4N Makkah + 4N Madinah)',
    (select id from public.hotels where slug = 'voco-makkah'),
    true,
    (select id from public.hotels where slug = 'zowar-international'),
    true,
    '4 nights in Makkah', '4 nights in Madinah',
    'published', 34
  where not exists (
    select 1 from public.umrah_inventory_configurations c
    join public.packages p on p.id = c.package_id
    where p.slug = 'umrah-essential-placeholder' and c.journey_type = 'makkah_madinah' and c.duration_label = '8 Nights / 9 Days (4N Makkah + 4N Madinah)'
  )
  returning id
)
insert into public.umrah_configuration_room_prices (configuration_id, occupancy_type, price_aed, display_order)
select cfg.id, v.occupancy_type, v.price_aed, v.display_order
from cfg, (values ('Double', 2763, 1), ('Triple', 2096, 2), ('Quad', 1691, 3)) as v(occupancy_type, price_aed, display_order)
on conflict (configuration_id, occupancy_type) do nothing;

-- 5+4 (9N/10D)
with cfg as (
  insert into public.umrah_inventory_configurations
    (package_id, journey_type, duration_nights, duration_days, duration_label, makkah_hotel_id, makkah_allow_similar, madinah_hotel_id, madinah_allow_similar, makkah_custom_note, madinah_custom_note, status, display_order)
  select
    (select id from public.packages where type = 'umrah' and slug = 'umrah-essential-placeholder'),
    'makkah_madinah', 9, 10, '9 Nights / 10 Days (5N Makkah + 4N Madinah)',
    (select id from public.hotels where slug = 'voco-makkah'),
    true,
    (select id from public.hotels where slug = 'zowar-international'),
    true,
    '5 nights in Makkah', '4 nights in Madinah',
    'published', 35
  where not exists (
    select 1 from public.umrah_inventory_configurations c
    join public.packages p on p.id = c.package_id
    where p.slug = 'umrah-essential-placeholder' and c.journey_type = 'makkah_madinah' and c.duration_label = '9 Nights / 10 Days (5N Makkah + 4N Madinah)'
  )
  returning id
)
insert into public.umrah_configuration_room_prices (configuration_id, occupancy_type, price_aed, display_order)
select cfg.id, v.occupancy_type, v.price_aed, v.display_order
from cfg, (values ('Double', 2913, 1), ('Triple', 2196, 2), ('Quad', 1766, 3)) as v(occupancy_type, price_aed, display_order)
on conflict (configuration_id, occupancy_type) do nothing;

-- 5+5 (10N/11D)
with cfg as (
  insert into public.umrah_inventory_configurations
    (package_id, journey_type, duration_nights, duration_days, duration_label, makkah_hotel_id, makkah_allow_similar, madinah_hotel_id, madinah_allow_similar, makkah_custom_note, madinah_custom_note, status, display_order)
  select
    (select id from public.packages where type = 'umrah' and slug = 'umrah-essential-placeholder'),
    'makkah_madinah', 10, 11, '10 Nights / 11 Days (5N Makkah + 5N Madinah)',
    (select id from public.hotels where slug = 'voco-makkah'),
    true,
    (select id from public.hotels where slug = 'zowar-international'),
    true,
    '5 nights in Makkah', '5 nights in Madinah',
    'published', 36
  where not exists (
    select 1 from public.umrah_inventory_configurations c
    join public.packages p on p.id = c.package_id
    where p.slug = 'umrah-essential-placeholder' and c.journey_type = 'makkah_madinah' and c.duration_label = '10 Nights / 11 Days (5N Makkah + 5N Madinah)'
  )
  returning id
)
insert into public.umrah_configuration_room_prices (configuration_id, occupancy_type, price_aed, display_order)
select cfg.id, v.occupancy_type, v.price_aed, v.display_order
from cfg, (values ('Double', 3263, 1), ('Triple', 2449, 2), ('Quad', 1966, 3)) as v(occupancy_type, price_aed, display_order)
on conflict (configuration_id, occupancy_type) do nothing;

-- ─────────────────────────────────────────────────────────────────────────
-- SIGNATURE — Makkah + Madinah Combined Package
-- ─────────────────────────────────────────────────────────────────────────

-- 2+2 (4N/5D)
with cfg as (
  insert into public.umrah_inventory_configurations
    (package_id, journey_type, duration_nights, duration_days, duration_label, makkah_hotel_id, makkah_allow_similar, madinah_hotel_id, madinah_allow_similar, makkah_custom_note, madinah_custom_note, status, display_order)
  select
    (select id from public.packages where type = 'umrah' and slug = 'umrah-signature-placeholder'),
    'makkah_madinah', 4, 5, '4 Nights / 5 Days (2N Makkah + 2N Madinah)',
    (select id from public.hotels where slug = 'jabal-omar-marriott'),
    true,
    (select id from public.hotels where slug = 'millennium-taiba'),
    true,
    '2 nights in Makkah', '2 nights in Madinah',
    'published', 40
  where not exists (
    select 1 from public.umrah_inventory_configurations c
    join public.packages p on p.id = c.package_id
    where p.slug = 'umrah-signature-placeholder' and c.journey_type = 'makkah_madinah' and c.duration_label = '4 Nights / 5 Days (2N Makkah + 2N Madinah)'
  )
  returning id
)
insert into public.umrah_configuration_room_prices (configuration_id, occupancy_type, price_aed, display_order)
select cfg.id, v.occupancy_type, v.price_aed, v.display_order
from cfg, (values ('Double', 2433, 1), ('Triple', 1863, 2), ('Quad', 1577, 3)) as v(occupancy_type, price_aed, display_order)
on conflict (configuration_id, occupancy_type) do nothing;

-- 3+2 (5N/6D)
with cfg as (
  insert into public.umrah_inventory_configurations
    (package_id, journey_type, duration_nights, duration_days, duration_label, makkah_hotel_id, makkah_allow_similar, madinah_hotel_id, madinah_allow_similar, makkah_custom_note, madinah_custom_note, status, display_order)
  select
    (select id from public.packages where type = 'umrah' and slug = 'umrah-signature-placeholder'),
    'makkah_madinah', 5, 6, '5 Nights / 6 Days (3N Makkah + 2N Madinah)',
    (select id from public.hotels where slug = 'jabal-omar-marriott'),
    true,
    (select id from public.hotels where slug = 'millennium-taiba'),
    true,
    '3 nights in Makkah', '2 nights in Madinah',
    'published', 41
  where not exists (
    select 1 from public.umrah_inventory_configurations c
    join public.packages p on p.id = c.package_id
    where p.slug = 'umrah-signature-placeholder' and c.journey_type = 'makkah_madinah' and c.duration_label = '5 Nights / 6 Days (3N Makkah + 2N Madinah)'
  )
  returning id
)
insert into public.umrah_configuration_room_prices (configuration_id, occupancy_type, price_aed, display_order)
select cfg.id, v.occupancy_type, v.price_aed, v.display_order
from cfg, (values ('Double', 2808, 1), ('Triple', 2180, 2), ('Quad', 1840, 3)) as v(occupancy_type, price_aed, display_order)
on conflict (configuration_id, occupancy_type) do nothing;

-- 3+3 (6N/7D)
with cfg as (
  insert into public.umrah_inventory_configurations
    (package_id, journey_type, duration_nights, duration_days, duration_label, makkah_hotel_id, makkah_allow_similar, madinah_hotel_id, madinah_allow_similar, makkah_custom_note, madinah_custom_note, status, display_order)
  select
    (select id from public.packages where type = 'umrah' and slug = 'umrah-signature-placeholder'),
    'makkah_madinah', 6, 7, '6 Nights / 7 Days (3N Makkah + 3N Madinah)',
    (select id from public.hotels where slug = 'jabal-omar-marriott'),
    true,
    (select id from public.hotels where slug = 'millennium-taiba'),
    true,
    '3 nights in Makkah', '3 nights in Madinah',
    'published', 42
  where not exists (
    select 1 from public.umrah_inventory_configurations c
    join public.packages p on p.id = c.package_id
    where p.slug = 'umrah-signature-placeholder' and c.journey_type = 'makkah_madinah' and c.duration_label = '6 Nights / 7 Days (3N Makkah + 3N Madinah)'
  )
  returning id
)
insert into public.umrah_configuration_room_prices (configuration_id, occupancy_type, price_aed, display_order)
select cfg.id, v.occupancy_type, v.price_aed, v.display_order
from cfg, (values ('Double', 3478, 1), ('Triple', 2627, 2), ('Quad', 2217, 3)) as v(occupancy_type, price_aed, display_order)
on conflict (configuration_id, occupancy_type) do nothing;

-- 4+3 (7N/8D)
with cfg as (
  insert into public.umrah_inventory_configurations
    (package_id, journey_type, duration_nights, duration_days, duration_label, makkah_hotel_id, makkah_allow_similar, madinah_hotel_id, madinah_allow_similar, makkah_custom_note, madinah_custom_note, status, display_order)
  select
    (select id from public.packages where type = 'umrah' and slug = 'umrah-signature-placeholder'),
    'makkah_madinah', 7, 8, '7 Nights / 8 Days (4N Makkah + 3N Madinah)',
    (select id from public.hotels where slug = 'jabal-omar-marriott'),
    true,
    (select id from public.hotels where slug = 'millennium-taiba'),
    true,
    '4 nights in Makkah', '3 nights in Madinah',
    'published', 43
  where not exists (
    select 1 from public.umrah_inventory_configurations c
    join public.packages p on p.id = c.package_id
    where p.slug = 'umrah-signature-placeholder' and c.journey_type = 'makkah_madinah' and c.duration_label = '7 Nights / 8 Days (4N Makkah + 3N Madinah)'
  )
  returning id
)
insert into public.umrah_configuration_room_prices (configuration_id, occupancy_type, price_aed, display_order)
select cfg.id, v.occupancy_type, v.price_aed, v.display_order
from cfg, (values ('Double', 3853, 1), ('Triple', 2943, 2), ('Quad', 2480, 3)) as v(occupancy_type, price_aed, display_order)
on conflict (configuration_id, occupancy_type) do nothing;

-- 4+4 (8N/9D)
with cfg as (
  insert into public.umrah_inventory_configurations
    (package_id, journey_type, duration_nights, duration_days, duration_label, makkah_hotel_id, makkah_allow_similar, madinah_hotel_id, madinah_allow_similar, makkah_custom_note, madinah_custom_note, status, display_order)
  select
    (select id from public.packages where type = 'umrah' and slug = 'umrah-signature-placeholder'),
    'makkah_madinah', 8, 9, '8 Nights / 9 Days (4N Makkah + 4N Madinah)',
    (select id from public.hotels where slug = 'jabal-omar-marriott'),
    true,
    (select id from public.hotels where slug = 'millennium-taiba'),
    true,
    '4 nights in Makkah', '4 nights in Madinah',
    'published', 44
  where not exists (
    select 1 from public.umrah_inventory_configurations c
    join public.packages p on p.id = c.package_id
    where p.slug = 'umrah-signature-placeholder' and c.journey_type = 'makkah_madinah' and c.duration_label = '8 Nights / 9 Days (4N Makkah + 4N Madinah)'
  )
  returning id
)
insert into public.umrah_configuration_room_prices (configuration_id, occupancy_type, price_aed, display_order)
select cfg.id, v.occupancy_type, v.price_aed, v.display_order
from cfg, (values ('Double', 4523, 1), ('Triple', 3390, 2), ('Quad', 2857, 3)) as v(occupancy_type, price_aed, display_order)
on conflict (configuration_id, occupancy_type) do nothing;

-- 5+4 (9N/10D)
with cfg as (
  insert into public.umrah_inventory_configurations
    (package_id, journey_type, duration_nights, duration_days, duration_label, makkah_hotel_id, makkah_allow_similar, madinah_hotel_id, madinah_allow_similar, makkah_custom_note, madinah_custom_note, status, display_order)
  select
    (select id from public.packages where type = 'umrah' and slug = 'umrah-signature-placeholder'),
    'makkah_madinah', 9, 10, '9 Nights / 10 Days (5N Makkah + 4N Madinah)',
    (select id from public.hotels where slug = 'jabal-omar-marriott'),
    true,
    (select id from public.hotels where slug = 'millennium-taiba'),
    true,
    '5 nights in Makkah', '4 nights in Madinah',
    'published', 45
  where not exists (
    select 1 from public.umrah_inventory_configurations c
    join public.packages p on p.id = c.package_id
    where p.slug = 'umrah-signature-placeholder' and c.journey_type = 'makkah_madinah' and c.duration_label = '9 Nights / 10 Days (5N Makkah + 4N Madinah)'
  )
  returning id
)
insert into public.umrah_configuration_room_prices (configuration_id, occupancy_type, price_aed, display_order)
select cfg.id, v.occupancy_type, v.price_aed, v.display_order
from cfg, (values ('Double', 4898, 1), ('Triple', 3707, 2), ('Quad', 3120, 3)) as v(occupancy_type, price_aed, display_order)
on conflict (configuration_id, occupancy_type) do nothing;

-- 5+5 (10N/11D)
with cfg as (
  insert into public.umrah_inventory_configurations
    (package_id, journey_type, duration_nights, duration_days, duration_label, makkah_hotel_id, makkah_allow_similar, madinah_hotel_id, madinah_allow_similar, makkah_custom_note, madinah_custom_note, status, display_order)
  select
    (select id from public.packages where type = 'umrah' and slug = 'umrah-signature-placeholder'),
    'makkah_madinah', 10, 11, '10 Nights / 11 Days (5N Makkah + 5N Madinah)',
    (select id from public.hotels where slug = 'jabal-omar-marriott'),
    true,
    (select id from public.hotels where slug = 'millennium-taiba'),
    true,
    '5 nights in Makkah', '5 nights in Madinah',
    'published', 46
  where not exists (
    select 1 from public.umrah_inventory_configurations c
    join public.packages p on p.id = c.package_id
    where p.slug = 'umrah-signature-placeholder' and c.journey_type = 'makkah_madinah' and c.duration_label = '10 Nights / 11 Days (5N Makkah + 5N Madinah)'
  )
  returning id
)
insert into public.umrah_configuration_room_prices (configuration_id, occupancy_type, price_aed, display_order)
select cfg.id, v.occupancy_type, v.price_aed, v.display_order
from cfg, (values ('Double', 5568, 1), ('Triple', 4153, 2), ('Quad', 3497, 3)) as v(occupancy_type, price_aed, display_order)
on conflict (configuration_id, occupancy_type) do nothing;

-- ─────────────────────────────────────────────────────────────────────────
-- EXCLUSIVE — Makkah + Madinah Combined Package
-- ─────────────────────────────────────────────────────────────────────────

-- 2+2 (4N/5D)
with cfg as (
  insert into public.umrah_inventory_configurations
    (package_id, journey_type, duration_nights, duration_days, duration_label, makkah_hotel_id, makkah_allow_similar, madinah_hotel_id, madinah_allow_similar, makkah_custom_note, madinah_custom_note, status, display_order)
  select
    (select id from public.packages where type = 'umrah' and slug = 'umrah-exclusive-placeholder'),
    'makkah_madinah', 4, 5, '4 Nights / 5 Days (2N Makkah + 2N Madinah)',
    (select id from public.hotels where slug = 'intercontinental-dar-al-tawhid'),
    true,
    (select id from public.hotels where slug = 'intercontinental-dar-al-hijra-madinah'),
    true,
    '2 nights in Makkah', '2 nights in Madinah',
    'published', 50
  where not exists (
    select 1 from public.umrah_inventory_configurations c
    join public.packages p on p.id = c.package_id
    where p.slug = 'umrah-exclusive-placeholder' and c.journey_type = 'makkah_madinah' and c.duration_label = '4 Nights / 5 Days (2N Makkah + 2N Madinah)'
  )
  returning id
)
insert into public.umrah_configuration_room_prices (configuration_id, occupancy_type, price_aed, display_order)
select cfg.id, v.occupancy_type, v.price_aed, v.display_order
from cfg, (values ('Double', 3623, 1), ('Triple', 2780, 2), ('Quad', 2352, 3)) as v(occupancy_type, price_aed, display_order)
on conflict (configuration_id, occupancy_type) do nothing;

-- 3+2 (5N/6D)
with cfg as (
  insert into public.umrah_inventory_configurations
    (package_id, journey_type, duration_nights, duration_days, duration_label, makkah_hotel_id, makkah_allow_similar, madinah_hotel_id, madinah_allow_similar, makkah_custom_note, madinah_custom_note, status, display_order)
  select
    (select id from public.packages where type = 'umrah' and slug = 'umrah-exclusive-placeholder'),
    'makkah_madinah', 5, 6, '5 Nights / 6 Days (3N Makkah + 2N Madinah)',
    (select id from public.hotels where slug = 'intercontinental-dar-al-tawhid'),
    true,
    (select id from public.hotels where slug = 'intercontinental-dar-al-hijra-madinah'),
    true,
    '3 nights in Makkah', '2 nights in Madinah',
    'published', 51
  where not exists (
    select 1 from public.umrah_inventory_configurations c
    join public.packages p on p.id = c.package_id
    where p.slug = 'umrah-exclusive-placeholder' and c.journey_type = 'makkah_madinah' and c.duration_label = '5 Nights / 6 Days (3N Makkah + 2N Madinah)'
  )
  returning id
)
insert into public.umrah_configuration_room_prices (configuration_id, occupancy_type, price_aed, display_order)
select cfg.id, v.occupancy_type, v.price_aed, v.display_order
from cfg, (values ('Double', 4498, 1), ('Triple', 3497, 2), ('Quad', 2965, 3)) as v(occupancy_type, price_aed, display_order)
on conflict (configuration_id, occupancy_type) do nothing;

-- 3+3 (6N/7D)
with cfg as (
  insert into public.umrah_inventory_configurations
    (package_id, journey_type, duration_nights, duration_days, duration_label, makkah_hotel_id, makkah_allow_similar, madinah_hotel_id, madinah_allow_similar, makkah_custom_note, madinah_custom_note, status, display_order)
  select
    (select id from public.packages where type = 'umrah' and slug = 'umrah-exclusive-placeholder'),
    'makkah_madinah', 6, 7, '6 Nights / 7 Days (3N Makkah + 3N Madinah)',
    (select id from public.hotels where slug = 'intercontinental-dar-al-tawhid'),
    true,
    (select id from public.hotels where slug = 'intercontinental-dar-al-hijra-madinah'),
    true,
    '3 nights in Makkah', '3 nights in Madinah',
    'published', 52
  where not exists (
    select 1 from public.umrah_inventory_configurations c
    join public.packages p on p.id = c.package_id
    where p.slug = 'umrah-exclusive-placeholder' and c.journey_type = 'makkah_madinah' and c.duration_label = '6 Nights / 7 Days (3N Makkah + 3N Madinah)'
  )
  returning id
)
insert into public.umrah_configuration_room_prices (configuration_id, occupancy_type, price_aed, display_order)
select cfg.id, v.occupancy_type, v.price_aed, v.display_order
from cfg, (values ('Double', 5358, 1), ('Triple', 4124, 2), ('Quad', 3495, 3)) as v(occupancy_type, price_aed, display_order)
on conflict (configuration_id, occupancy_type) do nothing;

-- 4+3 (7N/8D)
with cfg as (
  insert into public.umrah_inventory_configurations
    (package_id, journey_type, duration_nights, duration_days, duration_label, makkah_hotel_id, makkah_allow_similar, madinah_hotel_id, madinah_allow_similar, makkah_custom_note, madinah_custom_note, status, display_order)
  select
    (select id from public.packages where type = 'umrah' and slug = 'umrah-exclusive-placeholder'),
    'makkah_madinah', 7, 8, '7 Nights / 8 Days (4N Makkah + 3N Madinah)',
    (select id from public.hotels where slug = 'intercontinental-dar-al-tawhid'),
    true,
    (select id from public.hotels where slug = 'intercontinental-dar-al-hijra-madinah'),
    true,
    '4 nights in Makkah', '3 nights in Madinah',
    'published', 53
  where not exists (
    select 1 from public.umrah_inventory_configurations c
    join public.packages p on p.id = c.package_id
    where p.slug = 'umrah-exclusive-placeholder' and c.journey_type = 'makkah_madinah' and c.duration_label = '7 Nights / 8 Days (4N Makkah + 3N Madinah)'
  )
  returning id
)
insert into public.umrah_configuration_room_prices (configuration_id, occupancy_type, price_aed, display_order)
select cfg.id, v.occupancy_type, v.price_aed, v.display_order
from cfg, (values ('Double', 6233, 1), ('Triple', 4840, 2), ('Quad', 4107, 3)) as v(occupancy_type, price_aed, display_order)
on conflict (configuration_id, occupancy_type) do nothing;

-- 4+4 (8N/9D)
with cfg as (
  insert into public.umrah_inventory_configurations
    (package_id, journey_type, duration_nights, duration_days, duration_label, makkah_hotel_id, makkah_allow_similar, madinah_hotel_id, madinah_allow_similar, makkah_custom_note, madinah_custom_note, status, display_order)
  select
    (select id from public.packages where type = 'umrah' and slug = 'umrah-exclusive-placeholder'),
    'makkah_madinah', 8, 9, '8 Nights / 9 Days (4N Makkah + 4N Madinah)',
    (select id from public.hotels where slug = 'intercontinental-dar-al-tawhid'),
    true,
    (select id from public.hotels where slug = 'intercontinental-dar-al-hijra-madinah'),
    true,
    '4 nights in Makkah', '4 nights in Madinah',
    'published', 54
  where not exists (
    select 1 from public.umrah_inventory_configurations c
    join public.packages p on p.id = c.package_id
    where p.slug = 'umrah-exclusive-placeholder' and c.journey_type = 'makkah_madinah' and c.duration_label = '8 Nights / 9 Days (4N Makkah + 4N Madinah)'
  )
  returning id
)
insert into public.umrah_configuration_room_prices (configuration_id, occupancy_type, price_aed, display_order)
select cfg.id, v.occupancy_type, v.price_aed, v.display_order
from cfg, (values ('Double', 7093, 1), ('Triple', 5467, 2), ('Quad', 4637, 3)) as v(occupancy_type, price_aed, display_order)
on conflict (configuration_id, occupancy_type) do nothing;

-- 5+4 (9N/10D)
with cfg as (
  insert into public.umrah_inventory_configurations
    (package_id, journey_type, duration_nights, duration_days, duration_label, makkah_hotel_id, makkah_allow_similar, madinah_hotel_id, madinah_allow_similar, makkah_custom_note, madinah_custom_note, status, display_order)
  select
    (select id from public.packages where type = 'umrah' and slug = 'umrah-exclusive-placeholder'),
    'makkah_madinah', 9, 10, '9 Nights / 10 Days (5N Makkah + 4N Madinah)',
    (select id from public.hotels where slug = 'intercontinental-dar-al-tawhid'),
    true,
    (select id from public.hotels where slug = 'intercontinental-dar-al-hijra-madinah'),
    true,
    '5 nights in Makkah', '4 nights in Madinah',
    'published', 55
  where not exists (
    select 1 from public.umrah_inventory_configurations c
    join public.packages p on p.id = c.package_id
    where p.slug = 'umrah-exclusive-placeholder' and c.journey_type = 'makkah_madinah' and c.duration_label = '9 Nights / 10 Days (5N Makkah + 4N Madinah)'
  )
  returning id
)
insert into public.umrah_configuration_room_prices (configuration_id, occupancy_type, price_aed, display_order)
select cfg.id, v.occupancy_type, v.price_aed, v.display_order
from cfg, (values ('Double', 7968, 1), ('Triple', 6184, 2), ('Quad', 5250, 3)) as v(occupancy_type, price_aed, display_order)
on conflict (configuration_id, occupancy_type) do nothing;

-- 5+5 (10N/11D)
with cfg as (
  insert into public.umrah_inventory_configurations
    (package_id, journey_type, duration_nights, duration_days, duration_label, makkah_hotel_id, makkah_allow_similar, madinah_hotel_id, madinah_allow_similar, makkah_custom_note, madinah_custom_note, status, display_order)
  select
    (select id from public.packages where type = 'umrah' and slug = 'umrah-exclusive-placeholder'),
    'makkah_madinah', 10, 11, '10 Nights / 11 Days (5N Makkah + 5N Madinah)',
    (select id from public.hotels where slug = 'intercontinental-dar-al-tawhid'),
    true,
    (select id from public.hotels where slug = 'intercontinental-dar-al-hijra-madinah'),
    true,
    '5 nights in Makkah', '5 nights in Madinah',
    'published', 56
  where not exists (
    select 1 from public.umrah_inventory_configurations c
    join public.packages p on p.id = c.package_id
    where p.slug = 'umrah-exclusive-placeholder' and c.journey_type = 'makkah_madinah' and c.duration_label = '10 Nights / 11 Days (5N Makkah + 5N Madinah)'
  )
  returning id
)
insert into public.umrah_configuration_room_prices (configuration_id, occupancy_type, price_aed, display_order)
select cfg.id, v.occupancy_type, v.price_aed, v.display_order
from cfg, (values ('Double', 8828, 1), ('Triple', 6810, 2), ('Quad', 5780, 3)) as v(occupancy_type, price_aed, display_order)
on conflict (configuration_id, occupancy_type) do nothing;

