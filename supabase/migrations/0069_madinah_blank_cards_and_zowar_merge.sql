-- Migration: 0069_madinah_blank_cards_and_zowar_merge.sql
--
-- Fixes two live /hotels issues found on the Madinah tab:
--   1. Six hotel rows rendering with completely or mostly blank cards
--      (no image, no gate-walk data, sometimes no price).
--   2. A stale duplicate row ("Zowar International Hotel") for the same
--      property as the already-populated "Zowar Alalami" row.
--
-- Same honesty rules as 0068_reconcile_makkah_madinah_hotel_details.sql:
-- never invent a number, "not stated"/null for anything not confirmed,
-- coalesce(existing_column, new_value) so a new figure only fills a
-- genuinely empty field (never overwrites existing data, even when the
-- new figure looks more precise — see the discrepancy notes below),
-- data_confidence = 'needs_verification' for everything sourced from
-- halalbooking.com (a third-party OTA, not a confirmed supplier rate).
-- admin_caution_note is always APPENDED (never overwritten).
--
-- ============================================================
-- PART 0 — ZOWAR DUPLICATE MERGE (do this before touching hotel data)
-- ============================================================
-- "Zowar International Hotel" (slug zowar-international) and "Zowar
-- Alalami" (slug zowar-alalami) are the same property — Zowar Alalami is
-- the current name on halalbooking.com; Zowar International is an older
-- name still used by Hotels.com/Kayak/Momondo. zowar-international is
-- entirely blank (no data ever added) while zowar-alalami already carries
-- real research-round data from 0068 — so zowar-alalami is the row to
-- keep.
--
-- Checked for references before deleting, per instructions:
--   - public.package_hotels: none (empty result for zowar-international's id)
--   - public.hotel_rooms: none
--   - public.enquiries: no hotel foreign key exists on this table at all
--     (it only stores free-text page_source/message fields), so there is
--     nothing to check or repoint there
--   - public.umrah_inventory_configurations: **7 rows** reference
--     zowar-international as their madinah_hotel_id (madinah_hotel_id_alt
--     was null on all 7, so nothing to repoint there). This is a real,
--     live reference — deleting the row outright would have silently set
--     these 7 package configs' Madinah hotel to null (on delete set null).
--     So this is a MERGE, not a plain delete: repoint those 7 references
--     to zowar-alalami first, then delete the now fully-unreferenced
--     zowar-international row.

update public.umrah_inventory_configurations
set madinah_hotel_id = (select id from public.hotels where slug = 'zowar-alalami')
where madinah_hotel_id = (select id from public.hotels where slug = 'zowar-international');

update public.umrah_inventory_configurations
set madinah_hotel_id_alt = (select id from public.hotels where slug = 'zowar-alalami')
where madinah_hotel_id_alt = (select id from public.hotels where slug = 'zowar-international');

delete from public.hotels where slug = 'zowar-international';


-- ============================================================
-- PART 1 — THE SIX GENUINELY INCOMPLETE HOTELS
-- Sourced from each hotel's own halalbooking.com property page.
-- ============================================================

-- Millennium Taiba Hotel. This also resolves 0068's open question on
-- "Grand Millennium Al Haram Hotel" (is it a duplicate of this row or of
-- "Dar Aleiman Al Haram"?) — this hotel's real address (Omar Bin Al
-- Khattab Road, Madinah 41422) does not match Grand Millennium's (Abi Zar
-- Street, Markaziah, Madinah 42311), ruling this one out. See the
-- follow-up note added to grand-millennium-al-haram below.
update public.hotels set
  star_rating = coalesce(star_rating, 4),
  description = coalesce(description, 'A 4-star hotel on Omar Bin Al Khattab Road with a 9.7/10 guest rating, offering east-facing Haram-view rooms.'),
  view_type = coalesce(view_type, 'Haram View, East-facing'),
  mens_gate_walk_minutes_min = coalesce(mens_gate_walk_minutes_min, 9),
  ladies_gate_walk_minutes_min = coalesce(ladies_gate_walk_minutes_min, 11),
  image_url = coalesce(image_url, 'https://cdn.halalstatic.com/expedia%2F93000000%2F92400000%2F92398000%2F92397967%2F92d5b19a_z.jpg'),
  gallery_image_urls = coalesce(nullif(gallery_image_urls, '{}'::text[]), ARRAY['https://cdn.halalstatic.com/expedia%2F93000000%2F92400000%2F92398000%2F92397967%2F92d5b19a_z.jpg']::text[]),
  google_maps_url = coalesce(google_maps_url, 'https://www.google.com/maps/search/?api=1&query=Millennium%20Taiba%20Hotel%2C%20Omar%20Bin%20Al%20Khattab%20Road%2C%20Madinah%2041422%2C%20Saudi%20Arabia'),
  data_confidence = coalesce(data_confidence, 'needs_verification'),
  admin_caution_note = case
    when admin_caution_note is null or admin_caution_note = '' then 'Room types seen on the property page (Deluxe Room, Deluxe Studio, Executive Room, Junior Studio Suite — all Haram-view) but no prices were shown — price_from_aed deliberately left blank rather than guessed. This also resolves 0068''s earlier "possible duplicate" flag on "Grand Millennium Al Haram Hotel": this hotel''s real address (Omar Bin Al Khattab Road, Madinah 41422) does not match Grand Millennium''s (Abi Zar Street, Markaziah, Madinah 42311) — different properties, not a duplicate. Source: https://halalbooking.com/en/millennium-taiba-hotel/p/597846'
    else admin_caution_note || E'\n\n' || 'Room types seen on the property page (Deluxe Room, Deluxe Studio, Executive Room, Junior Studio Suite — all Haram-view) but no prices were shown — price_from_aed deliberately left blank rather than guessed. This also resolves 0068''s earlier "possible duplicate" flag on "Grand Millennium Al Haram Hotel": this hotel''s real address (Omar Bin Al Khattab Road, Madinah 41422) does not match Grand Millennium''s (Abi Zar Street, Markaziah, Madinah 42311) — different properties, not a duplicate. Source: https://halalbooking.com/en/millennium-taiba-hotel/p/597846'
  end
where slug = 'millennium-taiba';

-- Follow-up on "Grand Millennium Al Haram Hotel" — Millennium Taiba is now
-- ruled out as its duplicate (see above); "Dar Aleiman Al Haram" remains
-- the only unresolved candidate, and a direct search this round found no
-- independent listing under that exact name to confirm or rule it out
-- either way.
update public.hotels set
  admin_caution_note = admin_caution_note || E'\n\n' || 'Follow-up: "Millennium Taiba Hotel" has since been independently confirmed as a different property (Omar Bin Al Khattab Road, Madinah 41422 — see that row) — ruled out as this row''s duplicate. "Dar Aleiman Al Haram" remains the only unresolved candidate; a direct search this round found no independent listing under that exact name to confirm or rule it out.'
where slug = 'grand-millennium-al-haram';

-- Ancyra Hotel by Continent
update public.hotels set
  price_from_aed = coalesce(price_from_aed, 292.30),
  view_type = coalesce(view_type, 'No Haram-view rooms'),
  mens_gate_walk_minutes_min = coalesce(mens_gate_walk_minutes_min, 9),
  ladies_gate_walk_minutes_min = coalesce(ladies_gate_walk_minutes_min, 13),
  image_url = coalesce(image_url, 'https://cdn.halalstatic.com/2026%2F02%2F12%2F13%2F40%2F07%2F88bd1e5c-e14e-4795-a5ab-4ad31a7fc269%2F128__uZ0AAcvqJM6yLBrw33pvQ.jpg'),
  gallery_image_urls = coalesce(nullif(gallery_image_urls, '{}'::text[]), ARRAY['https://cdn.halalstatic.com/2026%2F02%2F12%2F13%2F40%2F07%2F88bd1e5c-e14e-4795-a5ab-4ad31a7fc269%2F128__uZ0AAcvqJM6yLBrw33pvQ.jpg']::text[]),
  google_maps_url = coalesce(google_maps_url, 'https://www.google.com/maps/search/?api=1&query=Ancyra%20Hotel%20by%20Continent%2C%20AL%20MADINAH%2C%2041236%2C%20Medina%2C%20Saudi%20Arabia'),
  admin_caution_note = admin_caution_note || E'\n\n' || 'Independently sourced this round via the hotel''s own halalbooking.com property page (star rating still not stated there either — left blank rather than guessed). From EUR 74/night, converted at ~3.95 AED/EUR (indicative only, not a confirmed supplier rate). Source: https://halalbooking.com/en/ancyra-hotel-by-continent-%D9%81%D9%86%D8%AF%D9%82-%D8%A7%D9%86%D9%83%D9%8A%D8%B1%D8%A7/p/769479'
where slug = 'ancyra-hotel-by-continent';

-- ODST Al Madinah Hotel
update public.hotels set
  star_rating = coalesce(star_rating, 3),
  description = coalesce(description, 'A 3-star hotel in Bada''ah with a 7.2/10 guest rating (87 reviews); no Haram-view rooms.'),
  price_from_aed = coalesce(price_from_aed, 347.60),
  view_type = coalesce(view_type, 'No Haram-view rooms'),
  mens_gate_walk_minutes_min = coalesce(mens_gate_walk_minutes_min, 9),
  ladies_gate_walk_minutes_min = coalesce(ladies_gate_walk_minutes_min, 8),
  image_url = coalesce(image_url, 'https://cdn.halalstatic.com/2024%2F02%2F29%2F14%2F00%2F04%2Fa5b350d8-863c-4d3b-ae2b-eb8d68a593a3%2F83129_t9rSH0RMwt8CSOT6JWerNA.jpg'),
  gallery_image_urls = coalesce(nullif(gallery_image_urls, '{}'::text[]), ARRAY['https://cdn.halalstatic.com/2024%2F02%2F29%2F14%2F00%2F04%2Fa5b350d8-863c-4d3b-ae2b-eb8d68a593a3%2F83129_t9rSH0RMwt8CSOT6JWerNA.jpg']::text[]),
  google_maps_url = coalesce(google_maps_url, 'https://www.google.com/maps/search/?api=1&query=ODST%20Al%20Madinah%20Hotel%2C%20FJF5%2BC9G%2C%20Bada%27ah%2C%20Madinah%2042311%2C%20Saudi%20Arabia'),
  admin_caution_note = admin_caution_note || E'\n\n' || 'Independently verified this round via the hotel''s own halalbooking.com property page — supersedes the earlier "no independently-verified data found" note above. From EUR 88/night, converted at ~3.95 AED/EUR (indicative only, not a confirmed supplier rate). Source: https://halalbooking.com/en/odst-al-madinah/p/607645'
where slug = 'odst-almadina';

-- Waqf Outhman Bin Affan Hotel — no usable image URL found this round,
-- image_url deliberately left null rather than guessed.
update public.hotels set
  star_rating = coalesce(star_rating, 1),
  description = coalesce(description, 'A 1-star hotel on King Faisal Road with an 8.5/10 guest rating (82 reviews); no Haram-view rooms.'),
  price_from_aed = coalesce(price_from_aed, 347.60),
  view_type = coalesce(view_type, 'No Haram-view rooms'),
  mens_gate_walk_minutes_min = coalesce(mens_gate_walk_minutes_min, 11),
  ladies_gate_walk_minutes_min = coalesce(ladies_gate_walk_minutes_min, 11),
  google_maps_url = coalesce(google_maps_url, 'https://www.google.com/maps/search/?api=1&query=Waqf%20Outhman%20Bin%20Affan%20Hotel%2C%202475%20King%20Faisal%20Road%20-%20First%20Ring%2C%20Madinah%2C%20Saudi%20Arabia'),
  admin_caution_note = admin_caution_note || E'\n\n' || 'Independently verified this round via the hotel''s own halalbooking.com property page — supersedes the earlier "no independently-verified data found" note above. No usable image URL was found this round; image_url deliberately left blank rather than guessed. From EUR 88/night, converted at ~3.95 AED/EUR (indicative only, not a confirmed supplier rate). Source: https://halalbooking.com/en/waqf-outhman-bin-affan-hotel/p/607720'
where slug = 'waqf-outhman';

-- Golden Tulip Al Shakreen — enriches an existing partial row (already
-- had a broad 1-10 min range on file for both gates). Its own property
-- page gives a more precise pair of figures (Men's 5 min/350m, Ladies'
-- 14 min/900m) — per the coalesce rule these do NOT overwrite the
-- existing non-null 1-10 range; flagged in admin_caution_note instead so
-- an admin can decide whether to replace the vague range manually. No
-- lead price was found on the source for this hotel this round, so
-- price_from_aed is left untouched.
update public.hotels set
  view_type = coalesce(view_type, 'No Haram-view rooms'),
  google_maps_url = coalesce(google_maps_url, 'https://www.google.com/maps/search/?api=1&query=Golden%20Tulip%20Al%20Shakreen%2C%20Abu%20Ayoub%20Al%20Ansari%20Street%2C%20Central%2C%20opp.%20Bab%20Al-Salam%2C%20Madinah%2042311%2C%20Saudi%20Arabia'),
  admin_caution_note = admin_caution_note || E'\n\n' || 'This hotel''s own halalbooking.com property page gives more precise gate-walk figures (Men''s 5 min/350m, Ladies'' 14 min/900m) than the broad "1-10 min" range already on file for both gates — NOT applied here per the coalesce rule (existing non-null values preserved). The 14-min ladies'' figure is notably longer than the 5-min men''s figure — worth flagging for women travelling alone if these more precise numbers are adopted. Buffet breakfast (SAR 50/adult) and self-parking (SAR 100/night) are extra, not included. No lead price was found on the source this round. Source: https://halalbooking.com/en/golden-tulip-al-shakreen/p/78415'
where slug = 'golden-tulip-al-shakreen';

-- Golden Tulip Al-Zahabi — enriches an existing partial row (men's gate
-- was entirely missing; ladies' gate already had 8-10 min on file, which
-- also drives its primary_gate badge). No lead price was found on the
-- source for this hotel this round, so price_from_aed is left untouched.
update public.hotels set
  view_type = coalesce(view_type, 'Haram View, South-facing (Triple and Double rooms)'),
  mens_gate_walk_minutes_min = coalesce(mens_gate_walk_minutes_min, 6),
  google_maps_url = coalesce(google_maps_url, 'https://www.google.com/maps/search/?api=1&query=Golden%20Tulip%20Al-Zahabi%2C%20The%20Northern%20Central%20Area%2C%20Madinah%2055555%2C%20Saudi%20Arabia'),
  admin_caution_note = admin_caution_note || E'\n\n' || 'Men''s gate walk time (6 min/379m) was missing and has been filled in from the hotel''s own halalbooking.com property page. That same source also gives a ladies'' gate figure of 4 min/250m — notably shorter than the 8-10 min range already on file (which drives this hotel''s primary_gate badge) — NOT applied here per the coalesce rule (existing non-null value preserved); worth a manual re-check, since if 4 min is correct this hotel is actually much closer for women than currently displayed. Property policy: couples wishing to share a room must provide proof of marriage — worth surfacing in booking guidance. No lead price was found on the source this round. Source: https://halalbooking.com/en/golden-tulip-al-zahabi/p/78618'
where slug = 'golden-tulip-al-zahabi';


-- ============================================================
-- PART 2 — ADDITIONAL GAPS FOUND DURING THE LIVE-LIST AUDIT
-- Requested follow-up: after fixing the six named hotels, the full
-- current Madinah list (25 rows, not 22 — three inactive rows were added
-- by 0068) was queried directly rather than trusting an earlier partial
-- scroll. Three more rows were missing 2 of the 3 audited fields
-- (image_url, gate-walk data, price_from_aed) despite already having
-- other real data on file, so they were researched the same way:
-- ============================================================

-- Elaf Al Taqwa — already had gate-walk data (5-10 min both gates,
-- verified) and a real description; was missing image_url and
-- price_from_aed. The source gives more precise (but different) gate
-- figures — not applied, per the coalesce rule.
update public.hotels set
  price_from_aed = coalesce(price_from_aed, 817.57),
  image_url = coalesce(image_url, 'https://cdn.halalstatic.com/expedia%2F83000000%2F82800000%2F82793900%2F82793828%2Fbf6f5915_z.jpg'),
  gallery_image_urls = coalesce(nullif(gallery_image_urls, '{}'::text[]), ARRAY['https://cdn.halalstatic.com/expedia%2F83000000%2F82800000%2F82793900%2F82793828%2Fbf6f5915_z.jpg']::text[]),
  google_maps_url = coalesce(google_maps_url, 'https://www.google.com/maps/search/?api=1&query=Elaf%20Al%20Taqwa%20Hotel%2C%20Prince%20Abdul%20Mohsen%20Road%2C%206411%2C%20Madinah%2C%20Madinah%20(province)%2C%2042311%2C%20Saudi%20Arabia'),
  admin_caution_note = case
    when admin_caution_note is null or admin_caution_note = '' then 'Live halalbooking.com search (1 Nov 2026, 2 adults, 1 night) found gate-walk figures (Men''s 8 min/500m, Ladies'' 14 min/900m) that differ from the 5-10 min range already on file for both gates — NOT applied here per the coalesce rule (existing non-null values preserved). Cheapest room found: Standard Twin Room, room-only, total INR 18,477 (~AED 817.57 at ~22.60 INR/AED) for the sample date above — used for price_from_aed; this is an indicative live search price, not a confirmed supplier rate. Source: https://halalbooking.com/en/elaf-al-taqwa-hotel/p/503963'
    else admin_caution_note || E'\n\n' || 'Live halalbooking.com search (1 Nov 2026, 2 adults, 1 night) found gate-walk figures (Men''s 8 min/500m, Ladies'' 14 min/900m) that differ from the 5-10 min range already on file for both gates — NOT applied here per the coalesce rule (existing non-null values preserved). Cheapest room found: Standard Twin Room, room-only, total INR 18,477 (~AED 817.57 at ~22.60 INR/AED) for the sample date above — used for price_from_aed; this is an indicative live search price, not a confirmed supplier rate. Source: https://halalbooking.com/en/elaf-al-taqwa-hotel/p/503963'
  end
where slug = 'elaf-al-taqwa';

-- Emaar Mektan — already had gate-walk data (4-5 min men's, 8-10 min
-- ladies', estimated) and a real description; was missing image_url,
-- price_from_aed and google_maps_url.
update public.hotels set
  price_from_aed = coalesce(price_from_aed, 1235.35),
  image_url = coalesce(image_url, 'https://cdn.halalstatic.com/expedia%2F99000000%2F98480000%2F98473800%2F98473791%2F9562286b_z.jpg'),
  gallery_image_urls = coalesce(nullif(gallery_image_urls, '{}'::text[]), ARRAY['https://cdn.halalstatic.com/expedia%2F99000000%2F98480000%2F98473800%2F98473791%2F9562286b_z.jpg']::text[]),
  google_maps_url = coalesce(google_maps_url, 'https://www.google.com/maps/search/?api=1&query=Emaar%20Mektan%2C%20Al%20Salam%20Street%20West%20Area%2C%20Madinah%2C%20Madinah%20(province)%2C%2041421%2C%20Saudi%20Arabia'),
  admin_caution_note = case
    when admin_caution_note is null or admin_caution_note = '' then 'Live halalbooking.com search (1 Nov 2026, 2 adults, 1 night) found gate-walk figures (Men''s 12 min/800m, Ladies'' 15 min/950m) considerably longer than the 4-5 min/8-10 min already on file for both gates — NOT applied here per the coalesce rule (existing non-null values preserved); worth a manual re-check given the size of the gap. Cheapest room found: Standard Double/Twin Room, room-only, total INR 27,909 after the site''s advertised 40% public discount (~AED 1,235.35 at ~22.60 INR/AED) for the sample date above — used for price_from_aed; indicative only, not a confirmed supplier rate, and the discount may not always apply. Source: https://halalbooking.com/en/emaar-mektan/p/653203'
    else admin_caution_note || E'\n\n' || 'Live halalbooking.com search (1 Nov 2026, 2 adults, 1 night) found gate-walk figures (Men''s 12 min/800m, Ladies'' 15 min/950m) considerably longer than the 4-5 min/8-10 min already on file for both gates — NOT applied here per the coalesce rule (existing non-null values preserved); worth a manual re-check given the size of the gap. Cheapest room found: Standard Double/Twin Room, room-only, total INR 27,909 after the site''s advertised 40% public discount (~AED 1,235.35 at ~22.60 INR/AED) for the sample date above — used for price_from_aed; indicative only, not a confirmed supplier rate, and the discount may not always apply. Source: https://halalbooking.com/en/emaar-mektan/p/653203'
  end
where slug = 'emaar-mektan';

-- Makarem Burj Al Madinah — already had a ladies'-gate figure (4-6 min,
-- estimated) and a real description; was missing men's-gate data,
-- image_url, price_from_aed and google_maps_url. The source also lists
-- this hotel as 5-star, vs. the 4-star already on file — not changed,
-- per the coalesce rule, but flagged since it's a notable discrepancy.
update public.hotels set
  mens_gate_walk_minutes_min = coalesce(mens_gate_walk_minutes_min, 7),
  price_from_aed = coalesce(price_from_aed, 947.61),
  image_url = coalesce(image_url, 'https://cdn.halalstatic.com/expedia%2F111000000%2F110620000%2F110617700%2F110617682%2Fw6945h4628x0y0-9c2c3375_z.jpg'),
  gallery_image_urls = coalesce(nullif(gallery_image_urls, '{}'::text[]), ARRAY['https://cdn.halalstatic.com/expedia%2F111000000%2F110620000%2F110617700%2F110617682%2Fw6945h4628x0y0-9c2c3375_z.jpg']::text[]),
  google_maps_url = coalesce(google_maps_url, 'https://www.google.com/maps/search/?api=1&query=Makarem%20Burj%20Al%20Madinah%2C%207008%20Mosaab%20Bin%20Omair%20Badaah%2042311%2C%20Madinah%2C%20Madinah%20(province)%2C%2042311%2C%20Saudi%20Arabia'),
  admin_caution_note = case
    when admin_caution_note is null or admin_caution_note = '' then 'Live halalbooking.com search (27 Sep 2026, 2 adults, 1 night) lists this hotel as 5-star, vs. the 4-star rating already on file — NOT changed here per the coalesce rule (existing non-null star_rating preserved); worth confirming which is correct. Men''s gate walk time (7 min/423m) was missing and has been filled in from this source. Cheapest room found: Deluxe Room (1 King Bed), room-only, total INR 21,416 (~AED 947.61 at ~22.60 INR/AED) for the sample date above — used for price_from_aed; indicative only, not a confirmed supplier rate. Source: https://halalbooking.com/en/makarem-burj-al-madinah-hotel-and-suites/p/768909'
    else admin_caution_note || E'\n\n' || 'Live halalbooking.com search (27 Sep 2026, 2 adults, 1 night) lists this hotel as 5-star, vs. the 4-star rating already on file — NOT changed here per the coalesce rule (existing non-null star_rating preserved); worth confirming which is correct. Men''s gate walk time (7 min/423m) was missing and has been filled in from this source. Cheapest room found: Deluxe Room (1 King Bed), room-only, total INR 21,416 (~AED 947.61 at ~22.60 INR/AED) for the sample date above — used for price_from_aed; indicative only, not a confirmed supplier rate. Source: https://halalbooking.com/en/makarem-burj-al-madinah-hotel-and-suites/p/768909'
  end
where slug = 'makarem-burj-al-madinah';

-- "Dar Aleiman Al Haram" was also checked (all 3 audited fields blank,
-- inactive, already flagged as a possible duplicate since 0068) — a
-- direct search this round found no independent listing under this exact
-- name on halalbooking.com or elsewhere. Left entirely as-is: it already
-- carries data_confidence = 'needs_verification' and an honest
-- admin_caution_note explaining why nothing could be added. No SQL
-- statement needed for this row.
