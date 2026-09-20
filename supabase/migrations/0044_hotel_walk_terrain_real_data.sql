-- Migration: 0044_hotel_walk_terrain_real_data.sql
-- Real walk/terrain/accessibility dataset for Makkah hotels across 3 tiers:
-- Level 1: Under-2-min flat plaza access
-- Level 2: Easy 2-6 min flat walk
-- Level 3: Hills / long walk / shuttle-required
--
-- Populates route_type, accessibility_note, and elderly_family_suitability_note ("Best for")
-- on public.hotels so that both the /hotels listing cards and the package detail "Your Stay"
-- cards pull directly from the CMS hotel record.

-- ─────────────────────────────────────────────────────────────────────────
-- LEVEL 1: Under-2-min flat plaza access
-- ─────────────────────────────────────────────────────────────────────────

-- 1. Intercontinental Dar Al Tawhid
update public.hotels set
  distance_from_haram_meters = 50,
  walk_time_minutes = 1,
  walk_time_minutes_max = 1,
  terrain_note = 'Step out lobby directly onto main courtyard marble',
  route_type = 'Direct courtyard marble',
  accessibility_note = 'Step-free lobby exit directly onto Haram plaza marble',
  elderly_family_suitability_note = 'Elderly & VIP pilgrims'
where slug = 'intercontinental-dar-al-tawhid' or name = 'Intercontinental Dar Al Tawhid';

-- 2. Mövenpick Hotel & Residences Hajar Tower Makkah
update public.hotels set
  distance_from_haram_meters = 150,
  walk_time_minutes = 2,
  walk_time_minutes_max = 3,
  terrain_note = 'Flat indoor walk through Clock Tower Mall',
  route_type = 'Flat indoor walk through Clock Tower Mall',
  accessibility_note = 'Elevators to plaza level, fully air-conditioned covered walk',
  elderly_family_suitability_note = 'Families & shopping convenience'
where slug = 'movenpick-hotel-and-residences-hajar-tower-makkah' or name = 'Mövenpick Hotel & Residences Hajar Tower Makkah';

-- 3. Al Ghufran Safwah
update public.hotels set
  distance_from_haram_meters = 100,
  walk_time_minutes = 1,
  walk_time_minutes_max = 2,
  terrain_note = 'Flat exit through Safwa Tower complex',
  route_type = 'Flat exit through Safwa Tower complex',
  accessibility_note = 'Direct plaza exit with dedicated high-speed elevators',
  elderly_family_suitability_note = 'Elderly & short walks'
where slug = 'al-ghufran-safwah' or name = 'Al Ghufran Safwah';

-- 4. Al Marwa Rayhaan
update public.hotels set
  distance_from_haram_meters = 100,
  walk_time_minutes = 1,
  walk_time_minutes_max = 2,
  terrain_note = 'Direct flat exit onto the plaza',
  route_type = 'Direct flat exit onto the plaza',
  accessibility_note = 'Step-free courtyard entrance, wheelchair accessible',
  elderly_family_suitability_note = 'Families & elderly'
where slug = 'al-marwa-rayhaan' or name = 'Al Marwa Rayhaan';

-- 5. Makkah Hotel & Towers
update public.hotels set
  distance_from_haram_meters = 100,
  walk_time_minutes = 1,
  walk_time_minutes_max = 2,
  terrain_note = 'Flat, open plaza facing King Fahd Gate',
  route_type = 'Flat, open plaza facing King Fahd Gate',
  accessibility_note = 'Direct plaza access with zero street crossings',
  elderly_family_suitability_note = 'Families & elderly'
where slug = 'makkah-hotel-and-towers' or name = 'Makkah Hotel & Towers';

-- 6. Al Safwah Royale Orchid
update public.hotels set
  distance_from_haram_meters = 100,
  walk_time_minutes = 1,
  walk_time_minutes_max = 2,
  terrain_note = 'Direct outdoor access onto the Ajyad courtyard',
  route_type = 'Direct outdoor access onto Ajyad courtyard',
  accessibility_note = 'Level plaza path, immediate prayer area connection',
  elderly_family_suitability_note = 'Families seeking quick access'
where slug = 'al-safwah-royale-orchid' or name = 'Al Safwah Royale Orchid';

-- 7. Dorrar Al Eiman Royal
update public.hotels set
  distance_from_haram_meters = 100,
  walk_time_minutes = 1,
  walk_time_minutes_max = 2,
  terrain_note = 'Flat courtyard entrance right outside Safwa Tower',
  route_type = 'Flat courtyard entrance outside Safwa Tower',
  accessibility_note = 'Level pavement, immediate courtyard prayer grounds access',
  elderly_family_suitability_note = 'Elderly travellers'
where slug = 'dorrar-al-eiman-royal' or name = 'Dorrar Al Eiman Royal';

-- 8. Raffles Makkah Palace
update public.hotels set
  distance_from_haram_meters = 100,
  walk_time_minutes = 1,
  walk_time_minutes_max = 2,
  terrain_note = 'Right next to King Abdulaziz Gate; flat ground',
  route_type = 'Right next to King Abdulaziz Gate',
  accessibility_note = 'Step-free flat ground, private entrance facing Haram',
  elderly_family_suitability_note = 'Luxury & elderly pilgrims'
where slug = 'raffles-makkah-palace' or name = 'Raffles Makkah Palace';

-- 9. Swissôtel Al Maqam
update public.hotels set
  distance_from_haram_meters = 150,
  walk_time_minutes = 2,
  walk_time_minutes_max = 3,
  terrain_note = 'Direct level connection to prayer grounds',
  route_type = 'Direct level connection to prayer grounds',
  accessibility_note = 'Internal mall access with direct elevators to prayer halls',
  elderly_family_suitability_note = 'Elderly & families'
where slug = 'swissotel-al-maqam' or name = 'Swissôtel Al Maqam';

-- 10. Makkah Clock Royal Tower (Fairmont)
update public.hotels set
  distance_from_haram_meters = 150,
  walk_time_minutes = 2,
  walk_time_minutes_max = 3,
  terrain_note = 'Elevator to mall level, then short flat exit',
  route_type = 'Elevator to mall level then short flat exit',
  accessibility_note = 'Air-conditioned indoor walk with elevator connections',
  elderly_family_suitability_note = 'Families & luxury'
where slug = 'makkah-clock-royal-tower' or name = 'Makkah Clock Royal Tower';

-- 11. Zamzam Pullman
update public.hotels set
  distance_from_haram_meters = 150,
  walk_time_minutes = 2,
  walk_time_minutes_max = 3,
  terrain_note = 'Indoor mall corridor straight to courtyard',
  route_type = 'Indoor mall corridor straight to courtyard',
  accessibility_note = 'Escalator and elevator access directly to lower plaza',
  elderly_family_suitability_note = 'Families & groups'
where slug = 'zamzam-pullman' or name = 'Zamzam Pullman';


-- ─────────────────────────────────────────────────────────────────────────
-- LEVEL 2: Easy 2-6 min flat walk
-- ─────────────────────────────────────────────────────────────────────────

-- 12. Swissôtel Makkah
update public.hotels set
  distance_from_haram_meters = 200,
  walk_time_minutes = 3,
  walk_time_minutes_max = 4,
  terrain_note = 'Air-conditioned mall walkways and escalators',
  route_type = 'Air-conditioned mall walkways and escalators',
  accessibility_note = 'Covered mall connection, sheltered from heat and traffic',
  elderly_family_suitability_note = 'Families & elderly'
where slug = 'swissotel-makkah' or name = 'Swissôtel Makkah';

-- 13. Jabal Omar Hyatt Regency
update public.hotels set
  distance_from_haram_meters = 200,
  walk_time_minutes = 3,
  walk_time_minutes_max = 3,
  terrain_note = 'Wide, flat street-level sidewalk',
  route_type = 'Wide, flat street-level sidewalk',
  accessibility_note = 'Pedestrian sidewalk, ramp access at entrance',
  elderly_family_suitability_note = 'Families & couples'
where slug = 'jabal-omar-hyatt-regency' or name = 'Jabal Omar Hyatt Regency';

-- 14. Conrad Jabal Omar
update public.hotels set
  distance_from_haram_meters = 250,
  walk_time_minutes = 3,
  walk_time_minutes_max = 4,
  terrain_note = 'Wide, smooth street path, minimal incline',
  route_type = 'Wide, smooth street path, minimal incline',
  accessibility_note = 'Level pedestrian walkway, smooth paving for strollers/wheelchairs',
  elderly_family_suitability_note = 'Families & couples'
where slug = 'conrad-jabal-omar' or name = 'Conrad Jabal Omar';

-- 15. Le Méridien Makkah
update public.hotels set
  distance_from_haram_meters = 250,
  walk_time_minutes = 3,
  walk_time_minutes_max = 4,
  terrain_note = 'Straight, flat sidewalk down Ajyad Street',
  route_type = 'Straight, flat sidewalk down Ajyad Street',
  accessibility_note = 'Paved sidewalk directly to King Abdulaziz Gate courtyard',
  elderly_family_suitability_note = 'Budget-conscious luxury'
where slug = 'le-meridien-makkah' or name = 'Le Méridien Makkah';

-- 16. Hilton Suites Makkah
update public.hotels set
  distance_from_haram_meters = 250,
  walk_time_minutes = 3,
  walk_time_minutes_max = 4,
  terrain_note = 'Indoor podium walkway or flat street access',
  route_type = 'Indoor podium walkway or flat street access',
  accessibility_note = 'Step-free podium connection with shopping galleria elevators',
  elderly_family_suitability_note = 'Families & long stays'
where slug = 'hilton-suites-makkah' or name = 'Hilton Suites Makkah';

-- 17. Makarem Ajyad
update public.hotels set
  distance_from_haram_meters = 300,
  walk_time_minutes = 4,
  walk_time_minutes_max = 5,
  terrain_note = 'Flat paved sidewalk along Ajyad Street',
  route_type = 'Flat paved sidewalk along Ajyad Street',
  accessibility_note = 'Paved pedestrian street, flat terrain all the way to gates',
  elderly_family_suitability_note = 'Traditional hospitality & groups'
where slug = 'makarem-ajyad' or name = 'Makarem Ajyad';

-- 18. Jabal Omar Marriott
update public.hotels set
  distance_from_haram_meters = 300,
  walk_time_minutes = 4,
  walk_time_minutes_max = 5,
  terrain_note = 'Level pedestrian walkway through Jabal Omar',
  route_type = 'Level pedestrian walkway through Jabal Omar',
  accessibility_note = 'Pedestrian boulevard, escalators available to Ibrahim Al Khalil St',
  elderly_family_suitability_note = 'Families & young travellers'
where slug = 'jabal-omar-marriott' or name = 'Jabal Omar Marriott';

-- 19. Jumeirah Jabal Omar
update public.hotels set
  distance_from_haram_meters = 350,
  walk_time_minutes = 5,
  walk_time_minutes_max = 5,
  terrain_note = 'Downhill going; slight uphill return',
  route_type = 'Downhill going, slight uphill return',
  accessibility_note = 'Paved street walkway, elevators through Jabal Omar podium',
  elderly_family_suitability_note = 'Luxury & active travellers'
where slug = 'jumeirah-jabal-omar' or name = 'Jumeirah Jabal Omar';

-- 20. Sheraton Jabal Al Kaaba
update public.hotels set
  distance_from_haram_meters = 400,
  walk_time_minutes = 5,
  walk_time_minutes_max = 6,
  terrain_note = 'Dedicated pedestrian bridge to northern expansion',
  route_type = 'Dedicated pedestrian bridge to northern expansion',
  accessibility_note = 'Pedestrian sky bridge with gentle ramp, avoids all vehicle traffic',
  elderly_family_suitability_note = 'Quiet location & northern expansion access'
where slug = 'sheraton-jabal-al-kaaba' or name = 'Sheraton Jabal Al Kaaba';

-- 21. Anjum Hotel Makkah
-- Note: Confirmed wording for pedestrian bridge access to King Fahd Gate
update public.hotels set
  distance_from_haram_meters = 450,
  walk_time_minutes = 5,
  walk_time_minutes_max = 7,
  terrain_note = 'Flat pedestrian bridge straight to King Fahd Gate',
  route_type = 'Flat pedestrian bridge straight to King Fahd Gate',
  accessibility_note = 'Direct private bridge to plaza, air-conditioned elevators and step-free path',
  elderly_family_suitability_note = 'Large families & groups'
where slug = 'anjum-hotel' or name = 'Anjum Hotel' or name = 'Anjum Hotel Makkah';


-- ─────────────────────────────────────────────────────────────────────────
-- LEVEL 3: Hills / long walk / shuttle-required
-- ─────────────────────────────────────────────────────────────────────────

-- 22. Hilton Convention Makkah
update public.hotels set
  distance_from_haram_meters = 450,
  walk_time_minutes = 6,
  walk_time_minutes_max = 8,
  terrain_note = 'Elevated location; steep uphill return',
  route_type = 'Elevated location; steep uphill return',
  accessibility_note = 'Street walkway with incline; hotel buggy assistance available',
  elderly_family_suitability_note = 'Business travellers & active pilgrims'
where slug = 'hilton-convention-makkah' or name = 'Hilton Convention Makkah';

-- 23. Address Jabal Omar
update public.hotels set
  distance_from_haram_meters = 550,
  walk_time_minutes = 7,
  walk_time_minutes_max = 9,
  terrain_note = 'High position on hill; noticeable uphill climb returning',
  route_type = 'High position on hill; noticeable uphill climb returning',
  accessibility_note = 'Elevated plaza & road; internal complex shuttle/buggies available',
  elderly_family_suitability_note = 'Luxury seekers comfortable with slight hills'
where slug = 'address-jabal-omar' or name = 'Address Jabal Omar';

-- 24. Maysan Al Maqam
update public.hotels set
  distance_from_haram_meters = 650,
  walk_time_minutes = 8,
  walk_time_minutes_max = 10,
  terrain_note = 'Mostly flat with a short sloped approach',
  route_type = 'Mostly flat with a short sloped approach',
  accessibility_note = 'Street pavement, moderate walk suitable for able-bodied pilgrims',
  elderly_family_suitability_note = 'Value travellers'
where slug = 'maysan-al-maqam' or name = 'Maysan Al Maqam';

-- 25. DoubleTree Jabal Omar
update public.hotels set
  distance_from_haram_meters = 650,
  walk_time_minutes = 8,
  walk_time_minutes_max = 10,
  terrain_note = 'Continuous steady slope walking back',
  route_type = 'Continuous steady slope walking back',
  accessibility_note = 'Road sidewalk with incline, complimentary buggy service in complex',
  elderly_family_suitability_note = 'Budget-conscious families'
where slug = 'doubletree-jabal-omar' or name = 'DoubleTree Jabal Omar';

-- 26. Emaar Grand Hotel
update public.hotels set
  distance_from_haram_meters = 800,
  walk_time_minutes = 10,
  walk_time_minutes_max = 12,
  terrain_note = 'Long walk down Ibrahim Al Khalil Street; gradual incline back',
  route_type = 'Long walk down Ibrahim Al Khalil Street',
  accessibility_note = 'Sidewalk & periodic shuttle services, steady pedestrian traffic',
  elderly_family_suitability_note = 'Budget travellers'
where slug = 'emaar-grand-hotel' or name = 'Emaar Grand Hotel';

-- 27. Al Kiswah Towers
update public.hotels set
  distance_from_haram_meters = 1500,
  walk_time_minutes = 15,
  walk_time_minutes_max = 20,
  terrain_note = 'Steep roads & tunnels; 5-min free shuttle recommended',
  route_type = 'Steep roads and tunnels',
  accessibility_note = '24/7 complimentary shuttle recommended; too far for elderly walking',
  shuttle_available = true,
  shuttle_note = '24/7 complimentary shuttle to Haram plaza',
  elderly_family_suitability_note = 'Economy groups & budget travellers'
where slug = 'al-kiswah-towers' or name = 'Al Kiswah Towers';

-- 28. voco Makkah
update public.hotels set
  distance_from_haram_meters = 1800,
  walk_time_minutes = 20,
  walk_time_minutes_max = 25,
  terrain_note = 'Too far for foot travel; 24/7 hotel shuttle required',
  route_type = 'Ring road location — vehicle transit only',
  accessibility_note = '24/7 complimentary hotel shuttle required (5-8 min drop-off at Kudai/Ajyad)',
  shuttle_available = true,
  shuttle_note = '24/7 complimentary hotel shuttle service to Haram bus terminus',
  elderly_family_suitability_note = 'Value & modern comfort'
where slug = 'voco-makkah' or name = 'voco Makkah';

-- 29. Time Ruba Hotel & Suites
update public.hotels set
  distance_from_haram_meters = 6000,
  terrain_note = 'Driving distance; scheduled bus or taxi service required',
  route_type = 'Driving distance along highway',
  accessibility_note = 'Scheduled shuttle or taxi required for all prayer visits',
  shuttle_available = true,
  shuttle_note = 'Scheduled bus service during prayer times',
  elderly_family_suitability_note = 'Long-term & budget stays'
where slug = 'time-ruba-hotel-and-suites' or name = 'Time Ruba Hotel & Suites';


-- ─────────────────────────────────────────────────────────────────────────
-- KEY MADINAH HOTELS (Supporting package detail "Your Stay" cards)
-- ─────────────────────────────────────────────────────────────────────────

update public.hotels set
  route_type = coalesce(route_type, 'Level, pedestrian-only northern courtyard'),
  accessibility_note = coalesce(accessibility_note, 'Step-free pavement, 4-min walk to Northern Courtyard (Gate 328)'),
  elderly_family_suitability_note = coalesce(elderly_family_suitability_note, 'Families & elderly pilgrims')
where slug like '%zowar%' or name like '%Zowar%';

update public.hotels set
  route_type = coalesce(route_type, 'Direct front-row courtyard entrance'),
  accessibility_note = coalesce(accessibility_note, 'Direct step-free access to Prophet''s Mosque plaza, zero street crossings'),
  elderly_family_suitability_note = coalesce(elderly_family_suitability_note, 'Elderly & luxury travellers')
where slug like '%dar-al-taqwa%' or name like '%Dar Al Taqwa%';

update public.hotels set
  route_type = coalesce(route_type, 'Short pedestrian walk facing Bab As-Salam'),
  accessibility_note = coalesce(accessibility_note, 'Immediate courtyard entry, smooth marble walkway'),
  elderly_family_suitability_note = coalesce(elderly_family_suitability_note, 'Families & senior pilgrims')
where slug like '%millennium-taiba%' or name like '%Millennium Taiba%';

update public.hotels set
  route_type = coalesce(route_type, 'Level street-level pedestrian walkway'),
  accessibility_note = coalesce(accessibility_note, 'Vehicle-free courtyard approach, gentle ramp access'),
  elderly_family_suitability_note = coalesce(elderly_family_suitability_note, 'Couples & families')
where slug like '%saja%' or name like '%Saja%';
