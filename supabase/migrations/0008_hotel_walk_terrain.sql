-- Real walk-time/terrain data — masaar-client-data-round3.md, Section 1.
-- Replaces the vague `category` tier label with actual proximity facts.
--
-- Naming reconciliation (source's own table, "Likely same hotel?" column):
--   Fairmont Clock Royal Tower      = "Makkah Clock Royal Tower" (already in DB)
--   Pullman ZamZam                  = "Zamzam Pullman"           (already in DB)
--   Hilton Suites Jabal Omar        = "Hilton Suites Makkah"     (already in DB)
--   Hilton Convention Jabal Omar    = "Hilton Convention Makkah" (already in DB)
-- These four are UPDATEs against the existing rows, not new inserts — see
-- the WHERE name = '<Round 2 name>' clauses below. Row names themselves
-- are left as the Round 2 spelling (only data is updated) since renaming
-- wasn't asked for.
--
-- distance_from_haram_meters/walk_time_minutes already existed
-- (0001_init.sql); this adds walk_time_minutes_max (for the ranges the
-- source gives, e.g. "3-4 min") and terrain_note (free text).
--
-- Existing non-null distance/walk-time values are preserved (coalesce)
-- rather than overwritten — one hotel (Mövenpick) already has real
-- figures entered directly through the admin panel, which take
-- precedence over this reference table. terrain_note is new information
-- either way, so it's always set.
--
-- "Elaf Kinda" (already in DB) has no entry in the source's walk-time
-- table — left untouched rather than guessed.

alter table public.hotels
  add column if not exists walk_time_minutes_max integer,
  add column if not exists terrain_note text;

comment on column public.hotels.walk_time_minutes is
  'Minutes (lower bound of the range, if the source gave one) — see walk_time_minutes_max.';
comment on column public.hotels.walk_time_minutes_max is
  'Upper bound of the walk-time range, when the source gave one (e.g. "3-4 min" -> min 3, max 4). Null when the source gave a single value.';
comment on column public.hotels.terrain_note is
  'Real proximity/terrain description from the client (e.g. "Flat, open plaza facing King Fahd Gate"), shown on hotel cards/detail pages instead of the vaguer category tier label where present.';

-- ─────────────────────────────────────────────────────────────────────────
-- Updates to the 18 already-seeded hotels the source gives data for
-- (all but "Elaf Kinda").
-- ─────────────────────────────────────────────────────────────────────────
update public.hotels set
  distance_from_haram_meters = coalesce(distance_from_haram_meters, 50),
  walk_time_minutes = coalesce(walk_time_minutes, 1),
  terrain_note = 'Step out lobby directly onto main courtyard marble'
where name = 'Intercontinental Dar Al Tawhid';

update public.hotels set
  distance_from_haram_meters = coalesce(distance_from_haram_meters, 100),
  walk_time_minutes = coalesce(walk_time_minutes, 1),
  walk_time_minutes_max = coalesce(walk_time_minutes_max, 2),
  terrain_note = 'Direct flat exit onto the plaza'
where name = 'Al Marwa Rayhaan';

update public.hotels set
  distance_from_haram_meters = coalesce(distance_from_haram_meters, 100),
  walk_time_minutes = coalesce(walk_time_minutes, 1),
  walk_time_minutes_max = coalesce(walk_time_minutes_max, 2),
  terrain_note = 'Right next to King Abdulaziz Gate; flat ground'
where name = 'Raffles Makkah Palace';

update public.hotels set
  distance_from_haram_meters = coalesce(distance_from_haram_meters, 100),
  walk_time_minutes = coalesce(walk_time_minutes, 1),
  walk_time_minutes_max = coalesce(walk_time_minutes_max, 2),
  terrain_note = 'Flat, open plaza facing King Fahd Gate'
where name = 'Makkah Hotel & Towers';

update public.hotels set
  distance_from_haram_meters = coalesce(distance_from_haram_meters, 100),
  walk_time_minutes = coalesce(walk_time_minutes, 1),
  walk_time_minutes_max = coalesce(walk_time_minutes_max, 2),
  terrain_note = 'Flat exit through Safwa Tower complex'
where name = 'Al Ghufran Safwah';

update public.hotels set
  distance_from_haram_meters = coalesce(distance_from_haram_meters, 150),
  walk_time_minutes = coalesce(walk_time_minutes, 2),
  walk_time_minutes_max = coalesce(walk_time_minutes_max, 3),
  terrain_note = 'Flat indoor walk through Clock Tower Mall'
where name = 'Mövenpick Hotel & Residences Hajar Tower Makkah';

update public.hotels set
  distance_from_haram_meters = coalesce(distance_from_haram_meters, 150),
  walk_time_minutes = coalesce(walk_time_minutes, 2),
  walk_time_minutes_max = coalesce(walk_time_minutes_max, 3),
  terrain_note = 'Direct level connection to prayer grounds'
where name = 'Swissôtel Al Maqam';

update public.hotels set
  distance_from_haram_meters = coalesce(distance_from_haram_meters, 150),
  walk_time_minutes = coalesce(walk_time_minutes, 2),
  walk_time_minutes_max = coalesce(walk_time_minutes_max, 3),
  terrain_note = 'Indoor mall corridor straight to courtyard'
where name = 'Zamzam Pullman'; -- Round 3: "Pullman ZamZam"

update public.hotels set
  distance_from_haram_meters = coalesce(distance_from_haram_meters, 150),
  walk_time_minutes = coalesce(walk_time_minutes, 2),
  walk_time_minutes_max = coalesce(walk_time_minutes_max, 3),
  terrain_note = 'Elevator to mall level, then short flat exit'
where name = 'Makkah Clock Royal Tower'; -- Round 3: "Fairmont Clock Royal Tower"

update public.hotels set
  distance_from_haram_meters = coalesce(distance_from_haram_meters, 200),
  walk_time_minutes = coalesce(walk_time_minutes, 3),
  walk_time_minutes_max = coalesce(walk_time_minutes_max, 4),
  terrain_note = 'Air-conditioned mall walkways and escalators'
where name = 'Swissôtel Makkah';

update public.hotels set
  distance_from_haram_meters = coalesce(distance_from_haram_meters, 200),
  walk_time_minutes = coalesce(walk_time_minutes, 3),
  terrain_note = 'Wide, flat street-level sidewalk'
where name = 'Jabal Omar Hyatt Regency';

update public.hotels set
  distance_from_haram_meters = coalesce(distance_from_haram_meters, 250),
  walk_time_minutes = coalesce(walk_time_minutes, 3),
  walk_time_minutes_max = coalesce(walk_time_minutes_max, 4),
  terrain_note = 'Wide, smooth street path, minimal incline'
where name = 'Conrad Jabal Omar';

update public.hotels set
  distance_from_haram_meters = coalesce(distance_from_haram_meters, 250),
  walk_time_minutes = coalesce(walk_time_minutes, 3),
  walk_time_minutes_max = coalesce(walk_time_minutes_max, 4),
  terrain_note = 'Indoor podium walkway or flat street access'
where name = 'Hilton Suites Makkah'; -- Round 3: "Hilton Suites Jabal Omar"

update public.hotels set
  distance_from_haram_meters = coalesce(distance_from_haram_meters, 300),
  walk_time_minutes = coalesce(walk_time_minutes, 4),
  walk_time_minutes_max = coalesce(walk_time_minutes_max, 5),
  terrain_note = 'Flat paved sidewalk along Ajyad Street'
where name = 'Makarem Ajyad';

update public.hotels set
  distance_from_haram_meters = coalesce(distance_from_haram_meters, 450),
  walk_time_minutes = coalesce(walk_time_minutes, 5),
  walk_time_minutes_max = coalesce(walk_time_minutes_max, 7),
  terrain_note = 'Flat pedestrian bridge straight to King Fahd Gate'
where name = 'Anjum Hotel';

update public.hotels set
  distance_from_haram_meters = coalesce(distance_from_haram_meters, 350),
  walk_time_minutes = coalesce(walk_time_minutes, 5),
  terrain_note = 'Downhill going; slight uphill return'
where name = 'Jumeirah Jabal Omar';

update public.hotels set
  distance_from_haram_meters = coalesce(distance_from_haram_meters, 450),
  walk_time_minutes = coalesce(walk_time_minutes, 6),
  walk_time_minutes_max = coalesce(walk_time_minutes_max, 8),
  terrain_note = 'Elevated location; steep uphill return'
where name = 'Hilton Convention Makkah'; -- Round 3: "Hilton Convention Jabal Omar"

update public.hotels set
  distance_from_haram_meters = coalesce(distance_from_haram_meters, 550),
  walk_time_minutes = coalesce(walk_time_minutes, 7),
  walk_time_minutes_max = coalesce(walk_time_minutes_max, 9),
  terrain_note = 'High position on hill; noticeable uphill climb returning'
where name = 'Address Jabal Omar';

-- ─────────────────────────────────────────────────────────────────────────
-- 11 genuinely new hotels — seeded inactive, same pattern as Round 2.
-- ─────────────────────────────────────────────────────────────────────────
insert into public.hotels
  (name, slug, city, is_active, distance_from_haram_meters, walk_time_minutes, walk_time_minutes_max, terrain_note)
values
  ('Al Safwah Royale Orchid', 'al-safwah-royale-orchid', 'Makkah', false, 100, 1, 2, 'Direct outdoor access onto the Ajyad courtyard'),
  ('Dorrar Al Eiman Royal', 'dorrar-al-eiman-royal', 'Makkah', false, 100, 1, 2, 'Flat courtyard entrance right outside Safwa Tower'),
  ('Le Méridien Makkah', 'le-meridien-makkah', 'Makkah', false, 250, 3, 4, 'Straight, flat sidewalk down Ajyad Street'),
  ('Jabal Omar Marriott', 'jabal-omar-marriott', 'Makkah', false, 300, 4, 5, 'Level pedestrian walkway through Jabal Omar'),
  ('Sheraton Jabal Al Kaaba', 'sheraton-jabal-al-kaaba', 'Makkah', false, 400, 5, 6, 'Dedicated pedestrian bridge to northern expansion'),
  ('DoubleTree Jabal Omar', 'doubletree-jabal-omar', 'Makkah', false, 650, 8, 10, 'Continuous steady slope walking back'),
  ('Maysan Al Maqam', 'maysan-al-maqam', 'Makkah', false, 650, 8, 10, 'Mostly flat with a short sloped approach'),
  ('Emaar Grand Hotel', 'emaar-grand-hotel', 'Makkah', false, 800, 10, 12, 'Long walk down Ibrahim Al Khalil Street; gradual incline back'),
  ('Al Kiswah Towers', 'al-kiswah-towers', 'Makkah', false, 1500, 15, 20, 'Steep roads & tunnels; 5-min free shuttle recommended'),
  ('voco Makkah', 'voco-makkah', 'Makkah', false, 1800, 20, 25, 'Too far for foot travel; 24/7 hotel shuttle required'),
  ('Time Ruba Hotel & Suites', 'time-ruba-hotel-and-suites', 'Makkah', false, 6000, null, null, 'Driving distance; scheduled bus or taxi service required')
on conflict (slug) do nothing;
