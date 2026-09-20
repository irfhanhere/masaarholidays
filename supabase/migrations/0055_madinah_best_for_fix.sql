-- Migration: 0055_madinah_best_for_fix.sql
-- Fixes "Best for" (elderly_family_suitability_note) for Madinah hotels —
-- it was showing terrain/route descriptions instead of audience info
-- (e.g. Makarem Burj Al Madinah's "Best for" read "Flat route through the
-- Badhaah district shopping streets", which is now covered separately by
-- Path & Terrain / terrain_note from 0054). Each value below is drawn
-- directly from that same hotel's own research notes already in
-- 0026_seed_madinah_hotels.sql (description/accessibility_note/
-- admin_caution_note) — not invented. Where the source notes an explicit
-- caution (e.g. less convenient for elderly/solo women), the value here
-- reflects that honestly rather than defaulting to "Families & elderly".
--
-- Unconditional UPDATEs (not coalesce) so the final value is correct
-- regardless of whatever is currently stored.
--
-- Apply manually in Supabase SQL Editor.

update public.hotels set elderly_family_suitability_note = 'Families & elderly'
where slug = 'madinah-hilton';

update public.hotels set elderly_family_suitability_note = 'Families & elderly'
where slug = 'sofitel-shahd-al-madinah';

update public.hotels set elderly_family_suitability_note = 'Elderly & reduced mobility'
where slug = 'dar-al-taqwa';

update public.hotels set elderly_family_suitability_note = 'Families & elderly'
where slug = 'intercontinental-dar-al-hijra-madinah';

update public.hotels set elderly_family_suitability_note = 'Business travellers & groups'
where slug = 'pullman-zamzam-madina';

update public.hotels set elderly_family_suitability_note = 'General travellers'
where slug = 'anwar-al-madinah-movenpick';

update public.hotels set elderly_family_suitability_note = 'Families & elderly'
where slug = 'crowne-plaza-madinah';

update public.hotels set elderly_family_suitability_note = 'Families & elderly'
where slug = 'saja-by-warwick-madinah';

update public.hotels set elderly_family_suitability_note = 'Families, especially ladies'' access'
where slug = 'makarem-burj-al-madinah';

update public.hotels set elderly_family_suitability_note = 'Families & general travellers'
where slug = 'elaf-al-taqwa';

update public.hotels set elderly_family_suitability_note = 'Value-conscious families'
where slug = 'al-manakha-rotana-madinah';

update public.hotels set elderly_family_suitability_note = 'Budget-conscious travellers'
where slug = 'emaar-mektan';
