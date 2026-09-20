-- Migration: 0046_umrah_makkah_only_configs.sql
-- Seeds real Makkah-only inventory configurations (hotel + room pricing +
-- itinerary) for all three Umrah tiers, using the exact figures from the
-- client's Umrah packages spec (item 9) and the day-by-day copy from the
-- client's "day wise itinerary.docx" (item 12c).
--
-- Essential and Exclusive currently have ZERO umrah_inventory_configurations
-- rows at all, so their /umrah/[slug] detail pages fall back to a generic
-- "pricing confirmed with our advisors" message instead of real pricing,
-- hotel and itinerary content. Signature already has a real (but unrelated,
-- month-specific "4 Nights / 5 Days / November 26") configuration, which
-- this migration does not touch — it only adds the three durations below
-- alongside whatever already exists.
--
-- package_id is resolved by the tier-master placeholder slug (the specific
-- packages row each /umrah/[slug] route reads), not by tier alone — tier
-- alone is ambiguous since the older duration-variants system can hold
-- multiple `packages` rows per tier (see 0015_package_duration_variants.sql).
--
-- NOT covered: a Makkah-only 5 Nights / 6 Days itinerary — no day-by-day
-- copy for that duration exists in any source provided, so its itinerary
-- is left as an empty array rather than invented. Flagged to Irfhan.
--
-- Idempotent: each block only inserts a configuration if one matching that
-- exact package_id + journey_type + duration_label doesn't already exist,
-- so this migration is safe to re-run.
--
-- Apply manually in Supabase SQL Editor.

-- ─────────────────────────────────────────────────────────────────────────
-- ESSENTIAL — VOCO Makkah
-- ─────────────────────────────────────────────────────────────────────────

-- 2 Nights / 3 Days
with cfg as (
  insert into public.umrah_inventory_configurations
    (package_id, journey_type, duration_nights, duration_days, duration_label, makkah_hotel_id, makkah_allow_similar, itinerary, status, display_order)
  select
    (select id from public.packages where type = 'umrah' and slug = 'umrah-essential-placeholder'),
    'makkah_only', 2, 3, '2 Nights / 3 Days',
    (select id from public.hotels where slug = 'voco-makkah'),
    true,
    '[
      {"day": 1, "title": "Arrival in Makkah", "items": [
        "Airport Pickup: greeted by your professional driver at the airport upon flight arrival and transferred directly to your Makkah hotel in a private car.",
        "Check-In & Umrah: smooth hotel check-in followed by time to refresh and perform your Umrah at your own pace."
      ]},
      {"day": 2, "title": "Makkah — Full Day for Ibadah", "items": [
        "Dedicate the entire day to prayers, optional Tawaf, and spiritual reflection inside Masjid al-Haram.",
        "Optional Add-On: private morning Ziyarat tour of Makkah''s historical landmarks."
      ]},
      {"day": 3, "title": "Alvida Tawaf & Departure", "items": [
        "Checkout & Transfer: complete final prayers (Alvida Tawaf), check out of the hotel, and enjoy a comfortable private transfer back to the airport according to your flight schedule."
      ]}
    ]'::jsonb,
    'published', 1
  where not exists (
    select 1 from public.umrah_inventory_configurations c
    join public.packages p on p.id = c.package_id
    where p.slug = 'umrah-essential-placeholder' and c.journey_type = 'makkah_only' and c.duration_label = '2 Nights / 3 Days'
  )
  returning id
)
insert into public.umrah_configuration_room_prices (configuration_id, occupancy_type, price_aed, display_order)
select cfg.id, v.occupancy_type, v.price_aed, v.display_order
from cfg, (values ('Double', 799, 1), ('Triple', 699, 2), ('Quad', 599, 3)) as v(occupancy_type, price_aed, display_order)
on conflict (configuration_id, occupancy_type) do nothing;

-- 3 Nights / 4 Days
with cfg as (
  insert into public.umrah_inventory_configurations
    (package_id, journey_type, duration_nights, duration_days, duration_label, makkah_hotel_id, makkah_allow_similar, itinerary, status, display_order)
  select
    (select id from public.packages where type = 'umrah' and slug = 'umrah-essential-placeholder'),
    'makkah_only', 3, 4, '3 Nights / 4 Days',
    (select id from public.hotels where slug = 'voco-makkah'),
    true,
    '[
      {"day": 1, "title": "Arrival in Makkah", "items": [
        "Airport Pickup: private car transfer from the airport to your Makkah hotel by your professional driver.",
        "Check-In & Umrah: check-in, settle in, and proceed to the Haram to complete your Umrah rituals comfortably."
      ]},
      {"day": 2, "title": "Makkah — Focused Worship", "items": [
        "A full day dedicated to prayers and spiritual devotions at Masjid al-Haram.",
        "Optional Add-On: private guided tour of key historical sites (Jabal al-Nour, Jabal Thawr, Jannat al-Mu''alla)."
      ]},
      {"day": 3, "title": "Day of Reflection & Rest", "items": [
        "Freedom to spend the day at your own pace for personal worship, Quran recitation, and optional shopping."
      ]},
      {"day": 4, "title": "Departure", "items": [
        "Checkout & Transfer: hotel checkout and seamless private car drop-off at the airport for your return flight."
      ]}
    ]'::jsonb,
    'published', 2
  where not exists (
    select 1 from public.umrah_inventory_configurations c
    join public.packages p on p.id = c.package_id
    where p.slug = 'umrah-essential-placeholder' and c.journey_type = 'makkah_only' and c.duration_label = '3 Nights / 4 Days'
  )
  returning id
)
insert into public.umrah_configuration_room_prices (configuration_id, occupancy_type, price_aed, display_order)
select cfg.id, v.occupancy_type, v.price_aed, v.display_order
from cfg, (values ('Double', 1099, 1), ('Triple', 899, 2), ('Quad', 749, 3)) as v(occupancy_type, price_aed, display_order)
on conflict (configuration_id, occupancy_type) do nothing;

-- 5 Nights / 6 Days (itinerary intentionally left empty — see note above)
with cfg as (
  insert into public.umrah_inventory_configurations
    (package_id, journey_type, duration_nights, duration_days, duration_label, makkah_hotel_id, makkah_allow_similar, itinerary, status, display_order)
  select
    (select id from public.packages where type = 'umrah' and slug = 'umrah-essential-placeholder'),
    'makkah_only', 5, 6, '5 Nights / 6 Days',
    (select id from public.hotels where slug = 'voco-makkah'),
    true,
    '[]'::jsonb,
    'published', 3
  where not exists (
    select 1 from public.umrah_inventory_configurations c
    join public.packages p on p.id = c.package_id
    where p.slug = 'umrah-essential-placeholder' and c.journey_type = 'makkah_only' and c.duration_label = '5 Nights / 6 Days'
  )
  returning id
)
insert into public.umrah_configuration_room_prices (configuration_id, occupancy_type, price_aed, display_order)
select cfg.id, v.occupancy_type, v.price_aed, v.display_order
from cfg, (values ('Double', 1699, 1), ('Triple', 1299, 2), ('Quad', 1049, 3)) as v(occupancy_type, price_aed, display_order)
on conflict (configuration_id, occupancy_type) do nothing;

-- ─────────────────────────────────────────────────────────────────────────
-- SIGNATURE — Jabal Omar Marriott Hotel Makkah
-- (in addition to the existing "4 Nights / 5 Days / November 26" config)
-- ─────────────────────────────────────────────────────────────────────────

-- 2 Nights / 3 Days
with cfg as (
  insert into public.umrah_inventory_configurations
    (package_id, journey_type, duration_nights, duration_days, duration_label, makkah_hotel_id, makkah_allow_similar, itinerary, status, display_order)
  select
    (select id from public.packages where type = 'umrah' and slug = 'umrah-signature-placeholder'),
    'makkah_only', 2, 3, '2 Nights / 3 Days',
    (select id from public.hotels where slug = 'jabal-omar-marriott'),
    true,
    '[
      {"day": 1, "title": "Arrival in Makkah", "items": [
        "Airport Pickup: greeted by your professional driver at the airport upon flight arrival and transferred directly to your Makkah hotel in a private car.",
        "Check-In & Umrah: smooth hotel check-in followed by time to refresh and perform your Umrah at your own pace."
      ]},
      {"day": 2, "title": "Makkah — Full Day for Ibadah", "items": [
        "Dedicate the entire day to prayers, optional Tawaf, and spiritual reflection inside Masjid al-Haram.",
        "Optional Add-On: private morning Ziyarat tour of Makkah''s historical landmarks."
      ]},
      {"day": 3, "title": "Alvida Tawaf & Departure", "items": [
        "Checkout & Transfer: complete final prayers (Alvida Tawaf), check out of the hotel, and enjoy a comfortable private transfer back to the airport according to your flight schedule."
      ]}
    ]'::jsonb,
    'published', 10
  where not exists (
    select 1 from public.umrah_inventory_configurations c
    join public.packages p on p.id = c.package_id
    where p.slug = 'umrah-signature-placeholder' and c.journey_type = 'makkah_only' and c.duration_label = '2 Nights / 3 Days'
  )
  returning id
)
insert into public.umrah_configuration_room_prices (configuration_id, occupancy_type, price_aed, display_order)
select cfg.id, v.occupancy_type, v.price_aed, v.display_order
from cfg, (values ('Double', 1543, 1), ('Triple', 1302, 2), ('Quad', 1147, 3)) as v(occupancy_type, price_aed, display_order)
on conflict (configuration_id, occupancy_type) do nothing;

-- 3 Nights / 4 Days
with cfg as (
  insert into public.umrah_inventory_configurations
    (package_id, journey_type, duration_nights, duration_days, duration_label, makkah_hotel_id, makkah_allow_similar, itinerary, status, display_order)
  select
    (select id from public.packages where type = 'umrah' and slug = 'umrah-signature-placeholder'),
    'makkah_only', 3, 4, '3 Nights / 4 Days',
    (select id from public.hotels where slug = 'jabal-omar-marriott'),
    true,
    '[
      {"day": 1, "title": "Arrival in Makkah", "items": [
        "Airport Pickup: private car transfer from the airport to your Makkah hotel by your professional driver.",
        "Check-In & Umrah: check-in, settle in, and proceed to the Haram to complete your Umrah rituals comfortably."
      ]},
      {"day": 2, "title": "Makkah — Focused Worship", "items": [
        "A full day dedicated to prayers and spiritual devotions at Masjid al-Haram.",
        "Optional Add-On: private guided tour of key historical sites (Jabal al-Nour, Jabal Thawr, Jannat al-Mu''alla)."
      ]},
      {"day": 3, "title": "Day of Reflection & Rest", "items": [
        "Freedom to spend the day at your own pace for personal worship, Quran recitation, and optional shopping."
      ]},
      {"day": 4, "title": "Departure", "items": [
        "Checkout & Transfer: hotel checkout and seamless private car drop-off at the airport for your return flight."
      ]}
    ]'::jsonb,
    'published', 11
  where not exists (
    select 1 from public.umrah_inventory_configurations c
    join public.packages p on p.id = c.package_id
    where p.slug = 'umrah-signature-placeholder' and c.journey_type = 'makkah_only' and c.duration_label = '3 Nights / 4 Days'
  )
  returning id
)
insert into public.umrah_configuration_room_prices (configuration_id, occupancy_type, price_aed, display_order)
select cfg.id, v.occupancy_type, v.price_aed, v.display_order
from cfg, (values ('Double', 1918, 1), ('Triple', 1619, 2), ('Quad', 1410, 3)) as v(occupancy_type, price_aed, display_order)
on conflict (configuration_id, occupancy_type) do nothing;

-- 5 Nights / 6 Days (itinerary intentionally left empty — see note above)
with cfg as (
  insert into public.umrah_inventory_configurations
    (package_id, journey_type, duration_nights, duration_days, duration_label, makkah_hotel_id, makkah_allow_similar, itinerary, status, display_order)
  select
    (select id from public.packages where type = 'umrah' and slug = 'umrah-signature-placeholder'),
    'makkah_only', 5, 6, '5 Nights / 6 Days',
    (select id from public.hotels where slug = 'jabal-omar-marriott'),
    true,
    '[]'::jsonb,
    'published', 12
  where not exists (
    select 1 from public.umrah_inventory_configurations c
    join public.packages p on p.id = c.package_id
    where p.slug = 'umrah-signature-placeholder' and c.journey_type = 'makkah_only' and c.duration_label = '5 Nights / 6 Days'
  )
  returning id
)
insert into public.umrah_configuration_room_prices (configuration_id, occupancy_type, price_aed, display_order)
select cfg.id, v.occupancy_type, v.price_aed, v.display_order
from cfg, (values ('Double', 2668, 1), ('Triple', 2252, 2), ('Quad', 1935, 3)) as v(occupancy_type, price_aed, display_order)
on conflict (configuration_id, occupancy_type) do nothing;

-- ─────────────────────────────────────────────────────────────────────────
-- EXCLUSIVE — Dar Al Tawheed InterContinental Makkah
-- ─────────────────────────────────────────────────────────────────────────

-- 2 Nights / 3 Days
with cfg as (
  insert into public.umrah_inventory_configurations
    (package_id, journey_type, duration_nights, duration_days, duration_label, makkah_hotel_id, makkah_allow_similar, itinerary, status, display_order)
  select
    (select id from public.packages where type = 'umrah' and slug = 'umrah-exclusive-placeholder'),
    'makkah_only', 2, 3, '2 Nights / 3 Days',
    (select id from public.hotels where slug = 'intercontinental-dar-al-tawhid'),
    true,
    '[
      {"day": 1, "title": "Arrival in Makkah", "items": [
        "Airport Pickup: greeted by your professional driver at the airport upon flight arrival and transferred directly to your Makkah hotel in a private car.",
        "Check-In & Umrah: smooth hotel check-in followed by time to refresh and perform your Umrah at your own pace."
      ]},
      {"day": 2, "title": "Makkah — Full Day for Ibadah", "items": [
        "Dedicate the entire day to prayers, optional Tawaf, and spiritual reflection inside Masjid al-Haram.",
        "Optional Add-On: private morning Ziyarat tour of Makkah''s historical landmarks."
      ]},
      {"day": 3, "title": "Alvida Tawaf & Departure", "items": [
        "Checkout & Transfer: complete final prayers (Alvida Tawaf), check out of the hotel, and enjoy a comfortable private transfer back to the airport according to your flight schedule."
      ]}
    ]'::jsonb,
    'published', 20
  where not exists (
    select 1 from public.umrah_inventory_configurations c
    join public.packages p on p.id = c.package_id
    where p.slug = 'umrah-exclusive-placeholder' and c.journey_type = 'makkah_only' and c.duration_label = '2 Nights / 3 Days'
  )
  returning id
)
insert into public.umrah_configuration_room_prices (configuration_id, occupancy_type, price_aed, display_order)
select cfg.id, v.occupancy_type, v.price_aed, v.display_order
from cfg, (values ('Double', 2543, 1), ('Triple', 2102, 2), ('Quad', 1847, 3)) as v(occupancy_type, price_aed, display_order)
on conflict (configuration_id, occupancy_type) do nothing;

-- 3 Nights / 4 Days
with cfg as (
  insert into public.umrah_inventory_configurations
    (package_id, journey_type, duration_nights, duration_days, duration_label, makkah_hotel_id, makkah_allow_similar, itinerary, status, display_order)
  select
    (select id from public.packages where type = 'umrah' and slug = 'umrah-exclusive-placeholder'),
    'makkah_only', 3, 4, '3 Nights / 4 Days',
    (select id from public.hotels where slug = 'intercontinental-dar-al-tawhid'),
    true,
    '[
      {"day": 1, "title": "Arrival in Makkah", "items": [
        "Airport Pickup: private car transfer from the airport to your Makkah hotel by your professional driver.",
        "Check-In & Umrah: check-in, settle in, and proceed to the Haram to complete your Umrah rituals comfortably."
      ]},
      {"day": 2, "title": "Makkah — Focused Worship", "items": [
        "A full day dedicated to prayers and spiritual devotions at Masjid al-Haram.",
        "Optional Add-On: private guided tour of key historical sites (Jabal al-Nour, Jabal Thawr, Jannat al-Mu''alla)."
      ]},
      {"day": 3, "title": "Day of Reflection & Rest", "items": [
        "Freedom to spend the day at your own pace for personal worship, Quran recitation, and optional shopping."
      ]},
      {"day": 4, "title": "Departure", "items": [
        "Checkout & Transfer: hotel checkout and seamless private car drop-off at the airport for your return flight."
      ]}
    ]'::jsonb,
    'published', 21
  where not exists (
    select 1 from public.umrah_inventory_configurations c
    join public.packages p on p.id = c.package_id
    where p.slug = 'umrah-exclusive-placeholder' and c.journey_type = 'makkah_only' and c.duration_label = '3 Nights / 4 Days'
  )
  returning id
)
insert into public.umrah_configuration_room_prices (configuration_id, occupancy_type, price_aed, display_order)
select cfg.id, v.occupancy_type, v.price_aed, v.display_order
from cfg, (values ('Double', 3418, 1), ('Triple', 2819, 2), ('Quad', 2460, 3)) as v(occupancy_type, price_aed, display_order)
on conflict (configuration_id, occupancy_type) do nothing;

-- 5 Nights / 6 Days (itinerary intentionally left empty — see note above)
with cfg as (
  insert into public.umrah_inventory_configurations
    (package_id, journey_type, duration_nights, duration_days, duration_label, makkah_hotel_id, makkah_allow_similar, itinerary, status, display_order)
  select
    (select id from public.packages where type = 'umrah' and slug = 'umrah-exclusive-placeholder'),
    'makkah_only', 5, 6, '5 Nights / 6 Days',
    (select id from public.hotels where slug = 'intercontinental-dar-al-tawhid'),
    true,
    '[]'::jsonb,
    'published', 22
  where not exists (
    select 1 from public.umrah_inventory_configurations c
    join public.packages p on p.id = c.package_id
    where p.slug = 'umrah-exclusive-placeholder' and c.journey_type = 'makkah_only' and c.duration_label = '5 Nights / 6 Days'
  )
  returning id
)
insert into public.umrah_configuration_room_prices (configuration_id, occupancy_type, price_aed, display_order)
select cfg.id, v.occupancy_type, v.price_aed, v.display_order
from cfg, (values ('Double', 5168, 1), ('Triple', 4252, 2), ('Quad', 3685, 3)) as v(occupancy_type, price_aed, display_order)
on conflict (configuration_id, occupancy_type) do nothing;
