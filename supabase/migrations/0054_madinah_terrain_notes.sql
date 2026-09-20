-- Migration: 0054_madinah_terrain_notes.sql
-- Adds "Path & Terrain" (terrain_note) for Madinah hotels — same field and
-- card placement as the Makkah dataset (0044_hotel_walk_terrain_real_data.sql).
-- Madinah has no client-provided walk/terrain table like Makkah's, so
-- nothing here is invented: each note is a direct compression of that same
-- hotel's own route_type, nearest-gate, and accessibility_note/description
-- fields already seeded in 0026_seed_madinah_hotels.sql.
--
-- Only covers the 12 hotels seeded with data_confidence 'verified' or
-- 'estimated'. Deliberately skips the two 'needs_verification' hotels
-- (Golden Tulip Al Shakreen, Golden Tulip Al-Zahabi) and the six
-- no-data placeholder rows — stating an unconfirmed route as fact on a
-- "Path & Terrain" card would be worse than leaving it blank.
--
-- Apply manually in Supabase SQL Editor.

update public.hotels set terrain_note = 'Flat paved plaza approach, moments from King Fahd Gate and Gate 25.'
where slug = 'madinah-hilton';

update public.hotels set terrain_note = 'Flat, shaded walk to the northern side gates.'
where slug = 'sofitel-shahd-al-madinah';

update public.hotels set terrain_note = 'Directly opposite King Fahd Gate (23) — the shortest, flattest route in this set.'
where slug = 'dar-al-taqwa';

update public.hotels set terrain_note = 'Flat pedestrian plaza approach via the eastern side, near the Baqi'' cemetery.'
where slug = 'intercontinental-dar-al-hijra-madinah';

update public.hotels set terrain_note = 'Flat approach directly opposite Bab As-Salam — the busiest, most crowded frontage in this set.'
where slug = 'pullman-zamzam-madina';

update public.hotels set terrain_note = 'Flat route through the attached Bin Dawood mall, opposite Omar bin Khattab Gate.'
where slug = 'anwar-al-madinah-movenpick';

update public.hotels set terrain_note = 'Wide, well-maintained plaza by Bab Al-Malik Fahd, vehicle-free at prayer times.'
where slug = 'crowne-plaza-madinah';

update public.hotels set terrain_note = 'Flat route to Gate 328, easy even for families with children.'
where slug = 'saja-by-warwick-madinah';

update public.hotels set terrain_note = 'Flat route through the Badhaah district shopping streets.'
where slug = 'makarem-burj-al-madinah';

update public.hotels set terrain_note = 'Flat, well-lit streets to the Roza side.'
where slug = 'elaf-al-taqwa';

update public.hotels set terrain_note = 'Flat southern approach, with a scheduled shuttle available at prayer times.'
where slug = 'al-manakha-rotana-madinah';

update public.hotels set terrain_note = 'Flat route through the Masjid Al Ghamamah commercial strip, near King Saud Gate.'
where slug = 'emaar-mektan';
