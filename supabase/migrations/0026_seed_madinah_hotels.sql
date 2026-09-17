-- Seeds the 20 Madinah hotels researched for this phase — 14 with real
-- proximity/room data (Zones 1-3), and 6 placeholder rows seeded
-- is_active = false with just a name and (where inferable) a zone, since
-- no independently-verified walk-time or pricing data was found for them
-- this pass. Room prices are converted from the source's USD research
-- figures at a rough 3.67 AED rate, rounded to whole AED — placeholder
-- pending real rate-sheet figures, same caveat as every other
-- USD-sourced price in this schema.
--
-- Does not touch any Makkah row — every statement below either inserts a
-- new Madinah row or inserts hotel_rooms joined against a
-- newly-inserted Madinah hotel's slug.

insert into public.hotels (
  name, slug, city, star_rating, zone, route_type,
  mens_gate_walk_minutes_min, mens_gate_walk_minutes_max, nearest_mens_gate,
  ladies_gate_walk_minutes_min, ladies_gate_walk_minutes_max, nearest_ladies_gate,
  primary_gate, elderly_family_suitability_note, shuttle_available, shuttle_note,
  accessibility_note, data_confidence, admin_caution_note, description, is_active, display_order
) values
  (
    'Madinah Hilton', 'madinah-hilton', 'Madinah', 5, 'Zone 1: Bab As-Salam / Gate 25', 'flat',
    2, 3, 'King Fahd Gate area',
    2, 4, 'Gate 25 (opposite)',
    'mens', 'Flat paved plaza, suitable for wheelchairs and strollers', false, null,
    'Full lift access; step-free lobby', 'verified', null,
    'A 359-room 5-star hotel in Zone 1, moments from both King Fahd Gate and Gate 25, with a flat paved plaza approach.', true, 1
  ),
  (
    'Sofitel Shahd Al Madinah', 'sofitel-shahd-al-madinah', 'Madinah', 5, 'Zone 1: Bab As-Salam / Gate 25', 'flat',
    1, 2, 'Northern side gates',
    null, null, 'Northern entrances (close by)',
    'mens', 'Flat, shaded approach', false, null,
    'Full lift access', 'verified', 'Rates roughly double during Ramadan — flag on site',
    'A 5-star hotel on the northern side of the plaza, a short flat, shaded walk from the Haram.', true, 2
  ),
  (
    'Dar Al Taqwa', 'dar-al-taqwa', 'Madinah', 5, 'Zone 1: Bab As-Salam / Gate 25', 'flat',
    1, 2, 'King Fahd Gate (23)',
    1, 2, 'King Fahd Gate (23)',
    'mens', 'Best-suited to wheelchairs and walking frames of any hotel in this set', false, null,
    'Lift access; live mosque audio broadcast in rooms', 'verified', null,
    'A 154-room 5-star hotel directly opposite King Fahd Gate (23) — the shortest, flattest route in this set.', true, 3
  ),
  (
    'InterContinental Dar Al Hijra Madinah', 'intercontinental-dar-al-hijra-madinah', 'Madinah', 5, 'Zone 1: Bab As-Salam / Gate 25', 'flat',
    2, 4, 'Eastern side, near the Baqi'' cemetery approach',
    2, 4, 'Eastern side, near the Baqi'' cemetery approach',
    'mens', 'Flat pedestrian plaza approach', false, null,
    'Full lift access', 'verified', 'On-site parking limited to 44 bays — flag to self-driving guests',
    'An IHG 5-star hotel on the eastern side of the plaza, via the Baqi'' cemetery approach.', true, 4
  ),
  (
    'Pullman Zamzam Madina', 'pullman-zamzam-madina', 'Madinah', 5, 'Zone 1: Bab As-Salam / Gate 25', 'flat',
    3, 5, 'Bab As-Salam / Gate 1 (opposite)',
    10, 12, 'Gate 24 / northern entrances',
    'mens', 'Flat, but the busiest, most crowded frontage in this set', false, null,
    null, 'verified', 'Best marketed to male travellers, business groups, or mixed families where a longer women''s walk is acceptable — not the first suggestion for elderly women travelling alone',
    'An 835-room 5-star hotel directly opposite Bab As-Salam, with the busiest frontage of any hotel in this set.', true, 5
  ),
  (
    'Anwar Al Madinah Mövenpick', 'anwar-al-madinah-movenpick', 'Madinah', 5, 'Zone 2: King Fahd Gate & Central Frontage', 'flat',
    3, 4, 'Opposite Omar bin Khattab Gate',
    5, 10, 'Uthman bin Affan Gate',
    'mens', 'Flat route through the attached Bin Dawood mall', false, null,
    'Lifts throughout; partially renovated 2024', 'verified',
    'Multiple reviews specifically warn this is less convenient for elderly/handicapped ladies despite the short men''s-side distance — state this plainly, don''t let guests discover it on arrival',
    'A 5-star hotel opposite Omar bin Khattab Gate, connected to the Haram via the attached Bin Dawood mall.', true, 6
  ),
  (
    'Crowne Plaza Madinah', 'crowne-plaza-madinah', 'Madinah', 5, 'Zone 2: King Fahd Gate & Central Frontage', 'flat',
    2, 3, 'Bab Al-Malik Fahd',
    8, 10, 'Bab Al-Malik Fahd (further side)',
    'mens', 'Wide, well-maintained plaza, vehicle-free at prayer times', false, null,
    'Wheelchair support available at designated mosque points', 'verified', null,
    'A 506-room IHG 5-star hotel by Bab Al-Malik Fahd, on a wide, well-maintained plaza.', true, 7
  ),
  (
    'Saja by Warwick Madinah', 'saja-by-warwick-madinah', 'Madinah', 4, 'Zone 2: King Fahd Gate & Central Frontage', 'flat',
    4, 7, 'Gate 328',
    4, 7, 'Gate 328',
    'mens', 'Flat route, easy even for families with children', false,
    'Some guests report a complimentary shuttle in peak periods — unconfirmed, see admin note',
    'Lifts; wheelchairs supplied on request', 'estimated',
    'Some guests report a complimentary shuttle in peak periods — confirm current status with the hotel before publishing',
    'A 699-room 4-star hotel by Gate 328, roughly even walking distance for men and women.', true, 8
  ),
  (
    'Makarem Burj Al Madinah', 'makarem-burj-al-madinah', 'Madinah', 4, 'Zone 2: King Fahd Gate & Central Frontage', 'flat',
    null, null, null,
    4, 6, 'Advertised by the hotel as easy ladies'' access',
    'ladies', 'Flat route through the Badhaah district shopping streets', false, null,
    'Lift access', 'estimated', null,
    'A 326-room 4-star hotel through the Badhaah district, one of few mid-range properties to directly advertise easy ladies'' access.', true, 9
  ),
  (
    'Golden Tulip Al Shakreen', 'golden-tulip-al-shakreen', 'Madinah', 3, 'Zone 2: King Fahd Gate & Central Frontage', 'flat',
    1, 10, 'Bab As-Salam side',
    1, 10, 'Bab As-Salam side',
    'mens', null, false, null,
    null, 'needs_verification',
    'Recent reviews are mixed on housekeeping/laundry/room condition despite the excellent location — recommend an in-person or agent inspection before featuring as a flagship budget option',
    'A 416-room 3-star hotel facing the mosque directly on the Bab As-Salam side.', true, 10
  ),
  (
    'Elaf Al Taqwa', 'elaf-al-taqwa', 'Madinah', 4, 'Zone 3: Southern/Value Cluster', 'flat',
    5, 10, 'Roza side',
    5, 10, 'Roza side',
    'mens', 'Flat, well-lit central streets', false, null,
    'Lift access', 'verified', null,
    'A 4-star hotel on the Roza side, a short walk for both men and women along flat, well-lit streets.', true, 11
  ),
  (
    'Al Manakha Rotana Madinah', 'al-manakha-rotana-madinah', 'Madinah', 4, 'Zone 3: Southern/Value Cluster', 'flat',
    8, 12, 'Southern approach',
    8, 12, 'Southern approach',
    'mens', 'Flat southern approach', true, 'Scheduled shuttle available at prayer times',
    null, 'verified', null,
    'A 4-star hotel with a 9.2/10 guest rating — one of the highest-rated in this set — pairing a flat southern approach with a scheduled prayer-time shuttle.', true, 12
  ),
  (
    'Golden Tulip Al-Zahabi', 'golden-tulip-al-zahabi', 'Madinah', 3, 'Zone 3: Southern/Value Cluster', 'flat',
    null, null, null,
    8, 10, 'Near Gate 338 (reported by guests; some listings differ)',
    'ladies', null, false, null,
    null, 'needs_verification',
    'Rooms reported compact — best marketed to solo/couple travellers, not large families; confirm gate distance on a site visit',
    'A 3-star hotel reported close to Gate 338 and the ladies'' entrance, though sources differ.', true, 13
  ),
  (
    'Emaar Mektan', 'emaar-mektan', 'Madinah', 3, 'Zone 3: Southern/Value Cluster', 'flat',
    4, 5, 'King Saud Gate',
    8, 10, 'King Saud Gate (further side)',
    'mens', 'Flat route through the Masjid Al Ghamamah commercial strip', false, null,
    null, 'estimated', null,
    'A 3-star hotel by King Saud Gate, via the Masjid Al Ghamamah commercial strip.', true, 14
  ),
  (
    'Ancyra Hotel by Continent', 'ancyra-hotel-by-continent', 'Madinah', null, 'Zone 3: Southern/Value Cluster', null,
    null, null, null, null, null, null,
    null, null, false, null, null, 'needs_verification',
    'Southern edge of the map, near Rotana Al Manakha and Elaf Al Taqwa — recommend a direct enquiry or Street View check before publishing distance claims',
    null, false, 21
  ),
  ('Zowar Alalami', 'zowar-alalami', 'Madinah', null, null, null, null, null, null, null, null, null, null, null, false, null, null, 'needs_verification', 'No independently-verified data found this pass.', null, false, 22),
  ('ODST Almadina', 'odst-almadina', 'Madinah', null, null, null, null, null, null, null, null, null, null, null, false, null, null, 'needs_verification', 'No independently-verified data found this pass.', null, false, 23),
  ('Waqf Outhman', 'waqf-outhman', 'Madinah', null, null, null, null, null, null, null, null, null, null, null, false, null, null, 'needs_verification', 'No independently-verified data found this pass.', null, false, 24),
  ('Alritz Almadinah', 'alritz-almadinah', 'Madinah', null, null, null, null, null, null, null, null, null, null, null, false, null, null, 'needs_verification', 'No independently-verified data found this pass.', null, false, 25),
  ('Dar Aleiman Al Haram', 'dar-aleiman-al-haram', 'Madinah', null, null, null, null, null, null, null, null, null, null, null, false, null, null, 'needs_verification', 'No independently-verified data found this pass.', null, false, 26)
on conflict (slug) do nothing;

-- Room pricing — USD research figures x 3.67, rounded to whole AED,
-- placeholder pending real rate-sheet figures (same caveat as every
-- other USD-sourced price in this schema, e.g. 0010_seed_hotel_rooms.sql
-- for Makkah). "On request" rooms are intentionally left out of this
-- room-price seed rather than given an invented number.
with rooms(hotel_slug, room_type, price_ro, display_order) as (
  values
    ('madinah-hilton', 'Standard', 1097::numeric, 0),
    ('madinah-hilton', 'Deluxe', 1321, 1),
    ('madinah-hilton', 'Haram View', 1578, 2),
    ('sofitel-shahd-al-madinah', 'Superior', 807, 0),
    ('sofitel-shahd-al-madinah', 'Luxury', 1101, 1),
    ('sofitel-shahd-al-madinah', 'Mosque View Suite', 1541, 2),
    ('dar-al-taqwa', 'Classic', 793, 0),
    ('dar-al-taqwa', 'Green Dome View', 1028, 1),
    ('intercontinental-dar-al-hijra-madinah', 'Classic', 734, 0),
    ('intercontinental-dar-al-hijra-madinah', 'Club', 954, 1),
    ('pullman-zamzam-madina', 'Standard', 341, 0),
    ('pullman-zamzam-madina', 'Deluxe', 514, 1),
    ('anwar-al-madinah-movenpick', 'City View', 807, 0),
    ('anwar-al-madinah-movenpick', 'Mosque View', 1138, 1),
    ('crowne-plaza-madinah', 'Standard', 547, 0),
    ('crowne-plaza-madinah', 'Rawdah View', 771, 1),
    ('saja-by-warwick-madinah', 'Standard', 385, 0),
    ('saja-by-warwick-madinah', 'Family Room', 551, 1),
    ('makarem-burj-al-madinah', 'Standard', 514, 0),
    ('makarem-burj-al-madinah', 'Family Suite', 697, 1),
    ('golden-tulip-al-shakreen', 'Standard', 360, 0),
    ('elaf-al-taqwa', 'Standard', 356, 0),
    ('elaf-al-taqwa', 'Haram View', 495, 1),
    ('al-manakha-rotana-madinah', 'Standard', 444, 0),
    ('al-manakha-rotana-madinah', 'Family Room', 569, 1),
    ('golden-tulip-al-zahabi', 'Standard', 367, 0),
    ('emaar-mektan', 'Standard', 488, 0)
)
insert into public.hotel_rooms (hotel_id, room_type, price_ro, rate_period_label, display_order)
select h.id, rooms.room_type, rooms.price_ro, 'Placeholder — converted from USD research at ~3.67 AED, pending real rate sheet', rooms.display_order
from rooms
join public.hotels h on h.slug = rooms.hotel_slug
on conflict (hotel_id, room_type) do nothing;
