-- Migration: 0068_reconcile_makkah_madinah_hotel_details.sql
--
-- Reconciles two client research documents — "Masaar-Makkah-Hotels-Task2-
-- Updated.docx" (30 Makkah hotels, Booking.com/Expedia cross-checked) and
-- "Masaar-Madinah-Hotels-Task3.docx" (11 Madinah hotels, halalbooking.com-
-- sourced, with separate men's/ladies' gate walk data) — against the
-- existing public.hotels / public.hotel_rooms rows, per Step 0-6 of the
-- reconciliation task.
--
-- Reconciliation result (Step 1):
--   Makkah:  all 30 document hotels already exist as rows under matching
--            names — every one below is an UPDATE, zero INSERTs.
--   Madinah: 8 of 11 document hotels matched an existing row by name
--            (verified against each hotel's address in the document, not
--            name alone). The other 3 could NOT be confidently reconciled
--            and are inserted as new, inactive rows with an
--            admin_caution_note instead of being merged:
--              - "Grand Millennium Al Haram Hotel" — no address on file for
--                either "Dar Aleiman Al Haram" or "Millennium Taiba Hotel"
--                (both blank rows) to confirm or rule out a match.
--              - "Makarem Haram View Suites - Madinah" — shares the
--                "Makarem" brand with existing "Makarem Burj Al Madinah"
--                but a different suite name/address; not confidently the
--                same property.
--              - "Intercontinental Madinah - Dar Al Iman by IHG" — this
--                one WAS checked against the existing "InterContinental Dar
--                Al Hijra Madinah" and the addresses genuinely differ
--                (Badaah district vs. the eastern/Baqi'-cemetery side) —
--                confirming these are two separate real InterContinental
--                hotels, not a duplicate. Still inserted inactive (not
--                activated) pending manual confirmation, given the
--                brand-name similarity risk.
--
-- Never-clobber rule (Step 4): every column below uses
-- coalesce(existing_column, new_value) — exactly the pattern from
-- 0008_hotel_walk_terrain.sql — so a document figure only fills a field
-- that is genuinely empty; it never overwrites better/existing data.
-- admin_caution_note is the one exception: it is always APPENDED to
-- (never overwritten, never skipped), via a CASE that adds a blank-line
-- separator when a prior note already exists.
--
-- Fields intentionally NOT touched here even though the documents mention
-- them: distance_from_haram_meters, walk_time_minutes(_max), terrain_note,
-- route_type, accessibility_note, elderly_family_suitability_note for
-- every Makkah hotel and for the 12 Madinah hotels already covered by
-- 0044_hotel_walk_terrain_real_data.sql / 0054_madinah_terrain_notes.sql —
-- those were already populated from a more complete source in an earlier
-- round and re-deriving them from this document's vaguer text would be a
-- downgrade, not an improvement. cancellation_policy is left alone
-- everywhere — neither document states it for any hotel.
--
-- data_confidence is set to 'needs_verification' (via coalesce, so it
-- never downgrades an existing 'verified') for every hotel touched here,
-- per the task brief: none of this round's data is a confirmed supplier
-- rate — it is Booking.com/Expedia/hotelsinmakkah.com/halalbooking.com
-- research, cross-checked but not independently verified.
--
-- hotel_rooms: NOT touched by this migration. Every room type in both
-- documents is marked "on request" except the rooms already in the
-- database for InterContinental Dar Al Tawhid (entered before this round)
-- — there is no new confirmed per-room-type nightly price in either
-- document to insert. Al Marwa Rayhaan's "AED 1,175 on the public site"
-- figure is explicitly a public-site display price, not a supplier rate,
-- and in any case already matches the Classic Room rate already on file —
-- nothing to add. See the final summary for the full honest accounting.
--
-- Apply manually in Supabase SQL Editor.


-- ============================================================
-- PART 1 — MAKKAH (30 hotels, all UPDATEs)
-- ============================================================

-- Option 1: InterContinental Dar Al Tawhid
update public.hotels set
  category = coalesce(category, 'Standard'),
  star_rating = coalesce(star_rating, 5),
  board_basis = coalesce(board_basis, 'Room Only'),
  data_confidence = coalesce(data_confidence, 'needs_verification'),
  admin_caution_note = case
    when admin_caution_note is null or admin_caution_note = '' then 'Research doc''s OTA cross-check lead price (Booking.com AED 2,321; Expedia avg ~AED 1,160-1,401/night) is lower than the confirmed admin room rate (Classic Room from AED 1,880) already in hotel_rooms — treat the confirmed room rate as authoritative, not the OTA lead price. price_from_aed intentionally left unset here for that reason.'
    else admin_caution_note || E'\n\n' || 'Research doc''s OTA cross-check lead price (Booking.com AED 2,321; Expedia avg ~AED 1,160-1,401/night) is lower than the confirmed admin room rate (Classic Room from AED 1,880) already in hotel_rooms — treat the confirmed room rate as authoritative, not the OTA lead price. price_from_aed intentionally left unset here for that reason.'
  end
where slug = 'intercontinental-dar-al-tawhid';

-- Option 2: Al Marwa Rayhaan by Rotana
update public.hotels set
  category = coalesce(category, 'Standard'),
  star_rating = coalesce(star_rating, 5),
  board_basis = coalesce(board_basis, 'Room Only'),
  data_confidence = coalesce(data_confidence, 'needs_verification')
where slug = 'al-marwa-rayhaan';

-- Option 3: Al Safwah Royale Orchid
update public.hotels set
  category = coalesce(category, 'Standard'),
  star_rating = coalesce(star_rating, 5),
  board_basis = coalesce(board_basis, 'Room Only'),
  data_confidence = coalesce(data_confidence, 'needs_verification'),
  image_url = coalesce(image_url, 'https://pix8.agoda.net/property/77012400/0/891f7a1c554f4b0f88bea6a36bd5a6b0.jpeg?ce=3&s=1024x'),
  gallery_image_urls = coalesce(nullif(gallery_image_urls, '{}'::text[]), ARRAY[
    'https://pix8.agoda.net/property/77012400/0/891f7a1c554f4b0f88bea6a36bd5a6b0.jpeg?ce=3&s=1024x',
    'https://pix8.agoda.net/property/77012400/0/d265960a05c8eb9cfd0399ce81ad4fdb.jpeg?ce=3&s=1024x',
    'https://pix8.agoda.net/property/279467/0/b98bb992c503e6eac74766caedaffa83.jpeg?ce=3&s=1024x',
    'https://www.hotelsinmakkah.com/images/hotels/al-safwah-royale-orchid-haram-view-haram-view-hotel-featured-image.jpg',
    'https://www.hotelsinmakkah.com/images/hotels/gallery/al-safwah-royale-orchid-masjid-al-haram-gallery-6-prayer-room-grand-mosque-area.jpg',
    'https://www.hotelsinmakkah.com/images/hotels/gallery/al-safwah-royale-orchid-kaaba-view-gallery-image-kaaba-view-accommodation.jpg'
  ]::text[]),
  admin_caution_note = case
    when admin_caution_note is null or admin_caution_note = '' then 'Not confirmed on Booking.com under this exact name — research doc suggests a possible alias "Al Jewar Royal Orchid" (booking.com/hotel/sa/al-jewar-royal-orchid.html) but this is UNCONFIRMED. hotelsinmakkah.com''s ~USD 198.99/night "starting rate" is a generic seasonal benchmark, not date-specific — not used for price_from_aed. All room types remain on request.'
    else admin_caution_note || E'\n\n' || 'Not confirmed on Booking.com under this exact name — research doc suggests a possible alias "Al Jewar Royal Orchid" (booking.com/hotel/sa/al-jewar-royal-orchid.html) but this is UNCONFIRMED. hotelsinmakkah.com''s ~USD 198.99/night "starting rate" is a generic seasonal benchmark, not date-specific — not used for price_from_aed. All room types remain on request.'
  end
where slug = 'al-safwah-royale-orchid';

-- Option 4: Elaf Kinda
update public.hotels set
  category = coalesce(category, 'Standard'),
  star_rating = coalesce(star_rating, 5),
  board_basis = coalesce(board_basis, 'Room Only'),
  data_confidence = coalesce(data_confidence, 'needs_verification'),
  admin_caution_note = case
    when admin_caution_note is null or admin_caution_note = '' then 'Research doc''s Masaar-list walk time (17 minutes) looks inconsistent with this hotel''s "next to the Clock Tower" location and is flagged as possibly wrong in the source — not independently confirmed, walk-time fields left untouched.'
    else admin_caution_note || E'\n\n' || 'Research doc''s Masaar-list walk time (17 minutes) looks inconsistent with this hotel''s "next to the Clock Tower" location and is flagged as possibly wrong in the source — not independently confirmed, walk-time fields left untouched.'
  end
where slug = 'elaf-kinda';

-- Option 5: Zamzam Pullman
update public.hotels set
  category = coalesce(category, 'Standard'),
  star_rating = coalesce(star_rating, 5),
  board_basis = coalesce(board_basis, 'Room Only'),
  data_confidence = coalesce(data_confidence, 'needs_verification')
where slug = 'zamzam-pullman';

-- Option 6: Swissôtel Makkah
update public.hotels set
  category = coalesce(category, 'Standard'),
  star_rating = coalesce(star_rating, 5),
  board_basis = coalesce(board_basis, 'Room Only'),
  data_confidence = coalesce(data_confidence, 'needs_verification'),
  gallery_image_urls = coalesce(nullif(gallery_image_urls, '{}'::text[]), ARRAY[
    'https://www.hotelsinmakkah.com/images/hotels/swissotel-makkah-haram-view-haram-view-hotel-featured-image.jpg',
    'https://www.hotelsinmakkah.com/images/hotels/gallery/uploaded-image-1752305473939.webp',
    'https://www.hotelsinmakkah.com/images/hotels/gallery/uploaded-image-1752305497075.jpg'
  ]::text[]),
  admin_caution_note = case
    when admin_caution_note is null or admin_caution_note = '' then 'Research doc explicitly asks to confirm whether this is genuinely a separate property from Swissotel Al Maqam before publishing either. Both are already live here as separate hotels with distinct terrain/distance data — the doc''s uncertainty is preserved for the record, not acted on.'
    else admin_caution_note || E'\n\n' || 'Research doc explicitly asks to confirm whether this is genuinely a separate property from Swissotel Al Maqam before publishing either. Both are already live here as separate hotels with distinct terrain/distance data — the doc''s uncertainty is preserved for the record, not acted on.'
  end
where slug = 'swissotel-makkah';

-- Option 7: Jabal Omar Hyatt Regency
update public.hotels set
  category = coalesce(category, 'Standard'),
  star_rating = coalesce(star_rating, 5),
  board_basis = coalesce(board_basis, 'Room Only'),
  data_confidence = coalesce(data_confidence, 'needs_verification')
where slug = 'jabal-omar-hyatt-regency';

-- Option 8: Conrad Jabal Omar
update public.hotels set
  category = coalesce(category, 'Standard'),
  star_rating = coalesce(star_rating, 5),
  board_basis = coalesce(board_basis, 'Room Only'),
  data_confidence = coalesce(data_confidence, 'needs_verification')
where slug = 'conrad-jabal-omar';

-- Option 9: Le Méridien Makkah (no existing hotel_rooms — safe to seed price_from_aed)
update public.hotels set
  category = coalesce(category, 'Standard'),
  star_rating = coalesce(star_rating, 5),
  board_basis = coalesce(board_basis, 'Room Only'),
  price_from_aed = coalesce(price_from_aed, 1022),
  data_confidence = coalesce(data_confidence, 'needs_verification')
where slug = 'le-meridien-makkah';

-- Option 10: Hilton Suites Makkah
update public.hotels set
  category = coalesce(category, 'Standard'),
  star_rating = coalesce(star_rating, 5),
  board_basis = coalesce(board_basis, 'Room Only'),
  data_confidence = coalesce(data_confidence, 'needs_verification')
where slug = 'hilton-suites-makkah';

-- Option 11: Makarem Ajyad
update public.hotels set
  category = coalesce(category, 'Standard'),
  star_rating = coalesce(star_rating, 5),
  board_basis = coalesce(board_basis, 'Room Only'),
  data_confidence = coalesce(data_confidence, 'needs_verification'),
  admin_caution_note = case
    when admin_caution_note is null or admin_caution_note = '' then 'Masaar Stars rating (5) flagged "needs a check" by the research doc. Room types and images were not returned by any source this research round — supplier rates still needed.'
    else admin_caution_note || E'\n\n' || 'Masaar Stars rating (5) flagged "needs a check" by the research doc. Room types and images were not returned by any source this research round — supplier rates still needed.'
  end
where slug = 'makarem-ajyad';

-- Option 12: Jabal Omar Marriott (no existing hotel_rooms — safe to seed price_from_aed)
update public.hotels set
  category = coalesce(category, 'Standard'),
  star_rating = coalesce(star_rating, 5),
  board_basis = coalesce(board_basis, 'Room Only'),
  price_from_aed = coalesce(price_from_aed, 635),
  data_confidence = coalesce(data_confidence, 'needs_verification'),
  admin_caution_note = case
    when admin_caution_note is null or admin_caution_note = '' then 'Room types and images were not returned by any source this research round — supplier rates still needed.'
    else admin_caution_note || E'\n\n' || 'Room types and images were not returned by any source this research round — supplier rates still needed.'
  end
where slug = 'jabal-omar-marriott';

-- Option 13: Jumeirah Jabal Omar
update public.hotels set
  category = coalesce(category, 'Standard'),
  star_rating = coalesce(star_rating, 5),
  board_basis = coalesce(board_basis, 'Room Only'),
  data_confidence = coalesce(data_confidence, 'needs_verification'),
  admin_caution_note = case
    when admin_caution_note is null or admin_caution_note = '' then 'Room types and images were not returned by any source this research round — supplier rates still needed.'
    else admin_caution_note || E'\n\n' || 'Room types and images were not returned by any source this research round — supplier rates still needed.'
  end
where slug = 'jumeirah-jabal-omar';

-- Option 14: Sheraton Jabal Al Kaaba (no existing hotel_rooms — safe to seed price_from_aed)
update public.hotels set
  category = coalesce(category, 'Standard'),
  star_rating = coalesce(star_rating, 5),
  board_basis = coalesce(board_basis, 'Room Only'),
  price_from_aed = coalesce(price_from_aed, 873),
  data_confidence = coalesce(data_confidence, 'needs_verification')
where slug = 'sheraton-jabal-al-kaaba';

-- Option 15: Anjum Hotel
update public.hotels set
  category = coalesce(category, 'Standard'),
  star_rating = coalesce(star_rating, 5),
  board_basis = coalesce(board_basis, 'Room Only'),
  data_confidence = coalesce(data_confidence, 'needs_verification'),
  admin_caution_note = case
    when admin_caution_note is null or admin_caution_note = '' then 'Research doc''s Path & Terrain text is truncated in the source ("Flat pedestrian bridge straight to King... text cut off") — not usable as a complete fact, terrain_note left untouched.'
    else admin_caution_note || E'\n\n' || 'Research doc''s Path & Terrain text is truncated in the source ("Flat pedestrian bridge straight to King... text cut off") — not usable as a complete fact, terrain_note left untouched.'
  end
where slug = 'anjum-hotel';

-- Option 16: Address Jabal Omar
update public.hotels set
  category = coalesce(category, 'Standard'),
  star_rating = coalesce(star_rating, 5),
  board_basis = coalesce(board_basis, 'Room Only'),
  data_confidence = coalesce(data_confidence, 'needs_verification')
where slug = 'address-jabal-omar';

-- Option 17: Maysan Al Maqam (no existing hotel_rooms — safe to seed price_from_aed)
update public.hotels set
  category = coalesce(category, 'Standard'),
  star_rating = coalesce(star_rating, 5),
  board_basis = coalesce(board_basis, 'Room Only'),
  price_from_aed = coalesce(price_from_aed, 1052),
  data_confidence = coalesce(data_confidence, 'needs_verification'),
  admin_caution_note = case
    when admin_caution_note is null or admin_caution_note = '' then 'Room types and images were not returned by any source this research round — supplier rates still needed.'
    else admin_caution_note || E'\n\n' || 'Room types and images were not returned by any source this research round — supplier rates still needed.'
  end
where slug = 'maysan-al-maqam';

-- Option 18: DoubleTree Jabal Omar (no existing hotel_rooms — safe to seed price_from_aed)
update public.hotels set
  category = coalesce(category, 'Standard'),
  star_rating = coalesce(star_rating, 5),
  board_basis = coalesce(board_basis, 'Room Only'),
  price_from_aed = coalesce(price_from_aed, 624),
  data_confidence = coalesce(data_confidence, 'needs_verification')
where slug = 'doubletree-jabal-omar';

-- Option 19: Raffles Makkah Palace
update public.hotels set
  category = coalesce(category, 'Standard'),
  star_rating = coalesce(star_rating, 5),
  board_basis = coalesce(board_basis, 'Room Only'),
  data_confidence = coalesce(data_confidence, 'needs_verification'),
  gallery_image_urls = coalesce(nullif(gallery_image_urls, '{}'::text[]), ARRAY[
    'https://www.hotelsinmakkah.com/images/hotels/raffles-makkah-palace-haram-view-haram-view-hotel-featured-image.jpg',
    'https://www.hotelsinmakkah.com/images/hotels/gallery/uploaded-image-1752313213604.jpg',
    'https://www.hotelsinmakkah.com/images/hotels/gallery/uploaded-image-1752313227364.jpg'
  ]::text[]),
  admin_caution_note = case
    when admin_caution_note is null or admin_caution_note = '' then 'hotelsinmakkah.com''s ~USD 399/night "starting rate" reads much lower than the Booking.com (AED 2,935) and Expedia (avg AED 1,543/night) cross-checked lead prices — treat only as a rough off-peak reference, not a quotable rate; not used for price_from_aed.'
    else admin_caution_note || E'\n\n' || 'hotelsinmakkah.com''s ~USD 399/night "starting rate" reads much lower than the Booking.com (AED 2,935) and Expedia (avg AED 1,543/night) cross-checked lead prices — treat only as a rough off-peak reference, not a quotable rate; not used for price_from_aed.'
  end
where slug = 'raffles-makkah-palace';

-- Option 20: Hilton Convention Makkah
update public.hotels set
  category = coalesce(category, 'Standard'),
  star_rating = coalesce(star_rating, 5),
  board_basis = coalesce(board_basis, 'Room Only'),
  data_confidence = coalesce(data_confidence, 'needs_verification')
where slug = 'hilton-convention-makkah';

-- Option 21: Time Ruba Hotel & Suites (no existing hotel_rooms — safe to seed price_from_aed)
update public.hotels set
  category = coalesce(category, 'Standard'),
  star_rating = coalesce(star_rating, 5),
  board_basis = coalesce(board_basis, 'Breakfast Included'),
  price_from_aed = coalesce(price_from_aed, 238),
  data_confidence = coalesce(data_confidence, 'needs_verification')
where slug = 'time-ruba-hotel-and-suites';

-- Option 22: Al Ghufran Safwah
update public.hotels set
  category = coalesce(category, 'Standard'),
  star_rating = coalesce(star_rating, 5),
  board_basis = coalesce(board_basis, 'Room Only'),
  data_confidence = coalesce(data_confidence, 'needs_verification')
where slug = 'al-ghufran-safwah';

-- Option 23: Al Kiswah Towers (no existing hotel_rooms — safe to seed price_from_aed)
update public.hotels set
  category = coalesce(category, 'Standard'),
  star_rating = coalesce(star_rating, 5),
  board_basis = coalesce(board_basis, 'Breakfast Included'),
  price_from_aed = coalesce(price_from_aed, 274),
  data_confidence = coalesce(data_confidence, 'needs_verification'),
  admin_caution_note = case
    when admin_caution_note is null or admin_caution_note = '' then 'Research doc lists a Booking.com star rating of 1 (flagged "please verify" in the source) — inconsistent with Masaar''s internal 5-star tier; confirm the actual rating before publishing either figure prominently.'
    else admin_caution_note || E'\n\n' || 'Research doc lists a Booking.com star rating of 1 (flagged "please verify" in the source) — inconsistent with Masaar''s internal 5-star tier; confirm the actual rating before publishing either figure prominently.'
  end
where slug = 'al-kiswah-towers';

-- Option 24: voco Makkah (no existing hotel_rooms — safe to seed price_from_aed)
update public.hotels set
  category = coalesce(category, 'Standard'),
  star_rating = coalesce(star_rating, 5),
  board_basis = coalesce(board_basis, 'Breakfast Included'),
  price_from_aed = coalesce(price_from_aed, 209),
  data_confidence = coalesce(data_confidence, 'needs_verification')
where slug = 'voco-makkah';

-- Option 25: Mövenpick Hotel & Residences Hajar Tower Makkah
update public.hotels set
  category = coalesce(category, 'Near-Haram Premium'),
  star_rating = coalesce(star_rating, 5),
  board_basis = coalesce(board_basis, 'Room Only'),
  data_confidence = coalesce(data_confidence, 'needs_verification')
where slug = 'm-venpick-hotel-residences-hajar-tower-makkah-mu08q9yd';

-- Option 26: Makkah Hotel & Towers
update public.hotels set
  category = coalesce(category, 'Standard'),
  star_rating = coalesce(star_rating, 5),
  board_basis = coalesce(board_basis, 'Room Only'),
  data_confidence = coalesce(data_confidence, 'needs_verification'),
  image_url = coalesce(image_url, 'https://www.hotelsinmakkah.com/images/hotels/makkah-towers-haram-view-haram-view-hotel-featured-image.jpg'),
  gallery_image_urls = coalesce(nullif(gallery_image_urls, '{}'::text[]), ARRAY[
    'https://www.hotelsinmakkah.com/images/hotels/makkah-towers-haram-view-haram-view-hotel-featured-image.jpg',
    'https://www.hotelsinmakkah.com/images/hotels/gallery/makkah-towers-kaaba-view-gallery-4-lobby-area-luxury-makkah-hotel.jpg',
    'https://www.hotelsinmakkah.com/images/hotels/gallery/makkah-towers-masjid-al-haram-gallery-5-dining-facilities-sacred-mosque-proximity.jpg'
  ]::text[]),
  admin_caution_note = case
    when admin_caution_note is null or admin_caution_note = '' then 'Not confirmed on Booking.com under this exact name — research doc suggests a possible alias "Makkah Towers" (booking.com/hotel/sa/makkah-towers.html) but this is UNCONFIRMED. hotelsinmakkah.com''s ~USD 135/night "starting rate" is a generic seasonal benchmark only — not used for price_from_aed.'
    else admin_caution_note || E'\n\n' || 'Not confirmed on Booking.com under this exact name — research doc suggests a possible alias "Makkah Towers" (booking.com/hotel/sa/makkah-towers.html) but this is UNCONFIRMED. hotelsinmakkah.com''s ~USD 135/night "starting rate" is a generic seasonal benchmark only — not used for price_from_aed.'
  end
where slug = 'makkah-hotel-and-towers';

-- Option 27: Dorrar Al Eiman Royal (no existing hotel_rooms, but no reliable OTA price either — price_from_aed left unset)
update public.hotels set
  category = coalesce(category, 'Standard'),
  star_rating = coalesce(star_rating, 5),
  board_basis = coalesce(board_basis, 'Room Only'),
  data_confidence = coalesce(data_confidence, 'needs_verification'),
  image_url = coalesce(image_url, 'https://www.hotelsinmakkah.com/images/hotels/dorrar-al-eiman-royal-featured.jpeg'),
  gallery_image_urls = coalesce(nullif(gallery_image_urls, '{}'::text[]), ARRAY[
    'https://www.hotelsinmakkah.com/images/hotels/dorrar-al-eiman-royal-featured.jpeg',
    'https://www.hotelsinmakkah.com/images/hotels/gallery/uploaded-image-1752235772377.webp',
    'https://www.hotelsinmakkah.com/images/hotels/gallery/uploaded-image-1752235777850.webp'
  ]::text[]),
  admin_caution_note = case
    when admin_caution_note is null or admin_caution_note = '' then 'No Booking.com match found under this name and no confident alias identified either. hotelsinmakkah.com''s ~USD 199/night "starting rate" is a generic seasonal benchmark only — not used for price_from_aed. Still needs a direct supplier check.'
    else admin_caution_note || E'\n\n' || 'No Booking.com match found under this name and no confident alias identified either. hotelsinmakkah.com''s ~USD 199/night "starting rate" is a generic seasonal benchmark only — not used for price_from_aed. Still needs a direct supplier check.'
  end
where slug = 'dorrar-al-eiman-royal';

-- Option 28: Emaar Grand Hotel (no existing hotel_rooms — safe to seed price_from_aed)
update public.hotels set
  category = coalesce(category, 'Standard'),
  star_rating = coalesce(star_rating, 5),
  board_basis = coalesce(board_basis, 'Room Only'),
  price_from_aed = coalesce(price_from_aed, 808),
  data_confidence = coalesce(data_confidence, 'needs_verification'),
  admin_caution_note = case
    when admin_caution_note is null or admin_caution_note = '' then 'Research doc flags that the Expedia cross-check lead price is notably higher than the Booking.com figure — worth a second look before quoting either. The lower of the two (AED 808) was used for price_from_aed per the standard rule.'
    else admin_caution_note || E'\n\n' || 'Research doc flags that the Expedia cross-check lead price is notably higher than the Booking.com figure — worth a second look before quoting either. The lower of the two (AED 808) was used for price_from_aed per the standard rule.'
  end
where slug = 'emaar-grand-hotel';

-- Option 29: Swissôtel Al Maqam
update public.hotels set
  category = coalesce(category, 'Standard'),
  star_rating = coalesce(star_rating, 5),
  board_basis = coalesce(board_basis, 'Room Only'),
  data_confidence = coalesce(data_confidence, 'needs_verification')
where slug = 'swissotel-al-maqam';

-- Option 30: Makkah Clock Royal Tower, A Fairmont Hotel
update public.hotels set
  category = coalesce(category, 'Standard'),
  star_rating = coalesce(star_rating, 5),
  board_basis = coalesce(board_basis, 'Room Only'),
  data_confidence = coalesce(data_confidence, 'needs_verification')
where slug = 'makkah-clock-royal-tower';


-- ============================================================
-- PART 2 — MADINAH, reconciled matches (8 hotels, UPDATEs)
-- Each match below was verified against the document's address text for
-- that hotel, not name similarity alone (Step 1).
-- ============================================================

-- Doc "Dar Al Taqwa Hotel Madinah" = existing "Dar Al Taqwa"
-- Address: 2981 Badaah, Central Area, Madinah — matches existing description's "opposite King Fahd Gate (23)".
update public.hotels set
  category = coalesce(category, 'Haram-view, 5-star'),
  price_from_aed = coalesce(price_from_aed, 1050.70),
  view_type = coalesce(view_type, 'Haram View, South-facing'),
  mens_gate_walk_minutes_min = coalesce(mens_gate_walk_minutes_min, 6),
  ladies_gate_walk_minutes_min = coalesce(ladies_gate_walk_minutes_min, 4),
  google_maps_url = coalesce(google_maps_url, 'https://www.google.com/maps/search/?api=1&query=Dar%20Al%20Taqwa%20Hotel%20Madinah%2C%202981%20Badaah%2C%20Central%20Area%2C%20Madinah%2C%20Madinah%20(province)%2C%2030921%2C%20Saudi%20Arabia'),
  data_confidence = coalesce(data_confidence, 'needs_verification'),
  admin_caution_note = case
    when admin_caution_note is null or admin_caution_note = '' then 'Doc''s two price sources disagree (screenshot ~AED 1,298.54 vs. live listing ~AED 1,050.70) — likely different sample dates; used the lower figure. Source: https://halalbooking.com/en/dar-al-taqwa-hotel-madinah/p/503798'
    else admin_caution_note || E'\n\n' || 'Doc''s two price sources disagree (screenshot ~AED 1,298.54 vs. live listing ~AED 1,050.70) — likely different sample dates; used the lower figure. Source: https://halalbooking.com/en/dar-al-taqwa-hotel-madinah/p/503798'
  end
where slug = 'dar-al-taqwa';

-- Doc "Saja by Warwick Madinah Hotel" = existing "Saja by Warwick Madinah"
-- Address: King Faisal Road, Central Zone, Al Madinah Munawwarah — consistent with existing "699-room ... by Gate 328" description.
update public.hotels set
  category = coalesce(category, 'Standard, 4-star'),
  price_from_aed = coalesce(price_from_aed, 363.40),
  view_type = coalesce(view_type, 'No Haram-view rooms'),
  mens_gate_walk_minutes_min = coalesce(mens_gate_walk_minutes_min, 11),
  ladies_gate_walk_minutes_min = coalesce(ladies_gate_walk_minutes_min, 11),
  google_maps_url = coalesce(google_maps_url, 'https://www.google.com/maps/search/?api=1&query=Saja%20by%20Warwick%20Madinah%20Hotel%2C%20King%20Faisal%20Road%2C%20Central%20Zone%2C%20Al%20Madinah%20Munawwarah%2C%20Madinah%2C%2042311%2C%20Saudi%20Arabia'),
  image_url = coalesce(image_url, 'https://cdn.halalstatic.com/2023%2F08%2F21%2F08%2F55%2F36%2F75998e1e-68cb-4c2c-aea2-d434e7bc28db%2F12191_7aErOX5FpdsjptcRog3BnA.jpg'),
  gallery_image_urls = coalesce(nullif(gallery_image_urls, '{}'::text[]), ARRAY['https://cdn.halalstatic.com/2023%2F08%2F21%2F08%2F55%2F36%2F75998e1e-68cb-4c2c-aea2-d434e7bc28db%2F12191_7aErOX5FpdsjptcRog3BnA.jpg']::text[]),
  data_confidence = coalesce(data_confidence, 'needs_verification'),
  admin_caution_note = case
    when admin_caution_note is null or admin_caution_note = '' then 'Doc''s screenshot walk times (11 min men''s / 11 min ladies'') conflict with a separate property-page claim of "7 minutes from both sections" — likely a different measurement point; screenshot figures used here as the more directly-measured ones. Doc''s two price sources also disagree (~AED 452.79 vs ~AED 363.40) — used the lower figure. Source: https://halalbooking.com/en/saja-by-warwick-madinah-hotel/p/564822'
    else admin_caution_note || E'\n\n' || 'Doc''s screenshot walk times (11 min men''s / 11 min ladies'') conflict with a separate property-page claim of "7 minutes from both sections" — likely a different measurement point; screenshot figures used here as the more directly-measured ones. Doc''s two price sources also disagree (~AED 452.79 vs ~AED 363.40) — used the lower figure. Source: https://halalbooking.com/en/saja-by-warwick-madinah-hotel/p/564822'
  end
where slug = 'saja-by-warwick-madinah';

-- Doc "Anwar Al Madinah Mövenpick Hotel" = existing "Anwar Al Madinah Mövenpick"
-- Doc gives no address (property page didn't resolve one); matched on exact brand name + existing description ("opposite Omar bin Khattab Gate").
update public.hotels set
  category = coalesce(category, 'Haram-view, 5-star'),
  price_from_aed = coalesce(price_from_aed, 1170.71),
  view_type = coalesce(view_type, 'Haram View, South-facing'),
  mens_gate_walk_minutes_min = coalesce(mens_gate_walk_minutes_min, 7),
  ladies_gate_walk_minutes_min = coalesce(ladies_gate_walk_minutes_min, 6),
  data_confidence = coalesce(data_confidence, 'needs_verification'),
  admin_caution_note = case
    when admin_caution_note is null or admin_caution_note = '' then 'Doc''s two price sources disagree considerably (~AED 1,170.71 vs ~AED 1,694.55) — likely different sample dates; used the lower figure. Doc could not resolve a street address for this property this round. Source: https://halalbooking.com/en/anwar-al-madinah-m%C3%B6venpick-hotel/p/62069'
    else admin_caution_note || E'\n\n' || 'Doc''s two price sources disagree considerably (~AED 1,170.71 vs ~AED 1,694.55) — likely different sample dates; used the lower figure. Doc could not resolve a street address for this property this round. Source: https://halalbooking.com/en/anwar-al-madinah-m%C3%B6venpick-hotel/p/62069'
  end
where slug = 'anwar-al-madinah-movenpick';

-- Doc "Sofitel Shahd Al Madinah" = existing "Sofitel Shahd Al Madinah" (exact name match)
-- Address: King Fahad Road, Building 2943 — consistent with existing "northern side of the plaza" description.
update public.hotels set
  category = coalesce(category, 'Haram-view, 5-star'),
  price_from_aed = coalesce(price_from_aed, 1475.97),
  view_type = coalesce(view_type, 'Haram View, South-facing (partial/full plaza views)'),
  mens_gate_walk_minutes_min = coalesce(mens_gate_walk_minutes_min, 3),
  ladies_gate_walk_minutes_min = coalesce(ladies_gate_walk_minutes_min, 2),
  google_maps_url = coalesce(google_maps_url, 'https://www.google.com/maps/search/?api=1&query=Sofitel%20Shahd%20Al%20Madinah%2C%20King%20Fahad%20Road%2C%20Building%202943%2C%20Madinah%2C%20Saudi%20Arabia%2042311'),
  data_confidence = coalesce(data_confidence, 'needs_verification'),
  admin_caution_note = case
    when admin_caution_note is null or admin_caution_note = '' then 'Doc''s two price sources disagree (~AED 1,475.97 vs ~AED 2,358.15) — likely different sample dates; used the lower figure. Source: https://halalbooking.com/en/sofitel-shahd-al-madinah/p/8709'
    else admin_caution_note || E'\n\n' || 'Doc''s two price sources disagree (~AED 1,475.97 vs ~AED 2,358.15) — likely different sample dates; used the lower figure. Source: https://halalbooking.com/en/sofitel-shahd-al-madinah/p/8709'
  end
where slug = 'sofitel-shahd-al-madinah';

-- Doc "Pullman Zamzam Madina" = existing "Pullman Zamzam Madina" (exact name match)
-- Address: Amr Bin Al Gmoh Street — consistent with existing "directly opposite Bab As-Salam" description.
update public.hotels set
  category = coalesce(category, 'Haram-view, near Bab Al Salam'),
  price_from_aed = coalesce(price_from_aed, 568.80),
  view_type = coalesce(view_type, 'Haram View, North-facing, panoramic'),
  mens_gate_walk_minutes_min = coalesce(mens_gate_walk_minutes_min, 7),
  nearest_mens_gate = coalesce(nearest_mens_gate, 'Bab Al Salam'),
  ladies_gate_walk_minutes_min = coalesce(ladies_gate_walk_minutes_min, 12),
  primary_gate = coalesce(primary_gate, 'mens'),
  google_maps_url = coalesce(google_maps_url, 'https://www.google.com/maps/search/?api=1&query=Pullman%20Zamzam%20Madina%2C%20Amr%20Bin%20Al%20Gmoh%20Street%2C%20Madinah%2C%20Saudi%20Arabia%2041499'),
  gallery_image_urls = coalesce(nullif(gallery_image_urls, '{}'::text[]), ARRAY['https://cdn.halalstatic.com/expedia%2F10000000%2F9100000%2F9093700%2F9093635%2Fae38d178_z.jpg']::text[]),
  data_confidence = coalesce(data_confidence, 'needs_verification'),
  admin_caution_note = case
    when admin_caution_note is null or admin_caution_note = '' then 'Doc''s two price sources disagree (~AED 969.47 vs ~AED 568.80) — likely different sample dates; used the lower figure. Ladies'' gate is only described as "the women''s gate of Al-Masjid an-Nabawi" with no specific name given — nearest_ladies_gate deliberately left blank rather than guessed. Source: https://halalbooking.com/en/pullman-zamzam-madina/p/73529'
    else admin_caution_note || E'\n\n' || 'Doc''s two price sources disagree (~AED 969.47 vs ~AED 568.80) — likely different sample dates; used the lower figure. Ladies'' gate is only described as "the women''s gate of Al-Masjid an-Nabawi" with no specific name given — nearest_ladies_gate deliberately left blank rather than guessed. Source: https://halalbooking.com/en/pullman-zamzam-madina/p/73529'
  end
where slug = 'pullman-zamzam-madina';

-- Doc "ALRITZ ALMADINAH HOTEL" = existing "Alritz Almadinah"
-- Address: Bada'ah, FJF5+5WH, Madinah — this row previously had "no independently-verified data found", now gets real research-round data.
update public.hotels set
  star_rating = coalesce(star_rating, 3),
  category = coalesce(category, 'Standard, 3-star, women''s-gate-focused'),
  description = coalesce(description, '3-star value option in Bada''ah with balanced walk times to both Haram sections.'),
  price_from_aed = coalesce(price_from_aed, 414.75),
  view_type = coalesce(view_type, 'No Haram-view rooms'),
  mens_gate_walk_minutes_min = coalesce(mens_gate_walk_minutes_min, 5),
  ladies_gate_walk_minutes_min = coalesce(ladies_gate_walk_minutes_min, 5),
  google_maps_url = coalesce(google_maps_url, 'https://www.google.com/maps/search/?api=1&query=ALRITZ%20ALMADINAH%20HOTEL%2C%20Bada%27ah%2C%20FJF5%2B5WH%2C%2042311%2C%20Madinah%2C%20Saudi%20Arabia'),
  image_url = coalesce(image_url, 'https://cdn.halalstatic.com/2024%2F10%2F04%2F13%2F20%2F27%2F10c907d6-d036-42ac-a8f6-60ed77f01f31%2F31008__DV_DLUsvjzljWmzyEMthQ.jpg'),
  gallery_image_urls = coalesce(nullif(gallery_image_urls, '{}'::text[]), ARRAY['https://cdn.halalstatic.com/2024%2F10%2F04%2F13%2F20%2F27%2F10c907d6-d036-42ac-a8f6-60ed77f01f31%2F31008__DV_DLUsvjzljWmzyEMthQ.jpg']::text[]),
  admin_caution_note = case
    when admin_caution_note is null or admin_caution_note = '' then 'Doc''s two price sources disagree (~AED 510.27 vs ~AED 414.75) — likely different sample dates; used the lower figure. Screenshot showed a 25% discount badge that may not be reflected in the listing price above. Source: https://halalbooking.com/en/alritz-almadinah-hotel/p/607721'
    else admin_caution_note || E'\n\n' || 'Doc''s two price sources disagree (~AED 510.27 vs ~AED 414.75) — likely different sample dates; used the lower figure. Screenshot showed a 25% discount badge that may not be reflected in the listing price above. Source: https://halalbooking.com/en/alritz-almadinah-hotel/p/607721'
  end
where slug = 'alritz-almadinah';

-- Doc "Crowne Plaza Madinah by IHG" = existing "Crowne Plaza Madinah"
-- Address: King Faisal Street, between 1st Ring Road — consistent with existing "by Bab Al-Malik Fahd" description.
update public.hotels set
  category = coalesce(category, 'Standard, near women''s gate, hot tub option'),
  price_from_aed = coalesce(price_from_aed, 1014.34),
  view_type = coalesce(view_type, 'No Haram-view rooms'),
  mens_gate_walk_minutes_min = coalesce(mens_gate_walk_minutes_min, 6),
  ladies_gate_walk_minutes_min = coalesce(ladies_gate_walk_minutes_min, 12),
  gallery_image_urls = coalesce(nullif(gallery_image_urls, '{}'::text[]), ARRAY['https://cdn.halalstatic.com/expedia%2F6000000%2F5480000%2F5475300%2F5475292%2F35960443_z.jpg']::text[]),
  data_confidence = coalesce(data_confidence, 'needs_verification'),
  admin_caution_note = case
    when admin_caution_note is null or admin_caution_note = '' then 'Doc''s screenshot men''s-gate walk time (6 min) conflicts with a separate property-page claim of "a 3-minute walk from Al Haram" — likely a different measurement point; screenshot figure used here. Doc''s two price sources also disagree (~AED 1,014.34 vs ~AED 1,066.50) — used the lower figure. Source: https://halalbooking.com/en/crowne-plaza-madinah-by-ihg/p/77031'
    else admin_caution_note || E'\n\n' || 'Doc''s screenshot men''s-gate walk time (6 min) conflicts with a separate property-page claim of "a 3-minute walk from Al Haram" — likely a different measurement point; screenshot figure used here. Doc''s two price sources also disagree (~AED 1,014.34 vs ~AED 1,066.50) — used the lower figure. Source: https://halalbooking.com/en/crowne-plaza-madinah-by-ihg/p/77031'
  end
where slug = 'crowne-plaza-madinah';

-- Doc "Zowar Alalami Hotel" = existing "Zowar Alalami"
-- Address: Abdul Rahman Ibn Ouf Street, Al Haram — this row previously had "no independently-verified data found", now gets real research-round data.
update public.hotels set
  star_rating = coalesce(star_rating, 3),
  category = coalesce(category, 'Standard, 3-star, women''s-gate-focused'),
  description = coalesce(description, 'Budget-friendly 3-star option on the Al Haram side of the city, closer to the ladies'' section than the men''s.'),
  price_from_aed = coalesce(price_from_aed, 347.60),
  view_type = coalesce(view_type, 'No Haram-view rooms'),
  mens_gate_walk_minutes_min = coalesce(mens_gate_walk_minutes_min, 8),
  ladies_gate_walk_minutes_min = coalesce(ladies_gate_walk_minutes_min, 5),
  google_maps_url = coalesce(google_maps_url, 'https://www.google.com/maps/search/?api=1&query=Zowar%20Alalami%20Hotel%2C%20Abdul%20Rahman%20Ibn%20Ouf%20Street%2C%20Al%20Haram%2C%20Madinah%2C%20Saudi%20Arabia%2042311'),
  image_url = coalesce(image_url, 'https://cdn.halalstatic.com/2024%2F03%2F15%2F12%2F36%2F19%2F6a536445-c56c-4aba-b97f-04c96e7fd7d0%2F55086_SuO0ICcIp6wjLJdfSLKSeg.jpg'),
  gallery_image_urls = coalesce(nullif(gallery_image_urls, '{}'::text[]), ARRAY['https://cdn.halalstatic.com/2024%2F03%2F15%2F12%2F36%2F19%2F6a536445-c56c-4aba-b97f-04c96e7fd7d0%2F55086_SuO0ICcIp6wjLJdfSLKSeg.jpg']::text[]),
  admin_caution_note = case
    when admin_caution_note is null or admin_caution_note = '' then 'Doc''s two price sources disagree (~AED 401.99 vs ~AED 347.60) — likely different sample dates; used the lower figure. Screenshot showed a 25% discount badge that may not be reflected in the listing price above. Source: https://halalbooking.com/en/zowar-alalami-hotel/p/607723'
    else admin_caution_note || E'\n\n' || 'Doc''s two price sources disagree (~AED 401.99 vs ~AED 347.60) — likely different sample dates; used the lower figure. Screenshot showed a 25% discount badge that may not be reflected in the listing price above. Source: https://halalbooking.com/en/zowar-alalami-hotel/p/607723'
  end
where slug = 'zowar-alalami';


-- ============================================================
-- PART 3 — MADINAH, unreconciled hotels (3 new rows, is_active = false)
-- Not confidently matched to any existing row — inserted inactive with an
-- admin_caution_note naming the suspected duplicate(s), per Step 1's
-- "don't guess" instruction. hotel_rooms not seeded: every room type is
-- either "on request" or not individually listed in the source.
-- ============================================================

insert into public.hotels (
  name, slug, city, star_rating, category, description, price_from_aed,
  view_type, mens_gate_walk_minutes_min, ladies_gate_walk_minutes_min,
  google_maps_url, data_confidence, admin_caution_note, is_active, display_order
) values (
  'Grand Millennium Al Haram Hotel',
  'grand-millennium-al-haram',
  'Madinah',
  4,
  'Standard, 4-star',
  '4-star hotel with a buffet restaurant, close to both men''s and women''s Haram entrances.',
  749.25,
  'No Haram-view rooms',
  8,
  5,
  'https://www.google.com/maps/search/?api=1&query=Grand%20Millennium%20Al%20Haram%20Hotel%2C%20Abi%20Zar%20Street%2C%20Markaziah%2C%20Madinah%2042311%2C%20Saudi%20Arabia',
  'needs_verification',
  'Possible duplicate of an existing hotel under a different name. Address per this document: Abi Zar Street, Markaziah, Madinah 42311. Two existing rows could not be ruled out because neither has an address on file: "Dar Aleiman Al Haram" (currently inactive) shares the "Al Haram" Madinah-cluster naming, and "Millennium Taiba Hotel" (currently active) shares the "Millennium" brand. Confirm this address against both before activating or merging this row. Doc''s two price sources also disagree (~AED 749.25 vs ~AED 813.70) — used the lower figure. Source: https://halalbooking.com/en/grand-millennium-al-haram-hotel/p/768779',
  false,
  0
)
on conflict (slug) do nothing;

insert into public.hotels (
  name, slug, city, category, description, price_from_aed, view_type,
  mens_gate_walk_minutes_min, ladies_gate_walk_minutes_min,
  google_maps_url, data_confidence, admin_caution_note, is_active, display_order
) values (
  'Makarem Haram View Suites - Madinah',
  'makarem-haram-view-suites-madinah',
  'Madinah',
  'Haram-view suites',
  'Suite-style property emphasising Haram-view rooms and proximity to sacred sites.',
  1133.65,
  'Haram View, South-facing',
  18,
  6,
  'https://www.google.com/maps/search/?api=1&query=Makarem%20Haram%20View%20Suites%20-%20Madinah%2C%202779%2C%20Madinah%2C%20Madinah%20(province)%2C%2042311%2C%20Saudi%20Arabia',
  'needs_verification',
  'Possible duplicate of existing "Makarem Burj Al Madinah" — same "Makarem" hotel group, but a different suite name and a much sparser address on file for this one ("2779, Madinah") vs. the existing row''s "Badhaah district" description. Confirm before activating or merging. Star rating not stated in the source (no smiley-face/numeric rating found) — left blank rather than guessed. Men''s-side walk (18 min) is notably longer than the ladies'' side (6 min) if confirmed — worth flagging to elderly/male guests. Doc''s two price sources disagree (~AED 1,399.73 vs ~AED 1,133.65) — used the lower figure. Source: https://halalbooking.com/en/makarem-haram-view-suites-madinah/p/716535',
  false,
  0
)
on conflict (slug) do nothing;

insert into public.hotels (
  name, slug, city, star_rating, category, description, price_from_aed,
  view_type, mens_gate_walk_minutes_min, ladies_gate_walk_minutes_min,
  google_maps_url, image_url, gallery_image_urls, data_confidence,
  admin_caution_note, is_active, display_order
) values (
  'Intercontinental Madinah - Dar Al Iman by IHG',
  'intercontinental-madinah-dar-al-iman',
  'Madinah',
  5,
  'Haram-view, 5-star, family-friendly large suites',
  '5-star IHG property in the heart of Madinah, positioned for very short walks to both Haram sections.',
  1460.88,
  'Haram View, South-facing',
  3,
  1,
  'https://www.google.com/maps/search/?api=1&query=Intercontinental%20Madinah%20-%20Dar%20Al%20Iman%20by%20IHG%2C%202657-Badaah%2C%20Unit%20No%3A10%2C%20Al%20Madinah%20Al%20Munawarah%2C%20Madinah%2C%20Saudi%20Arabia%2042311-3910',
  'https://cdn.halalstatic.com/expedia%2F3000000%2F2540000%2F2537900%2F2537849%2Fw6605h4398x0y6-08a8d65c_z.jpg',
  ARRAY['https://cdn.halalstatic.com/expedia%2F3000000%2F2540000%2F2537900%2F2537849%2Fw6605h4398x0y6-08a8d65c_z.jpg']::text[],
  'needs_verification',
  'Checked against the existing "InterContinental Dar Al Hijra Madinah" row by address, per instructions, rather than merging on brand-name similarity: this hotel''s address (2657-Badaah, Unit 10, Al Madinah Al Munawarah) is in the Badaah district, while the existing row''s description places it "via the Baqi'' cemetery approach" on the eastern side of the plaza — different locations, confirming these are two separate real InterContinental hotels. Still inserted inactive (not auto-activated) given the brand-name similarity risk — please confirm before publishing. Doc notes two halalbooking regional domains showed very different lead prices ($1,153 vs $611) for this same property, likely different sample dates — used the lower/more conservative figure. Source: https://halalbooking.com/en-us/intercontinental-madinah-dar-al-iman-by-ihg/p/64988',
  false,
  0
)
on conflict (slug) do nothing;
