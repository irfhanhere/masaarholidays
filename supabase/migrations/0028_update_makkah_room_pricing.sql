-- Real Makkah room pricing for 18 hotels — already applied via DML
-- (scripts/_seed-makkah-room-pricing.mjs, since these are UPDATE/INSERT
-- statements, not schema changes) but recorded here as a migration for
-- the same documentation/reproducibility reason 0023/0026 were: so the
-- history of what changed and why lives in supabase/migrations, not only
-- in a throwaway script. Re-running this file is safe (idempotent) even
-- though the original script is not (it matched old room_type names that
-- no longer exist after the rename below).
--
-- 15 hotels' base rate was cross-checked against the live site
-- (data_confidence = verified); Elaf Kinda, Makarem Ajyad and Anjum
-- Hotel are third-party-sourced (data_confidence = estimated). Every
-- room on every one of these 18 hotels also gets the tier-split caution
-- note, since only the base "from" rate was verified, not each tier.
--
-- Matched to existing rows by exact price (e.g. Intercontinental's
-- existing "Classic" row at 1,880 is the same room as the new "Classic
-- Room" tier, just renamed) — see the chat history for the full
-- price-matching rationale. All 18 named hotels were found among the 30
-- existing Makkah rows; none needed to be reported as missing.

update public.hotel_rooms set room_type = 'Classic Room', price_ro = 1880,
  data_confidence = 'verified',
  admin_caution_note = 'Room-tier splits beyond the base rate are estimated from the hotel''s own published spread, not independently confirmed per room'
where hotel_id = (select id from public.hotels where slug = 'intercontinental-dar-al-tawhid') and room_type in ('Classic', 'Classic Room');

update public.hotel_rooms set room_type = 'Palace Suite', price_ro = 2200,
  data_confidence = 'verified',
  admin_caution_note = 'Room-tier splits beyond the base rate are estimated from the hotel''s own published spread, not independently confirmed per room'
where hotel_id = (select id from public.hotels where slug = 'raffles-makkah-palace') and room_type in ('One-bedroom suite', 'Palace Suite');

update public.hotel_rooms set room_type = 'Classic Room', price_ro = 1151,
  data_confidence = 'verified',
  admin_caution_note = 'Room-tier splits beyond the base rate are estimated from the hotel''s own published spread, not independently confirmed per room'
where hotel_id = (select id from public.hotels where slug = 'makkah-hotel-and-towers') and room_type in ('Double room', 'Classic Room');

update public.hotel_rooms set room_type = 'Haram View Room', price_ro = 1600,
  data_confidence = 'verified',
  admin_caution_note = 'Room-tier splits beyond the base rate are estimated from the hotel''s own published spread, not independently confirmed per room'
where hotel_id = (select id from public.hotels where slug = 'makkah-hotel-and-towers') and room_type in ('Partial Haram', 'Haram View Room');

update public.hotel_rooms set room_type = 'Classic Room', price_ro = 1175,
  data_confidence = 'verified',
  admin_caution_note = 'Room-tier splits beyond the base rate are estimated from the hotel''s own published spread, not independently confirmed per room'
where hotel_id = (select id from public.hotels where slug = 'al-marwa-rayhaan') and room_type in ('Double/King', 'Classic Room');

update public.hotel_rooms set room_type = 'Deluxe Room', price_ro = 852,
  data_confidence = 'verified',
  admin_caution_note = 'Room-tier splits beyond the base rate are estimated from the hotel''s own published spread, not independently confirmed per room'
where hotel_id = (select id from public.hotels where slug = 'address-jabal-omar') and room_type in ('Double room', 'Deluxe Room');

update public.hotel_rooms set room_type = 'Standard Room', price_ro = 1181,
  data_confidence = 'verified',
  admin_caution_note = 'Room-tier splits beyond the base rate are estimated from the hotel''s own published spread, not independently confirmed per room'
where hotel_id = (select id from public.hotels where slug = 'al-ghufran-safwah') and room_type in ('Standard', 'Standard Room');

update public.hotel_rooms set room_type = 'Classic Room', price_ro = 1044,
  data_confidence = 'verified',
  admin_caution_note = 'Room-tier splits beyond the base rate are estimated from the hotel''s own published spread, not independently confirmed per room'
where hotel_id = (select id from public.hotels where slug = 'm-venpick-hotel-residences-hajar-tower-makkah-mu08q9yd') and room_type in ('Double/King', 'Classic Room');

update public.hotel_rooms set room_type = 'Fairmont Room', price_ro = 1670,
  data_confidence = 'verified',
  admin_caution_note = 'Room-tier splits beyond the base rate are estimated from the hotel''s own published spread, not independently confirmed per room'
where hotel_id = (select id from public.hotels where slug = 'makkah-clock-royal-tower') and room_type in ('King room', 'Fairmont Room');

update public.hotel_rooms set room_type = 'Superior Room', price_ro = 1406,
  data_confidence = 'verified',
  admin_caution_note = 'Room-tier splits beyond the base rate are estimated from the hotel''s own published spread, not independently confirmed per room'
where hotel_id = (select id from public.hotels where slug = 'zamzam-pullman') and room_type in ('Classic', 'Superior Room');

update public.hotel_rooms set room_type = 'Classic Room', price_ro = 1165,
  data_confidence = 'verified',
  admin_caution_note = 'Room-tier splits beyond the base rate are estimated from the hotel''s own published spread, not independently confirmed per room'
where hotel_id = (select id from public.hotels where slug = 'swissotel-al-maqam') and room_type in ('Classic', 'Classic Room');

update public.hotel_rooms set room_type = 'King Guest Room', price_ro = 1238,
  data_confidence = 'verified',
  admin_caution_note = 'Room-tier splits beyond the base rate are estimated from the hotel''s own published spread, not independently confirmed per room'
where hotel_id = (select id from public.hotels where slug = 'conrad-jabal-omar') and room_type in ('Double room', 'King Guest Room');

update public.hotel_rooms set room_type = 'Guest Room', price_ro = 1211,
  data_confidence = 'verified',
  admin_caution_note = 'Room-tier splits beyond the base rate are estimated from the hotel''s own published spread, not independently confirmed per room'
where hotel_id = (select id from public.hotels where slug = 'jabal-omar-hyatt-regency') and room_type in ('King room', 'Guest Room');

update public.hotel_rooms set room_type = 'One-Bedroom Suite', price_ro = 1250,
  data_confidence = 'verified',
  admin_caution_note = 'Room-tier splits beyond the base rate are estimated from the hotel''s own published spread, not independently confirmed per room'
where hotel_id = (select id from public.hotels where slug = 'hilton-suites-makkah') and room_type in ('Standard', 'One-Bedroom Suite');

update public.hotel_rooms set room_type = 'Deluxe Room', price_ro = 1170,
  data_confidence = 'verified',
  admin_caution_note = 'Room-tier splits beyond the base rate are estimated from the hotel''s own published spread, not independently confirmed per room'
where hotel_id = (select id from public.hotels where slug = 'jumeirah-jabal-omar') and room_type in ('Deluxe double', 'Deluxe Room');

update public.hotel_rooms set room_type = 'Guest Room', price_ro = 908,
  data_confidence = 'verified',
  admin_caution_note = 'Room-tier splits beyond the base rate are estimated from the hotel''s own published spread, not independently confirmed per room'
where hotel_id = (select id from public.hotels where slug = 'hilton-convention-makkah') and room_type in ('King room', 'Guest Room');

-- New tiers (second/third room row per hotel) — inserted only where the
-- hotel had fewer existing rows than tiers listed; skipped on conflict
-- since the unique (hotel_id, room_type) constraint makes this safe to
-- re-run after the first successful pass.
insert into public.hotel_rooms (hotel_id, room_type, price_ro, rate_period_label, data_confidence, admin_caution_note, display_order)
select h.id, v.room_type, v.price_ro, 'Oct 1-30, 2026', v.confidence, v.caution, v.display_order
from (values
  ('intercontinental-dar-al-tawhid', 'Haram View Room', 2450::numeric, 'verified', 'Room-tier splits beyond the base rate are estimated from the hotel''s own published spread, not independently confirmed per room', 1),
  ('raffles-makkah-palace', 'Haram View Suite', 3100, 'verified', 'Room-tier splits beyond the base rate are estimated from the hotel''s own published spread, not independently confirmed per room', 1),
  ('al-marwa-rayhaan', 'Haram View Room', 1650, 'verified', 'Room-tier splits beyond the base rate are estimated from the hotel''s own published spread, not independently confirmed per room', 1),
  ('address-jabal-omar', 'Haram View Room', 1180, 'verified', 'Room-tier splits beyond the base rate are estimated from the hotel''s own published spread, not independently confirmed per room', 1),
  ('al-ghufran-safwah', 'Deluxe Room', 1540, 'verified', 'Room-tier splits beyond the base rate are estimated from the hotel''s own published spread, not independently confirmed per room', 1),
  ('m-venpick-hotel-residences-hajar-tower-makkah-mu08q9yd', 'Residence Suite', 1690, 'verified', 'Room-tier splits beyond the base rate are estimated from the hotel''s own published spread, not independently confirmed per room', 1),
  ('makkah-clock-royal-tower', 'Haram View Room', 2300, 'verified', 'Room-tier splits beyond the base rate are estimated from the hotel''s own published spread, not independently confirmed per room', 1),
  ('zamzam-pullman', 'Haram View Room', 1950, 'verified', 'Room-tier splits beyond the base rate are estimated from the hotel''s own published spread, not independently confirmed per room', 1),
  ('swissotel-al-maqam', 'Haram View Room', 1590, 'verified', 'Room-tier splits beyond the base rate are estimated from the hotel''s own published spread, not independently confirmed per room', 1),
  ('conrad-jabal-omar', 'Executive Room', 1700, 'verified', 'Room-tier splits beyond the base rate are estimated from the hotel''s own published spread, not independently confirmed per room', 1),
  ('jabal-omar-hyatt-regency', 'Haram View Room', 1680, 'verified', 'Room-tier splits beyond the base rate are estimated from the hotel''s own published spread, not independently confirmed per room', 1),
  ('hilton-suites-makkah', 'Two-Bedroom Suite', 1850, 'verified', 'Room-tier splits beyond the base rate are estimated from the hotel''s own published spread, not independently confirmed per room', 1),
  ('jumeirah-jabal-omar', 'Haram View Room', 1620, 'verified', 'Room-tier splits beyond the base rate are estimated from the hotel''s own published spread, not independently confirmed per room', 1),
  ('hilton-convention-makkah', 'Executive Room', 1250, 'verified', 'Room-tier splits beyond the base rate are estimated from the hotel''s own published spread, not independently confirmed per room', 1),
  ('elaf-kinda', 'Standard Room', 290, 'estimated', E'Rate converted from third-party listing (Expedia/Kayak/HotelsCombined), no published Masaar rate yet — confirm directly with hotel before relying on this price\nRoom-tier splits beyond the base rate are estimated from the hotel''s own published spread, not independently confirmed per room', 0),
  ('elaf-kinda', 'Executive Room', 550, 'estimated', E'Rate converted from third-party listing (Expedia/Kayak/HotelsCombined), no published Masaar rate yet — confirm directly with hotel before relying on this price\nRoom-tier splits beyond the base rate are estimated from the hotel''s own published spread, not independently confirmed per room', 1),
  ('makarem-ajyad', 'Superior Room', 480, 'estimated', E'Rate converted from third-party listing (Expedia/Kayak/HotelsCombined), no published Masaar rate yet — confirm directly with hotel before relying on this price\nRoom-tier splits beyond the base rate are estimated from the hotel''s own published spread, not independently confirmed per room', 0),
  ('makarem-ajyad', 'Double Room', 700, 'estimated', E'Rate converted from third-party listing (Expedia/Kayak/HotelsCombined), no published Masaar rate yet — confirm directly with hotel before relying on this price\nRoom-tier splits beyond the base rate are estimated from the hotel''s own published spread, not independently confirmed per room', 1),
  ('makarem-ajyad', 'Deluxe Room', 1000, 'estimated', E'Rate converted from third-party listing (Expedia/Kayak/HotelsCombined), no published Masaar rate yet — confirm directly with hotel before relying on this price\nRoom-tier splits beyond the base rate are estimated from the hotel''s own published spread, not independently confirmed per room', 2),
  ('anjum-hotel', 'Standard Room', 460, 'estimated', E'Rate converted from third-party listing (Expedia/Kayak/HotelsCombined), no published Masaar rate yet — confirm directly with hotel before relying on this price\nRoom-tier splits beyond the base rate are estimated from the hotel''s own published spread, not independently confirmed per room', 0),
  ('anjum-hotel', 'Deluxe Room', 640, 'estimated', E'Rate converted from third-party listing (Expedia/Kayak/HotelsCombined), no published Masaar rate yet — confirm directly with hotel before relying on this price\nRoom-tier splits beyond the base rate are estimated from the hotel''s own published spread, not independently confirmed per room', 1)
) as v(hotel_slug, room_type, price_ro, confidence, caution, display_order)
join public.hotels h on h.slug = v.hotel_slug
on conflict (hotel_id, room_type) do nothing;
